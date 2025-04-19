import { Duplex, DuplexOptions } from 'readable-stream';
import { Porcupine } from '@picovoice/porcupine-web';
import context from '../../context';

const logger = context.logger.tags('[WakeWordStreamer]');

export class WakeWordStreamer extends Duplex {
  // 添加一个缓冲区存储剩余的样本
  private remainingSamples: Int16Array | null = null;
  // 添加计数器以跟踪处理的帧数
  private processedFrameCount = 0;
  // 添加音频统计信息
  private maxLevel = 0;
  private framesSinceLog = 0;
  // 添加一个更大的缓冲区，用于存储更多的历史音频数据
  private audioBuffer: Int16Array | null = null;
  private readonly bufferSize = 8192; // 存储更多的历史数据，提高检测稳定性
  private bufferPosition = 0;

  constructor(public porcupine: Porcupine, options?: DuplexOptions) {
    super(options);
    // 记录Porcupine初始化信息
    logger.info(`Porcupine initialized with frameLength: ${this.porcupine.frameLength}, sampleRate: ${this.porcupine.sampleRate}`);
    // 初始化音频缓冲区
    this.audioBuffer = new Int16Array(this.bufferSize);
  }

  private addToBuffer(samples: Int16Array): void {
    if (!this.audioBuffer) return;
    
    // 计算可以添加到缓冲区的样本数量
    const samplesToCopy = Math.min(samples.length, this.bufferSize - this.bufferPosition);
    
    // 将样本添加到缓冲区
    for (let i = 0; i < samplesToCopy; i++) {
      this.audioBuffer[this.bufferPosition++] = samples[i];
    }
    
    // 如果缓冲区已满，将旧数据移出以腾出空间
    if (this.bufferPosition >= this.bufferSize || samplesToCopy < samples.length) {
      // 计算需要移出的样本数
      const samplesToShift = Math.max(this.porcupine.frameLength * 2, samples.length - samplesToCopy);
      
      // 移动缓冲区数据，丢弃最旧的数据
      if (samplesToShift < this.bufferPosition) {
        for (let i = 0; i < this.bufferPosition - samplesToShift; i++) {
          this.audioBuffer[i] = this.audioBuffer[i + samplesToShift];
        }
        this.bufferPosition -= samplesToShift;
      } else {
        // 如果需要移出的样本数大于缓冲区数据量，直接清空缓冲区
        this.bufferPosition = 0;
      }
      
      // 添加剩余的样本（如果有）
      if (samplesToCopy < samples.length) {
        this.addToBuffer(samples.subarray(samplesToCopy));
      }
    }
  }

  // 简单的降噪处理：去除低于阈值的噪声
  private denoise(samples: Int16Array, threshold: number = 500): Int16Array {
    const result = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      // 如果样本值低于阈值，将其视为噪声并降低
      if (Math.abs(samples[i]) < threshold) {
        result[i] = 0; // 或者可以设置为一个很小的值，而不是完全消除
      } else {
        result[i] = samples[i];
      }
    }
    return result;
  }

  public _write(
    chunk: AudioBuffer,
    encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    try {
      // 从 AudioBuffer 获取 Float32Array 数据
      const floatData = chunk.getChannelData(0);
      
      // 计算音频电平以确保有足够的音量
      let sum = 0;
      let max = 0;
      for (let i = 0; i < floatData.length; i++) {
        const abs = Math.abs(floatData[i]);
        sum += abs;
        if (abs > max) max = abs;
      }
      const avgLevel = sum / floatData.length;
      this.maxLevel = Math.max(this.maxLevel, max);
      this.framesSinceLog++;
      
      // 每处理100帧记录一次音频统计信息
      if (this.framesSinceLog >= 100) {
        logger.info(`Audio stats - Avg level: ${avgLevel.toFixed(4)}, Max level: ${this.maxLevel.toFixed(4)}, Processed frames: ${this.processedFrameCount}`);
        this.framesSinceLog = 0;
        this.maxLevel = 0;
      }
      
      // 将 Float32Array 转换为 Int16Array (Porcupine需要这种格式)
      const int16Data = new Int16Array(floatData.length);
      for (let i = 0; i < floatData.length; i++) {
        // 将 -1.0 到 1.0 的浮点数转换为 -32768 到 32767 的整数
        int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(floatData[i] * 32767)));
      }
      
      // 添加到历史音频缓冲区
      this.addToBuffer(int16Data);
      
      // 获取 Porcupine 的帧长度
      const frameLength = this.porcupine.frameLength;
      
      // 如果有剩余样本，将它们与当前样本合并
      let processData: Int16Array;
      if (this.remainingSamples && this.remainingSamples.length > 0) {
        // 创建一个新数组，包含剩余样本和当前样本
        processData = new Int16Array(this.remainingSamples.length + int16Data.length);
        processData.set(this.remainingSamples, 0);
        processData.set(int16Data, this.remainingSamples.length);
        logger.debug(`Merged ${this.remainingSamples.length} remaining samples with ${int16Data.length} new samples.`);
        this.remainingSamples = null; // 清空剩余样本缓冲区
      } else {
        processData = int16Data;
      }
      
      // 对音频数据进行降噪处理
      // 注意：降噪可能会影响识别率，如果降噪后识别率降低，可以注释掉这一行
      // processData = this.denoise(processData);
      
      // 处理完整的帧
      const fullFrameCount = Math.floor(processData.length / frameLength);
      logger.debug(`Processing ${fullFrameCount} complete frames out of ${processData.length} samples.`);
      
      // 如果平均音量太低，跳过处理以减少CPU使用
      if (avgLevel < 0.001) {
        logger.debug('Audio level too low, skipping processing');
        callback();
        return;
      }
      
      // 增加重叠处理：每次处理一帧，但步进量小于一帧，这样可以增加检测机会
      // 例如，使用半帧的步进量
      const step = Math.floor(frameLength / 2);
      
      // 使用滑动窗口进行处理，增加检测机会
      for (let i = 0; i <= processData.length - frameLength; i += step) {
        const frame = processData.subarray(i, i + frameLength);
        
        // 处理音频帧前记录调试信息
        if (i === 0 && this.processedFrameCount % 100 === 0) {
          const frameData = Array.from(frame).slice(0, 5); // 只显示前5个样本
          logger.debug(`Processing frame #${this.processedFrameCount}, first 5 samples: [${frameData.join(', ')}]`);
        }
        
        try {
          // 使用try-catch单独捕获每个帧处理可能的错误
          this.porcupine.process(frame);
          this.processedFrameCount++;
        } catch (frameError) {
          logger.error(`Error processing frame #${this.processedFrameCount}:`, { 
            error: frameError instanceof Error ? frameError.message : String(frameError),
            frameLength: frame.length
          });
        }
      }
      
      // 保存剩余的样本（使用滑动窗口处理后，这里的逻辑需要调整）
      const remainingCount = processData.length % step;
      const startPos = processData.length - remainingCount;
      
      if (remainingCount > 0) {
        this.remainingSamples = new Int16Array(remainingCount);
        this.remainingSamples.set(processData.subarray(startPos));
        logger.debug(`Saved ${remainingCount} remaining samples for next processing.`);
      }
      
      callback();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Audio process error:', { error: error.message, stack: error.stack });
      callback(error);
    }
  }

  public _read(size: number): void {
    this.push(null);
  }
}
import { Duplex, DuplexOptions } from 'readable-stream';
import { Porcupine } from '@picovoice/porcupine-web';
import context from '../../context';

const logger = context.logger.tags('[WakeWordStreamer]');

export class WakeWordStreamer extends Duplex {
  constructor(public porcupine: Porcupine, options?: DuplexOptions) {
    super(options);
  }

  public _write(
    chunk: AudioBuffer,
    encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    try {
      // 从 AudioBuffer 获取 Float32Array 数据
      const floatData = chunk.getChannelData(0);
      
      // 将 Float32Array 转换为 Int16Array (Porcupine需要这种格式)
      const int16Data = new Int16Array(floatData.length);
      for (let i = 0; i < floatData.length; i++) {
        // 将 -1.0 到 1.0 的浮点数转换为 -32768 到 32767 的整数
        int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(floatData[i] * 32767)));
      }
      
      // 将转换后的数据传给 Porcupine 处理
      this.porcupine.process(int16Data);
      
      callback();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('音频转换失败', { error });
      callback(error);
    }
  }

  public _read(size: number): void {
    this.push(null);
  }
}
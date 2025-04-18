import { Porcupine, BuiltInKeyword, PorcupineErrors } from '@picovoice/porcupine-web';
import context from '../../context';

const logger = context.logger.tags('[WakeWordModel]');

export interface WakeWordModelOptions {
  accessKey: string;
  onWakeWord?: (keyword: string) => void;
  onError?: (error: Error) => void;
}

export class WakeWordModel {
  private porcupineInstance: Porcupine | null = null;

  constructor(private options: WakeWordModelOptions) {}

  // 初始化 Porcupine
  public async load() {
    try {
      // 定义回调函数，当检测到唤醒词时执行
      const keywordDetectionCallback = (keyword: { label: string }) => {
        logger.info(`检测到唤醒词: ${keyword.label}`);
        if (this.options.onWakeWord) {
          this.options.onWakeWord(keyword.label);
        }
      };

      // 定义错误回调
      const processErrorCallback = (error: PorcupineErrors.PorcupineError) => {
        logger.error('Porcupine 处理错误:', {
            error,
        });
        if (this.options.onError) {
          this.options.onError(new Error(error.message));
        }
      };

      // 创建选项对象
      const options = {
        processErrorCallback
      };

      // 使用内置唤醒词初始化 Porcupine
      this.porcupineInstance = await Porcupine.create(
        this.options.accessKey,
        { builtin: BuiltInKeyword.Porcupine },  // 使用内置的 "porcupine" 唤醒词
        keywordDetectionCallback,
        {}, // 使用默认模型
        options
      );

      logger.info('Porcupine 初始化成功');
      return this.porcupineInstance;
    } catch (error) {
      logger.error('Porcupine 初始化失败:', { error });
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  // 释放资源
  public async unload() {
    if (this.porcupineInstance) {
      await this.porcupineInstance.release();
      this.porcupineInstance = null;
      logger.info('Porcupine 资源已释放');
    }
  }

  public getPorcupineInstance() {
    return this.porcupineInstance;
  }
}
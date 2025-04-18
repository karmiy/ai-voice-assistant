import { WakeWordStreamer } from '../utils/wakeWordStreamer';
import { WakeWordModel, WakeWordModelOptions } from '../utils/wakeWordModel';
import { micAudioManager } from '../../input/manager/micAudioManager';
import context from '../../context';

const logger = context.logger.tags('[WakeWordManager]');

class WakeWordManager {
  private _model: WakeWordModel | null = null;
  private _streamer: WakeWordStreamer | null = null;
  private _subscribers = new Set<WakeWordModelOptions>();
  private _isActive = false;

  async start(options: WakeWordModelOptions) {
    try {
      // 添加订阅者
      this._subscribers.add(options);
      
      // 如果已经激活，直接返回停止函数
      if (this._isActive && this._model) {
        return () => {
          this._subscribers.delete(options);
          // 如果没有更多订阅者，停止服务
          if (this._subscribers.size === 0) {
            this.stop();
          }
        };
      }
      
      // 如果有现有模型，先停止并清理
      await this.stop();

      // 创建新模型
      this._model = new WakeWordModel(options);
      
      // 加载模型
      const porcupineInstance = await this._model.load();
      
      // 创建音频流处理器
      this._streamer = new WakeWordStreamer(porcupineInstance);
      
      // 加载麦克风
      await micAudioManager.load();
      
      // 注册流处理器到音频管理器
      micAudioManager.registerWriter(this._streamer);
      
      this._isActive = true;
      
      logger.info('唤醒词检测已启动');
      
      // 返回停止函数
      return () => {
        this._subscribers.delete(options);
        // 如果没有更多订阅者，停止服务
        if (this._subscribers.size === 0) {
          this.stop();
        }
      };
    } catch (error) {
      logger.error('启动唤醒词检测失败', { error });
      this._subscribers.delete(options);
      throw error;
    }
  }

  async stop() {
    // 取消注册流处理器
    if (this._streamer) {
      micAudioManager.unregisterWriter(this._streamer);
      this._streamer = null;
    }

    // 卸载模型
    if (this._model) {
      await this._model.unload();
      this._model = null;
    }

    this._isActive = false;
    this._subscribers.clear();
    logger.info('唤醒词检测已停止');
  }

  isActive() {
    return this._isActive;
  }
}

export const wakeWordManager = new WakeWordManager();
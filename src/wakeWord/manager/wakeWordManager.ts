import { WakeWordModel, WakeWordModelOptions } from '../utils';
import { micVoiceProcessor } from '../../shared';
import context from '../../context';

const logger = context.logger.tags('[WakeWordManager]');

class WakeWordManager {
  private _wakeWordModel: WakeWordModel | null = null;

  async start(options: WakeWordModelOptions) {
    this.stop();
    logger.info('start wake word manager');
    this._wakeWordModel = new WakeWordModel(options);
    const porcupine = await this._wakeWordModel.load();
    micVoiceProcessor.subscribe(porcupine);
  }

  stop() {
    logger.info('stop wake word manager');
    if (this._wakeWordModel) {
      const porcupine = this._wakeWordModel.getCurrentModel();
      porcupine && micVoiceProcessor.unsubscribe(porcupine);
      this._wakeWordModel.unload();
      this._wakeWordModel = null;
    }
  }
}

export const wakeWordManager = new WakeWordManager();
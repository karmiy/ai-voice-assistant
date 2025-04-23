import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { PorcupineModel, PorcupineModelOptions } from './porcupineModel';
import context from '../../context';

const logger = context.logger.tags('[PorcupineManager]');

class PorcupineManager {
  private _wakeWordModel: PorcupineModel | null = null;

  async start(options: PorcupineModelOptions) {
    this.stop();
    logger.info('start wake word manager');
    this._wakeWordModel = new PorcupineModel(options);
    const porcupine = await this._wakeWordModel.load();
    WebVoiceProcessor.subscribe(porcupine);
  }

  stop() {
    logger.info('stop wake word manager');
    if (this._wakeWordModel) {
      const porcupine = this._wakeWordModel.getCurrentModel();
      porcupine && WebVoiceProcessor.unsubscribe(porcupine);
      this._wakeWordModel.unload();
      this._wakeWordModel = null;
    }
  }
}

export const porcupineManager = new PorcupineManager();
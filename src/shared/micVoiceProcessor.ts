import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import context from '../context';

const logger = context.logger.tags('[MicVoiceProcessor]');

export type PvEngine = {
  onmessage?: ((e: MessageEvent) => any) | null;
  postMessage?: (e: any) => void;
  worker?: {
    onmessage?: ((e: MessageEvent) => any) | null;
    postMessage?: (e: any) => void;
  }
}

class MicVoiceProcessor {
  private _subscribedEngines = new Set<PvEngine>();

  async subscribe(engine: PvEngine) {
    logger.info('subscribe', {
      engine,
    });
    await WebVoiceProcessor.subscribe(engine);
    this._subscribedEngines.add(engine);
  }

  async unsubscribe(engine: PvEngine) {
    logger.info('unsubscribe', {
      engine,
    });
    await WebVoiceProcessor.unsubscribe(engine);
    this._subscribedEngines.delete(engine);
    if (!this._subscribedEngines.size) {
      WebVoiceProcessor.reset();
    }
  }
}

export const micVoiceProcessor = new MicVoiceProcessor();

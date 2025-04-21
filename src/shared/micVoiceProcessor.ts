import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { blackHoleVoiceEngine } from './blackHoleVoiceEngine';
import context from '../context';

const logger = context.logger.tags('[MicVoiceProcessor]');
(window as any).WebVoiceProcessor = WebVoiceProcessor;

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
  private _isActive = false;

  async subscribe(engine: PvEngine) {
    logger.info('subscribe', {
      engine,
    });
    if (this._isActive) {
      await WebVoiceProcessor.subscribe(engine);
    }
    this._subscribedEngines.add(engine);
  }

  async unsubscribe(engine: PvEngine) {
    logger.info('unsubscribe', {
      engine,
    });
    if (this._isActive) {
      await WebVoiceProcessor.unsubscribe(engine);
    }
    this._subscribedEngines.delete(engine);
  }

  async start() {
    logger.info('start microphone');
    
    if (this._isActive) {
      logger.info('microphone already active');
      return;
    }
    
    try {
      await WebVoiceProcessor.subscribe(blackHoleVoiceEngine);
      for (const engine of this._subscribedEngines) {
        await WebVoiceProcessor.subscribe(engine);
      }
      
      this._isActive = true;
      logger.info('microphone started successfully');
    } catch (error) {
      logger.error('failed to start microphone', { error });
      throw error;
    }
  }

  async stop() {
    logger.info('stop microphone');
    
    if (!this._isActive) {
      logger.info('microphone already inactive');
      return;
    }
    
    try {
      await WebVoiceProcessor.unsubscribe(blackHoleVoiceEngine);
      for (const engine of this._subscribedEngines) {
        await WebVoiceProcessor.unsubscribe(engine);
      }
      
      await WebVoiceProcessor.reset();
      
      this._isActive = false;
      logger.info('microphone stopped successfully');
    } catch (error) {
      logger.error('failed to stop microphone', { error });
      throw error;
    }
  }

  isActive() {
    return this._isActive;
  }
}

export const micVoiceProcessor = new MicVoiceProcessor();
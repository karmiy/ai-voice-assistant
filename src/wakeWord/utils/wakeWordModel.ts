import { Porcupine, BuiltInKeyword, PorcupineErrors } from '@picovoice/porcupine-web';
import { SUPPORTED_WAKE_WORDS } from '../constants';
import context from '../../context';

const logger = context.logger.tags('[WakeWordModel]');

export interface WakeWordModelOptions {
  accessKey: string;
  wakeWord: BuiltInKeyword;
  onWakeWord?: (keyword: string) => void;
  onError?: (error: Error) => void;
  sensitivity?: number;
}

export class WakeWordModel {
  private _currentModel: Porcupine | null = null;

  constructor(private _options: WakeWordModelOptions) {}

  public async load() {
    try {
      logger.info('start load');
      
      if (this._currentModel) {
        await this.unload();
      }
      
      const keywordDetectionCallback = (keyword: { label: string }) => {
        logger.info(`Detected wake word: ${keyword.label}`, { keyword });
        this._options.onWakeWord?.(keyword.label);
      };

      const processErrorCallback = (error: PorcupineErrors.PorcupineError) => {
        logger.error('Porcupine process error:', {
            error: error.message,
            stack: error.stack,
        });
        if (this._options.onError) {
          this._options.onError(new Error(error.message));
        }
      };

      const options = {
        processErrorCallback
      };
      
      const baseUrl = process.env.PUBLIC_URL || '';
      const modelUrl = `${baseUrl}/models/porcupine_params.pv`;
      
      this._currentModel = await Porcupine.create(
        this._options.accessKey,
        {
          builtin: this._options.wakeWord, 
          sensitivity: this._options.sensitivity
        },
        keywordDetectionCallback,
        {
          publicPath: modelUrl,
        },
        options
      );
      logger.info('load success');
      return this._currentModel;
    } catch (error) {
      logger.error('load error', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined 
      });
      if (this._options.onError) {
        this._options.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  public async unload() {
    if (this._currentModel) {
      logger.info('start unload');
      try {
        await this._currentModel.release();
        this._currentModel = null;
        logger.info('unload success');
      } catch (error) {
        logger.error('unload error', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  }

  getCurrentModel() {
    return this._currentModel;
  }
}
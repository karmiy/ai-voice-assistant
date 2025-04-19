import { Porcupine, BuiltInKeyword, PorcupineErrors } from '@picovoice/porcupine-web';
import context from '../../context';

const logger = context.logger.tags('[WakeWordModel]');

export interface WakeWordModelOptions {
  accessKey: string;
  onWakeWord?: (keyword: string) => void;
  onError?: (error: Error) => void;
  sensitivity?: number;
  testWakeWord?: string;
}

const WAKE_WORD_MAP: Record<string, BuiltInKeyword> = {
  'Alexa': BuiltInKeyword.Alexa,
  'Computer': BuiltInKeyword.Computer,
  'HeySiri': BuiltInKeyword.HeySiri,
  'HeyGoogle': BuiltInKeyword.HeyGoogle,
  'OkayGoogle': BuiltInKeyword.OkayGoogle,
  'Picovoice': BuiltInKeyword.Picovoice,
  'Porcupine': BuiltInKeyword.Porcupine,
  'Bumblebee': BuiltInKeyword.Bumblebee,
  'Jarvis': BuiltInKeyword.Jarvis,
  'Terminator': BuiltInKeyword.Terminator,
};

export class WakeWordModel {
  private porcupineInstance: Porcupine | null = null;
  private isProcessing = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  constructor(private options: WakeWordModelOptions) {
    if (this.options.sensitivity === undefined) {
      this.options.sensitivity = 0.7;
    }
    logger.info(`Initializing wake word model with sensitivity: ${this.options.sensitivity}`);
  }

  public async load() {
    try {
      this.isProcessing = true;
      logger.info('Starting to load Porcupine...');
      
      if (this.porcupineInstance) {
        logger.info('Releasing existing Porcupine instance before creating a new one');
        await this.unload();
      }
      
      const keywordDetectionCallback = (keyword: { label: string }) => {
        logger.info(`Detected wake word: ${keyword.label}`, { keyword });
        if (this.options.onWakeWord) {
          logger.info('Calling onWakeWord callback');
          this.options.onWakeWord(keyword.label);
        } else {
          logger.warn('No onWakeWord callback provided');
        }
      };

      const processErrorCallback = (error: PorcupineErrors.PorcupineError) => {
        logger.error('Porcupine process error:', {
            error: error.message,
            stack: error.stack,
        });
        if (this.options.onError) {
          this.options.onError(new Error(error.message));
        }
        
        if (this.isProcessing && this.retryCount < this.MAX_RETRIES) {
          this.retryCount++;
          logger.info(`Attempting to reinitialize Porcupine (retry ${this.retryCount}/${this.MAX_RETRIES})...`);
          this.load().catch(e => {
            logger.error('Failed to reinitialize Porcupine:', { error: e });
          });
        }
      };

      const options = {
        processErrorCallback
      };

      let wakeWord: BuiltInKeyword = BuiltInKeyword.OkayGoogle;
      let wakeWordName = "OkayGoogle";
      
      if (this.options.testWakeWord && WAKE_WORD_MAP[this.options.testWakeWord]) {
        wakeWord = WAKE_WORD_MAP[this.options.testWakeWord];
        wakeWordName = this.options.testWakeWord;
      }
      
      logger.info(`Using wake word "${wakeWordName}" with sensitivity ${this.options.sensitivity}`);
      
      const baseUrl = process.env.PUBLIC_URL || '';
      const modelUrl = `${baseUrl}/models/porcupine_params.pv`;
      
      logger.info(`Loading model from: ${modelUrl}`);
      
      this.porcupineInstance = await Porcupine.create(
        this.options.accessKey,
        {
          builtin: wakeWord, 
          sensitivity: this.options.sensitivity
        },
        keywordDetectionCallback,
        {
          publicPath: modelUrl,
        },
        options
      );

      logger.info('Porcupine initialized successfully', {
        frameLength: this.porcupineInstance.frameLength,
        sampleRate: this.porcupineInstance.sampleRate,
        version: this.porcupineInstance.version,
        wakeWord: wakeWordName
      });
      
      logger.info('Testing keywordDetectionCallback...');
      setTimeout(() => {
        logger.info(`If you do not see wake word detections, check your audio input and "${wakeWordName}" pronunciation.`);
        logger.info('Tips: Speak clearly and try to match the standard English pronunciation of the wake word.');
      }, 5000);
      
      this.retryCount = 0;
      this.isProcessing = false;
      return this.porcupineInstance;
    } catch (error) {
      this.isProcessing = false;
      logger.error('Porcupine initialization failed:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined 
      });
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  public async unload() {
    if (this.porcupineInstance) {
      logger.info('Releasing Porcupine resources...');
      try {
        await this.porcupineInstance.release();
        this.porcupineInstance = null;
        logger.info('Porcupine resources released successfully');
      } catch (error) {
        logger.error('Error releasing Porcupine resources:', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  }

  public getPorcupineInstance() {
    return this.porcupineInstance;
  }
}
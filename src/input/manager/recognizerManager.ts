import {
  RecognizerStreamer,
  RecognizerModel,
  RecognizerManagerOptions,
} from '../utils';
import { micAudioManager } from './micAudioManager';
import { SUPPORTED_LANGUAGES } from '../constants';
import context from '../../context';

const logger = context.logger.tags('[RecognizerManager]');

type RecognizerOptions = RecognizerManagerOptions & {
  language: SUPPORTED_LANGUAGES;
};

class RecognizerManager {
  private _streamers = new Map<SUPPORTED_LANGUAGES, RecognizerStreamer>();
  private _subscribers = new Map<SUPPORTED_LANGUAGES, Set<RecognizerOptions>>();

  private async _getOrCreateRecognizerStreamer(language: SUPPORTED_LANGUAGES) {
    const currentStreamer = this._streamers.get(language);
    if (currentStreamer) {
      return currentStreamer;
    }
    const model = new RecognizerModel({
      onError: (error) => {
        logger.error('Recognizer error', {
          error,
          language,
        });
        this._subscribers.get(language)?.forEach((subscriber) => {
          subscriber.onError?.(error);
        });
      },
      onResult: (result) => {
        logger.info('Recognizer result', {
          result,
          language,
        });
        this._subscribers.get(language)?.forEach((subscriber) => {
          subscriber.onResult?.(result);
        });
      },
      onPartialResult: (partial: string) => {
        logger.info('Recognizer partial result', {
          partial,
          language,
        });
        this._subscribers.get(language)?.forEach((subscriber) => {
          subscriber.onPartialResult?.(partial);
        });
      },
    });
    const recognizer = await model.load(language);
    if (!recognizer) {
      throw new Error('Failed to load recognizer');
    }
    const streamer = new RecognizerStreamer(recognizer, {
      objectMode: true,
    });
    micAudioManager.registerWriter(streamer);
    this._streamers.set(language, streamer);
    return streamer;
  }

  async start(options: RecognizerOptions) {
    const { language } = options;
    const subscribers = this._subscribers.get(language) ?? new Set();
    subscribers.add(options);
    this._subscribers.set(language, subscribers);
    try {
      const streamer = await this._getOrCreateRecognizerStreamer(language);
      return () => {
        subscribers.delete(options);
        if (!subscribers.size) {
          micAudioManager.unregisterWriter(streamer);
          this._streamers.delete(language);
        }
      };
    } catch (error) {
      logger.error('Failed to start recognizer', {
        error,
        language,
      });
      subscribers.delete(options);
      throw error;
    }
  }
}

export const recognizerManager = new RecognizerManager();

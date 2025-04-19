import {
  RecognizerStreamer,
  RecognizerModel,
  RecognizerModelOptions,
} from '../utils';
import { micStreamProcessor } from '../../shared';
import { SUPPORTED_LANGUAGES } from '../constants';
import context from '../../context';

const logger = context.logger.tags('[StreamRecognizerManager]');

type RecognizerOptions = RecognizerModelOptions & {
  language: SUPPORTED_LANGUAGES;
};

class StreamRecognizerManager {
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
        // logger.info('Recognizer partial result', {
        //   partial,
        //   language,
        // });
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
    micStreamProcessor.subscribe(streamer);
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
          micStreamProcessor.unsubscribe(streamer);
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

export const streamRecognizerManager = new StreamRecognizerManager();

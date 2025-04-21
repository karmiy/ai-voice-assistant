import {
  RecognizerModel,
  RecognizerModelOptions,
} from '../utils';
import { micVoiceProcessor, PvEngine } from '../../shared';
import { SUPPORTED_LANGUAGES } from '../constants';
import context from '../../context';

const logger = context.logger.tags('[VoiceRecognizerManager]');

type RecognizerOptions = RecognizerModelOptions & {
  language: SUPPORTED_LANGUAGES;
};

class VoiceRecognizerManager {
  private _engines = new Map<SUPPORTED_LANGUAGES, PvEngine>();
  private _subscribers = new Map<SUPPORTED_LANGUAGES, Set<RecognizerOptions>>();

  private _int16ArrayToAudioBuffer = (int16Array: Int16Array, sampleRate = 16000) => {
    // 1. 创建 AudioBuffer（假设单声道）
    const audioContext = new AudioContext();
    const audioBuffer = audioContext.createBuffer(1, int16Array.length, sampleRate);
    
    // 2. 获取 Float32Array 并填充数据
    const float32Data = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16Array.length; i++) {
        float32Data[i] = int16Array[i] / 32768.0; // 16-bit 转 [-1.0, 1.0]
    }
    
    return audioBuffer;
  };

  private async _getOrCreateRecognizerEngine(language: SUPPORTED_LANGUAGES) {
    const currentEngine = this._engines.get(language);
    if (currentEngine) {
      return currentEngine;
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
    const engine = {
      onmessage: (e: MessageEvent) => {
        const inputFrame = e.data.inputFrame;
        const audioBuffer = this._int16ArrayToAudioBuffer(inputFrame);
        const buffer = audioBuffer.getChannelData(0);
        if (buffer.byteLength > 0) {
          recognizer?.acceptWaveform(audioBuffer);
        }
      },
    };
    micVoiceProcessor.subscribe(engine);
    this._engines.set(language, engine);
    return engine;
  }

  async start(options: RecognizerOptions) {
    const { language } = options;
    const subscribers = this._subscribers.get(language) ?? new Set();
    subscribers.add(options);
    this._subscribers.set(language, subscribers);
    try {
      const engine = await this._getOrCreateRecognizerEngine(language);
      return () => {
        subscribers.delete(options);
        if (!subscribers.size) {
          micVoiceProcessor.unsubscribe(engine);
          this._engines.delete(language);
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

export const voiceRecognizerManager = new VoiceRecognizerManager();

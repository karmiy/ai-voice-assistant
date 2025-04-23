import { createModel, KaldiRecognizer, Model } from 'vosk-browser';
import { VOSK_SUPPORTED_LANGUAGES } from './constants';
import context from '../../context';

const logger = context.logger.tags('[VoskModel]');

const MODELS = [
  {
    language: VOSK_SUPPORTED_LANGUAGES.EN,
    path: 'vosk-model-small-en-us-0.15.tar.gz',
  },
];

export interface Result {
  result: Array<{
    conf: number;
    start: number;
    end: number;
    word: string;
  }>;
  text: string;
}

export interface ServerMessageError {
  event: 'error';
  recognizerId?: string;
  error: string;
}

export interface ServerMessageResult {
  event: 'result';
  recognizerId: string;
  result: {
    result: Array<{
      conf: number;
      start: number;
      end: number;
      word: string;
    }>;
    text: string;
  };
}

export interface ServerMessagePartialResult {
  event: 'partialresult';
  recognizerId: string;
  result: {
    partial: string;
  };
}

export interface VoskModelOptions {
  onError?: (error: Error) => void;
  onResult?: (result: Result) => void; // 一段话结束了触发
  onPartialResult?: (partial: string) => void; // 实时触发，即使没文本
}

export type VoskRecognizerMessage =
  | ServerMessagePartialResult
  | ServerMessageResult
  | ServerMessageError;

export class VoskModel {
  private _currentModel: Model | null = null;
  private _currentRecognizer: KaldiRecognizer | null = null;
  private _currentLanguage: VOSK_SUPPORTED_LANGUAGES | null = null;

  constructor(private _options: VoskModelOptions = {}) {}

  private _handleResult = (message: VoskRecognizerMessage) => {
    if (message.event === 'result') {
      const result = message.result;
      this._options.onResult?.(result);
    }
  };

  private _handlePartialResult = (message: VoskRecognizerMessage) => {
    if (message.event === 'partialresult') {
      const partial = message.result.partial;
      this._options.onPartialResult?.(partial);
    }
  };

  async load(language: VOSK_SUPPORTED_LANGUAGES) {
    try {
      // If it's the same model, return current recognizer directly
      if (this._currentLanguage === language && this._currentRecognizer) {
        return this._currentRecognizer;
      }

      // Clean up old model
      this.unload();

      // Build model URL
      const model = MODELS.find((m) => m.language === language);
      if (!model) {
        logger.error(`Model for language ${language} not found`);
        return;
      }
      const baseUrl = process.env.PUBLIC_URL || '';
      const modelUrl = `${baseUrl}/models/${model.path}`;

      // Create new model
      this._currentModel = await createModel(modelUrl);
      this._currentLanguage = language;

      // Create recognizer
      const recognizer = new this._currentModel.KaldiRecognizer(16000);
      recognizer.setWords(true);

      // Set up event listeners
      recognizer.on('result', this._handleResult);
      recognizer.on('partialresult', this._handlePartialResult);

      this._currentRecognizer = recognizer;
      return recognizer;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._options.onError?.(error);
      throw error;
    }
  }

  unload() {
    this._currentModel?.terminate();
    this._currentModel = null;
    this._currentRecognizer = null;
    this._currentLanguage = null;
  }

  getCurrentRecognizer() {
    return this._currentRecognizer;
  }
}

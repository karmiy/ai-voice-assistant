import { createClient, ListenLiveClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import context from "../../context";

const logger = context.logger.tags('[DeepgramModel]');

export interface DeepgramTranscript {
  type: "Results",
  channel_index: number[],
  duration: number,
  start: number,
  is_final: boolean,
  speech_final: false,
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words: string[];
    }>
  },
  metadata: {
      request_id: string;
      model_info: {
          name: string;
          version: string;
          arch: string;
      },
      model_uuid: string;
  },
  from_finalize: boolean;
}

export interface DeepgramModelOptions {
  apiKey: string;
  language?: string;
  onOpen?: () => void;
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onClose?: () => void;
  onError?: (error: any) => void;
}

const DETECT_TRANSCRIPT_END_TIMEOUT = 500;
export class DeepgramModel {
  private _socket: ListenLiveClient | null = null;

  constructor(private _options: DeepgramModelOptions) {}

  private _isActive = false;

  private _finalTranscripts: string[] = [];
  private _detectTranscriptEndTimer: ReturnType<typeof setTimeout> | null = null;

  start() {
    if (this._isActive) {
      logger.info('DeepgramModel is already active');
      return;
    }

    const deepgram = createClient(this._options.apiKey);

    this._socket = deepgram.listen.live({ model: "nova-3", smart_format: true, language: this._options.language });
    this._socket.on(LiveTranscriptionEvents.Open, this._onOpen);
  }

  stop() {
    if (!this._isActive) {
      logger.info('DeepgramModel is not active');
      return;
    }

    this._socket?.off(LiveTranscriptionEvents.Open, this._onOpen);
    this._socket?.off(LiveTranscriptionEvents.Transcript, this._onTranscript);
    this._socket?.off(LiveTranscriptionEvents.Close, this._onClose);
    this._socket?.off(LiveTranscriptionEvents.Error, this._onError);
    this._socket?.disconnect();
    this._socket = null;
    this._isActive = false;
    this._finalTranscripts = [];
    this._clearDetectTranscriptEndTimer();
  }

  private _onOpen = () => {
    this._socket?.on(LiveTranscriptionEvents.Transcript, this._onTranscript);
    this._socket?.on(LiveTranscriptionEvents.Close, this._onClose);
    this._socket?.on(LiveTranscriptionEvents.Error, this._onError);
    this._options.onOpen?.();
  };

  private _onTranscript = (data: DeepgramTranscript) => {
    const transcript = data.channel.alternatives[0].transcript;
    logger.info('transcript', {
      transcript,
      data,
    });
    this._options.onTranscript?.(data.channel.alternatives[0].transcript);
    if (!transcript) {
      this._detectTranscriptEndTimer = setTimeout(() => {
        if (this._finalTranscripts.some(item => item.length > 0)) {
          this._options.onFinalTranscript?.(this._finalTranscripts.join(' '));
          this._finalTranscripts = [];
        }
      }, DETECT_TRANSCRIPT_END_TIMEOUT);
    } else {
      this._clearDetectTranscriptEndTimer();
    }
    if (data.is_final) {
      this._finalTranscripts.push(transcript);
    }
  };

  private _onClose = () => {
    logger.info('closed');
    this._options.onClose?.();
  };

  private _onError = (error: any) => {
    logger.error('error', error);
    this._options.onError?.(error);
  };

  private _clearDetectTranscriptEndTimer() {
    this._detectTranscriptEndTimer && clearTimeout(this._detectTranscriptEndTimer);
    this._detectTranscriptEndTimer = null;
  }

  getCurrentSocket() {
    return this._socket;
  }
}



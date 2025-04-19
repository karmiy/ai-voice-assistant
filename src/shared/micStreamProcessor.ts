import MicrophoneStream from 'microphone-stream';
import './polyfill';
import context from '../context';

const logger = context.logger.tags('[MicStreamProcessor]');

export interface MicStreamProcessorOptions {
  onError?: (error: Error) => void;
}

type WritableStream = NodeJS.WritableStream | _Readable.Writable;

class MicStreamProcessor {
  private _mediaStream: MediaStream | null = null;
  private _micStream: MicrophoneStream | null = null;
  private _writers = new Set<WritableStream>();

  constructor(private _options: MicStreamProcessorOptions = {}) {}

  private async _load() {
    try {
      logger.info('load');
      // If microphone stream already exists, reset pipes
      if (this._micStream) {
        this._resetPipes();
        return;
      }

      // Get microphone permissions and audio stream
      this._mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      // Create microphone stream processor
      this._micStream = new MicrophoneStream({
        objectMode: true,
        bufferSize: 1024,
      });

      // Set the audio stream
      this._micStream.setStream(this._mediaStream);

      this._writers.forEach((writer) => {
        this._micStream?.pipe(writer);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._options.onError?.(error);
      throw error;
    }
  }

  private _resetPipes() {
    this._writers.forEach((writer) => {
      this._micStream?.unpipe(writer);
    });
  }

  async subscribe(writer: WritableStream) {
    if (this._writers.has(writer)) {
      return;
    }
    this._writers.add(writer);
    if (this._writers.size === 1) {
      await this._load();
    }
    this._micStream?.pipe(writer);
  }

  unsubscribe(writer: WritableStream) {
    if (!this._writers.has(writer)) {
      return;
    }
    this._writers.delete(writer);
    this._micStream?.unpipe(writer);
    if (this._writers.size === 0) {
      this._unload();
    }
  }

  private _unload() {
    this._resetPipes();
    this._micStream?.destroy();
    this._micStream = null;

    this._mediaStream?.getTracks().forEach((track) => track.stop());
    this._mediaStream = null;
  }
}

export const micStreamProcessor = new MicStreamProcessor({
  onError: (error) => {
    logger.error(error.message);
  },
});

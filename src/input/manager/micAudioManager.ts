import MicrophoneStream from 'microphone-stream';
import './polyfill';
import context from '../../context';

const logger = context.logger.tags('[MicAudioManager]');

export interface MicAudioManagerOptions {
  onError?: (error: Error) => void;
}

type WritableStream = NodeJS.WritableStream | _Readable.Writable;

class MicAudioManager {
  private _mediaStream: MediaStream | null = null;
  private _micStream: MicrophoneStream | null = null;
  private _writers = new Set<WritableStream>();

  constructor(private _options: MicAudioManagerOptions = {}) {}

  async load() {
    try {
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

  registerWriter(writer: WritableStream) {
    if (this._writers.has(writer)) {
      return;
    }
    this._writers.add(writer);
    this._micStream?.pipe(writer);
  }

  unregisterWriter(writer: WritableStream) {
    if (!this._writers.has(writer)) {
      return;
    }
    this._writers.delete(writer);
    this._micStream?.unpipe(writer);
  }

  unload() {
    this._resetPipes();
    this._micStream?.destroy();
    this._micStream = null;

    this._mediaStream?.getTracks().forEach((track) => track.stop());
    this._mediaStream = null;
  }
}

export const micAudioManager = new MicAudioManager({
  onError: (error) => {
    logger.error(error.message);
  },
});

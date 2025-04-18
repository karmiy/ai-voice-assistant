import { Duplex, DuplexOptions } from 'readable-stream';
import { KaldiRecognizer } from 'vosk-browser';

export class RecognizerStreamer extends Duplex {
  constructor(public recognizer: KaldiRecognizer, options?: DuplexOptions) {
    super(options);
  }

  public _write(
    chunk: AudioBuffer,
    encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    const buffer = chunk.getChannelData(0);
    if (this.recognizer && buffer.byteLength > 0) {
      this.recognizer.acceptWaveform(chunk);
    }
    callback();
  }

  public _read(size: number): void {
    this.push(null);
  }
}

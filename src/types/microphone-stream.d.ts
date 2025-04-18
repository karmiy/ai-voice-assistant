declare module "microphone-stream" {
  import { Duplex } from 'stream';

  interface MicrophoneStreamOptions {
    objectMode?: boolean;
    bufferSize?: number;
    context?: AudioContext;
    [key: string]: any;
  }

  class MicrophoneStream extends Duplex {
    constructor(options?: MicrophoneStreamOptions);
    
    /**
     * Sets the stream's source to the provided media stream
     */
    setStream(mediaStream: MediaStream): void;
    
    /**
     * Pipes the MicrophoneStream to another stream or destination
     */
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
    
    /**
     * Removes the specified stream from the pipe
     */
    unpipe(destination?: NodeJS.WritableStream): this;
    
    /**
     * Destroys the stream and cleans up resources
     */
    destroy(): void;
    
    /**
     * Whether the stream is currently running
     */
    readonly running: boolean;

    /**
     * Closes the stream
     */
    close(): void;
  }

  export default MicrophoneStream;
}

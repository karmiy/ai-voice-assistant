import { DeepgramModel, DeepgramModelOptions } from "./deepgramModel";
import context from "../../context";

const logger = context.logger.tags('deepgramRecognizerManager');

export class DeepgramRecognizerManager {
  private _recognizerModel: DeepgramModel | null = null;
  private _microphone: MediaRecorder | null = null;

  async start(options: DeepgramModelOptions) {
    this.stop();
    const recognizerModel = new DeepgramModel({
        ...options,
        onOpen: async () => {
            await this._openMicrophone();
        },
    });
    this._recognizerModel = recognizerModel;
    await recognizerModel.start();
  }

  stop() {
    this._recognizerModel?.stop();
    this._closeMicrophone();
  }

  private async _getMicrophone() {
    const userMedia = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
  
    return new MediaRecorder(userMedia);
  }

  private async _openMicrophone() {
    this._closeMicrophone();
    const microphone = await this._getMicrophone();
    this._microphone = microphone;

    await microphone.start(500);
  
    microphone.onstart = () => {
      logger.info("client: microphone opened");
    };
  
    microphone.onstop = () => {
      logger.info("client: microphone closed");
    };
  
    microphone.ondataavailable = (e) => {
      const data = e.data;
      logger.info("client: sent data to websocket");
      this._recognizerModel?.getCurrentSocket()?.send(data);
    };
  }

  private _closeMicrophone() {
    this._microphone?.stop();
    this._microphone = null;
  }
}

export const deepgramRecognizerManager = new DeepgramRecognizerManager();

import React from "react";
import styled from "styled-components";
// import FileUpload from "./file-upload";
// import Microphone from "./microphone";
import VoskRecognizer from "./voskRecognizer";
import DeepgramRecognizer from "./deepgramRecognizer";
import PorcupineWakeWord from "./porcupineWakeWord";
const Wrapper = styled.div`
  width: 80%;
  text-align: left;
  max-width: 700px;
  margin: auto;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

export const Assistant: React.FunctionComponent = () => {
  return (
    <Wrapper>
      {/* <Microphone /> */}
      <VoskRecognizer />
      <DeepgramRecognizer />
      <PorcupineWakeWord />
      {/* <Header>
        <Microphone loading={loading} ready={ready} />
      </Header> */}
      {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '10px 0' }}>
        <button onClick={() => wakeWordManager.start({
          accessKey: 'EQrqvHg8Yy8PJbGg3p4K+rpgmyYQiwujuKbsPRaVcI+qCw2kLuGQJw==',
          sensitivity: 1.0,
          onWakeWord: (keyword) => {
            console.log('[test] Wake word detected:', keyword);
            alert(`Wake word detected: ${keyword}`);
          },
          onError: (error) => {
            console.error('[test] Wake word error:', error.message);
          }
        })}>Test "Okay Google" (High Sensitivity)</button>
        
        <button onClick={async () => {
          const model = new RecognizerModel({
            onError: (error) => {
            },
            onResult: (result) => {
              console.log('[test] Result:', result);
            },
            onPartialResult: (partial: string) => {
              console.log('[test] Partial result:', partial);
            },
          });
          function int16ArrayToAudioBuffer(int16Array: Int16Array, sampleRate = 16000) {
            // 1. 创建 AudioBuffer（假设单声道）
            const audioContext = new AudioContext();
            const audioBuffer = audioContext.createBuffer(1, int16Array.length, sampleRate);
            
            // 2. 获取 Float32Array 并填充数据
            const float32Data = audioBuffer.getChannelData(0);
            for (let i = 0; i < int16Array.length; i++) {
                float32Data[i] = int16Array[i] / 32768.0; // 16-bit 转 [-1.0, 1.0]
            }
            
            return audioBuffer;
          }
          const recognizer = await model.load(SUPPORTED_LANGUAGES.EN);
          WebVoiceProcessor.subscribe({
            onmessage: e => {
              const inputFrame = e.data.inputFrame;
              recognizer?.acceptWaveform(int16ArrayToAudioBuffer(inputFrame));
            },
          })
        }}>Test "Hey Siri" (High Sensitivity)</button>
      </div> */}
    </Wrapper>
  );
};

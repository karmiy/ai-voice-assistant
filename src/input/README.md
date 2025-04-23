# Speech To Text

## Vosk 方案

voskRecognizerManager = `Vosk` + `MicrophoneStream`

### @picovoice/web-voice-processor

当前使用 `MicrophoneStream` 输出音频流给 `Vosk` 翻译

如果替换为 `@picovoice/web-voice-processor`，由于 `WebVoiceProcessor.subscribe` 需要接收 `PVEngine` 类型，其中 `onmessage` 的回调是接收的 `inputFrame` 是 `int16Array` 类型，而 `Vosk` 需要接收的是 `AudioBuffer`，需要转换格式：

```ts
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
```

```ts
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
```

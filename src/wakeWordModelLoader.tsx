import { Button, Select } from "antd";
import React, { useState } from "react";
import styled from "styled-components";
import { BuiltInKeyword } from '@picovoice/porcupine-web';
import { porcupineManager, PORCUPINE_ACCESS_TOKEN, CUSTOM_WAKE_WORD } from "./wakeWord";
const { Option } = Select;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ActionWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledButton = styled(Button)`
  box-sizing: border-box;
  margin-left: 0.5rem;
`;

const ResultContainer = styled.div`
  width: 100%;
  margin: 16px auto;
  border: 1px solid #aaaaaa;
  padding: 1rem;
  resize: vertical;
  overflow: auto;
`;

const ResultTitle = styled.p`
  font-weight: bold;
`;

export const wakeWords = [
  BuiltInKeyword.Alexa,
  BuiltInKeyword.Americano,
  BuiltInKeyword.Blueberry,
  BuiltInKeyword.Bumblebee,
  BuiltInKeyword.Computer,
  BuiltInKeyword.Grapefruit,
  BuiltInKeyword.Grasshopper,
  BuiltInKeyword.HeyGoogle,
  BuiltInKeyword.HeySiri,
  BuiltInKeyword.Jarvis,
  BuiltInKeyword.OkayGoogle,
  BuiltInKeyword.Picovoice,
  BuiltInKeyword.Porcupine,
  BuiltInKeyword.Terminator,
];

const WakeWordModelLoader: React.FunctionComponent = () => {
  const [loading, setLoading] = useState(false);
  const [wakeWord, setWakeWord] = useState(BuiltInKeyword.HeySiri);
  const [isListening, setIsListening] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState({
    keyword: "",
    date: new Date(),
  });

  const stop = () => {
    porcupineManager.stop();
    setIsListening(false);
  }

  const start = async () => {
    setLoading(true);
    try {
      stop();
      await porcupineManager.start({
        accessKey: PORCUPINE_ACCESS_TOKEN,
        wakeWord,
        customWakeWord: CUSTOM_WAKE_WORD.HEY_RING_BUDDY,
        onWakeWord: (keyword: string) => {
          console.log('keyword', keyword);
          setDetectedInfo({
            keyword,
            date: new Date(),
          });
        },
        // onError: (error: Error) => {
        //   console.error('error', error);
        // },
        // sensitivity: 0.5, // 0~1，数值越高越敏感越容易触发，但误触发率也高
      })
      setIsListening(true);
    } catch (error) {
      console.error('Failed to load model:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <ActionWrapper>
        <Select
          style={{
            height: "2rem",
            margin: "auto 0",
            width: "10rem",
          }}
          defaultValue={BuiltInKeyword.HeySiri}
          onChange={(value: BuiltInKeyword) => {
            stop();
            setWakeWord(value);
          }}
        >
          {wakeWords.map((word, index) => (
            <Option value={word} key={index}>
              {word}
            </Option>
          ))}
        </Select>
        <StyledButton disabled={loading} onClick={() => isListening ? stop() : start()}>
          {loading ? "Loading..." : isListening ? "Stop" : "Start "}
        </StyledButton>
      </ActionWrapper>
      <ResultContainer>
        <ResultTitle>Detected Result:</ResultTitle>
        {detectedInfo.keyword ? `${detectedInfo.keyword} at ${detectedInfo.date.toLocaleString()}` : ''}
      </ResultContainer>
    </Wrapper>
  );
};

export default WakeWordModelLoader;

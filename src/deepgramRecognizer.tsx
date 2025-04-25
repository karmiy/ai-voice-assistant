import { Button, Select } from "antd";
import React, { useState } from "react";
import styled from "styled-components";
import { deepgramRecognizerManager, DEEPGRAM_SUPPORTED_LANGUAGES, DEEPGRAM_API_KEY } from "./input";
import context from './context';
const { Option } = Select;

const logger = context.logger.tags('[DeepgramRecognizer]');

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

export const models: Array<{ name: string; language: DEEPGRAM_SUPPORTED_LANGUAGES }> = [
  {
    name: "English",
    language: DEEPGRAM_SUPPORTED_LANGUAGES.EN,
  },
];

const DeepgramRecognizer: React.FunctionComponent = () => {
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(DEEPGRAM_SUPPORTED_LANGUAGES.EN);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<string>('');

  const stop = () => {
    deepgramRecognizerManager.stop();
    setIsRecognizing(false);
  }

  const start = async (language: DEEPGRAM_SUPPORTED_LANGUAGES) => {
    setLoading(true);
    try {
      await deepgramRecognizerManager.start({
        apiKey: DEEPGRAM_API_KEY,
        language,
        onFinalTranscript: (transcript) => {
          logger.info('final transcript', transcript);
        }
      })
      setIsRecognizing(true);
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
          defaultValue={DEEPGRAM_SUPPORTED_LANGUAGES.EN}
          onChange={(value: DEEPGRAM_SUPPORTED_LANGUAGES) => {
            stop();
            setModel(value);
          }}
        >
          {models.map((model, index) => (
            <Option value={model.language} key={index}>
              {model.name}
            </Option>
          ))}
        </Select>
        <StyledButton disabled={loading} onClick={() => isRecognizing ? stop() : start(model)}>
          {loading ? "Loading..." : isRecognizing ? "Stop" : "Start "}
        </StyledButton>
      </ActionWrapper>
      <ResultContainer>
        <ResultTitle>Recognition Result:</ResultTitle>
        {result}
      </ResultContainer>
    </Wrapper>
  );
};

export default DeepgramRecognizer;

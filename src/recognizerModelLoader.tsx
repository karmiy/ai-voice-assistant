import { Button, Select } from "antd";
import React, { useRef, useState } from "react";
import styled from "styled-components";
import { SUPPORTED_LANGUAGES } from "./input/constants";
import { voskRecognizerManager, Result } from "./input";
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

const Word = styled.span<{ confidence: number }>`
  color: ${({ confidence }) => {
    const color = Math.max(255 * (1 - confidence) - 20, 0);
    return `rgb(${color},${color},${color})`;
  }};
  white-space: normal;
`;

export const models: Array<{ name: string; language: SUPPORTED_LANGUAGES }> = [
  {
    name: "English",
    language: SUPPORTED_LANGUAGES.EN,
  },
];
// export const models: Array<{ name: string; path: string }> = [
//   {
//     name: "English",
//     path: "vosk-model-small-ca-0.4.tar.gz",
//   },
//   {
//     name: "Chinese",
//     path: "vosk-model-small-cn-0.3.tar.gz",
//   },
//   {
//     name: "Deutsch",
//     path: "vosk-model-small-de-0.15.tar.gz",
//   },
//   {
//     name: "Indian English",
//     path: "vosk-model-small-en-in-0.4.tar.gz",
//   },
//   {
//     name: "English",
//     path: "vosk-model-small-en-us-0.15.tar.gz",
//     // path: "vosk-model-en-us-0.22-lgraph.zip",
//   },
//   {
//     name: "Español",
//     path: "vosk-model-small-es-0.3.tar.gz",
//   },
//   {
//     name: "Farsi",
//     path: "vosk-model-small-fa-0.4.tar.gz",
//   },
//   {
//     name: "French",
//     path: "vosk-model-small-fr-pguyot-0.3.tar.gz",
//   },
//   {
//     name: "Italiano",
//     path: "vosk-model-small-it-0.4.tar.gz",
//   },
//   {
//     name: "Malayalam",
//     path: "vosk-model-malayalam-bigram.tar.gz",
//   },
//   {
//     name: "Portuguese",
//     path: "vosk-model-small-pt-0.3.tar.gz",
//   },
//   {
//     name: "Russian",
//     path: "vosk-model-small-ru-0.4.tar.gz",
//   },
//   {
//     name: "Turkish",
//     path: "vosk-model-small-tr-0.3.tar.gz",
//   },
//   {
//     name: "Vietnamese",
//     path: "vosk-model-small-vn-0.3.tar.gz",
//   },
// ];

const RecognizerModelLoader: React.FunctionComponent = () => {
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(SUPPORTED_LANGUAGES.EN);
  const stopRef = useRef<Function>();
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [utterances, setUtterances] = useState<Result[]>([]);
  const [partial, setPartial] = useState("");

  const stop = () => {
    stopRef.current?.();
    setIsRecognizing(false);
  }

  const start = async (language: SUPPORTED_LANGUAGES) => {
    setLoading(true);
    try {
      stop();
      const _stop = await voskRecognizerManager.start({
        language,
        onResult: (result) => {
          setUtterances((utt) => [...utt, result]);
        },
        onPartialResult: (partialResult) => {
          setPartial(partialResult);
        }
      })
      stopRef.current = _stop;
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
          defaultValue={SUPPORTED_LANGUAGES.EN}
          onChange={(value: SUPPORTED_LANGUAGES) => {
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
        {utterances.map((utt, uindex) =>
          utt?.result?.map((word, windex) => (
            <Word
              key={`${uindex}-${windex}`}
              confidence={word.conf}
              title={`Confidence: ${(word.conf * 100).toFixed(2)}%`}
            >
              {word.word}{" "}
            </Word>
          ))
        )}
      </ResultContainer>
      <ResultContainer>
        <ResultTitle>Partial Result:</ResultTitle>
        {partial}
      </ResultContainer>
    </Wrapper>
  );
};

export default RecognizerModelLoader;

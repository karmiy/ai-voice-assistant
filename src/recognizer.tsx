import React, { useState, useCallback, useRef } from "react";
import styled from "styled-components";
import FileUpload from "./file-upload";
import Microphone from "./microphone";
import ModelLoader from "./modelLoader";
import { recognizerManager } from "./input/manager";
import { Result } from "./input/utils";
import { SUPPORTED_LANGUAGES } from "./input/constants";


const Wrapper = styled.div`
  width: 80%;
  text-align: left;
  max-width: 700px;
  margin: auto;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem auto;
`;

const ResultContainer = styled.div`
  width: 100%;
  margin: 1rem auto;
  border: 1px solid #aaaaaa;
  padding: 1rem;
  resize: vertical;
  overflow: auto;
`;

const Word = styled.span<{ confidence: number }>`
  color: ${({ confidence }) => {
    const color = Math.max(255 * (1 - confidence) - 20, 0);
    return `rgb(${color},${color},${color})`;
  }};
  white-space: normal;
`;

export const Recognizer: React.FunctionComponent = () => {
  const [utterances, setUtterances] = useState<Result[]>([]);
  const [partial, setPartial] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const stopRef = useRef<Function>();

  const loadModel = useCallback(async (language: SUPPORTED_LANGUAGES) => {
    setLoading(true);
    try {
      stopRef.current?.();
      const stop = await recognizerManager.start({
        language,
        onResult: (result) => {
          setUtterances((utt) => [...utt, result]);
        },
        onPartialResult: (partialResult) => {
          setPartial(partialResult);
        }
      })
      stopRef.current = stop;
      setReady(true);
    } catch (error) {
      console.error('Failed to load model:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Wrapper>
      <ModelLoader
        onModelChange={() => setReady(false)}
        onModelSelect={(language) => loadModel(language)}
        loading={loading}
      />
      <Header>
        <Microphone loading={loading} ready={ready} />
        {/* <FileUpload recognizer={recognizer} loading={loading} ready={ready} /> */}
      </Header>
      <ResultContainer>
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
        <span key="partial">{partial}</span>
      </ResultContainer>
    </Wrapper>
  );
};

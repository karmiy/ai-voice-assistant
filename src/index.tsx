import "antd/dist/antd.min.css";

import React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

import "./index.css";

import { Assistant } from "./assistant";

const Wrapper = styled.div`
  text-align: center;
  margin: auto;
  justify-content: center;
`;

ReactDOM.render(
  <React.StrictMode>
    <Wrapper>
      <h1>Vosk-Browser Speech Recognition + Porcupine Wake Word Detection Demo</h1>
      <p>
        Select a language and load the model to start speech recognition.
      </p>
      <Assistant />
    </Wrapper>
  </React.StrictMode>,
  document.getElementById("root")
);

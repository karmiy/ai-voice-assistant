import { Button } from "antd";
import { AudioMutedOutlined, AudioOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import styled from "styled-components";
// import { micVoiceProcessor } from "./shared";
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin: 16px auto;
`;


const Microphone: React.FunctionComponent = () => {
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleMic = async () => {
    // setLoading(true);
    // if (muted) {
    //   await micVoiceProcessor.start();
    //   setMuted(false);
    // } else {
    //   await micVoiceProcessor.stop();
    //   setMuted(true);
    // }
    // setLoading(false);
  }

  return (
    <Wrapper>
      <Button
        icon={muted ? <AudioMutedOutlined /> : <AudioOutlined />}
        disabled={loading}
        onMouseUp={toggleMic}
      >
        Speak
      </Button>
    </Wrapper>
  );
};

export default Microphone;
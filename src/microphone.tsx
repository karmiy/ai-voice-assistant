import { Button } from "antd";
import { AudioMutedOutlined, AudioOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { micAudioManager } from "./input/manager";

interface Props {
  ready: boolean;
  loading: boolean;
}

const Microphone: React.FunctionComponent<Props> = ({
  loading,
  ready,
}) => {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!muted) {
      // 非静音：音频流向识别器
      micAudioManager.load();
    } else {
      // 静音：音频流向黑洞
      micAudioManager.unload();
    }
  }, [muted]);

  const toggleMic = () => {
    setMuted((muted) => !muted);
  };

  return (
    <Button
      icon={muted ? <AudioMutedOutlined /> : <AudioOutlined />}
      disabled={!ready || loading}
      onMouseUp={toggleMic}
    >
      Speak
    </Button>
  );
};

export default Microphone;

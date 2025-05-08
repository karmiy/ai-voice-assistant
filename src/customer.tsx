import React, { useEffect, useRef } from 'react';
import { Button } from 'antd';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import { MotionSync } from "live2d-motionsync";
import './customer.css';
import context from './context';
const logger = context.logger.tags('[Live2DModel]');

// 注册PIXI插件
// @ts-ignore - 忽略TypeScript错误
window.PIXI = PIXI;
// @ts-ignore - 忽略TypeScript错误
Live2DModel.registerTicker(PIXI.Ticker);

interface CustomerProps {
  width?: number;
  height?: number;
  modelPath?: string;
  scale?: number;
}

const Customer: React.FC<CustomerProps> = ({
  width = 800,
  height = 400,
  // modelPath = `${process.env.PUBLIC_URL}/live2d/Potion-Maker/Pio/index.json`,
  // modelPath = `https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json`,
  modelPath = `https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json`,
  scale = 0.25,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<Live2DModel>();
  const motionSyncRef = useRef<MotionSync>();
  const appRef = useRef<PIXI.Application>();

  // 初始化PIXI应用
  useEffect(() => {
    
    try {
      const loadModel = async () => {
        if (!canvasRef.current) return;

        const pixiApp = new PIXI.Application({
          view: canvasRef.current,
          autoStart: true,
          backgroundColor: 0x00000000, // 透明背景
          backgroundAlpha: 0,
          width,
          height,
          // resizeTo: window,
          // resolution: window.devicePixelRatio || 1,
        });
        appRef.current = pixiApp;

        const live2dModel = await Live2DModel.from(modelPath, { 
          autoInteract: true,
        });
        live2dModel.scale.set(scale);
        live2dModel.interactive = true;
        live2dModel.buttonMode = true;
        modelRef.current = live2dModel;
        logger.info('Model loaded successfully');

        const motionSync = new MotionSync(live2dModel.internalModel);
        motionSync.loadMotionSyncFromUrl(modelPath);
        motionSyncRef.current = motionSync;
        
        pixiApp.stage.addChild(live2dModel);
      };
      
      loadModel();
      return () => {
        modelRef.current && appRef.current?.stage.removeChild(modelRef.current);
        appRef.current?.destroy(true);
        modelRef.current?.destroy();
        motionSyncRef.current?.reset();
      };
    } catch (e: any) {
      logger.error('Error initializing PIXI:', e);
    }
  }, [width, height, modelPath, scale]);

  const play = async () => {
    const motionSync = motionSyncRef.current;
    if (!motionSync) {
      logger.info('motionSync is empty when play');
      return;
    }
    const response = await fetch(`${process.env.PUBLIC_URL}/sayhi.wav`);
    const arrayBuffer = await response.arrayBuffer();
    
    // 使用motionSync自己的AudioContext来解码
    const audioBuffer = await motionSync.audioContext.decodeAudioData(arrayBuffer);
    
    // 保存原始目标
    const originalDestination = motionSync.audioContext.destination;
    
    // 创建一个空节点作为目标（不连接到任何输出）
    const silentNode = motionSync.audioContext.createGain();
    silentNode.gain.value = 0;
    
    // 临时替换AudioContext的destination
    Object.defineProperty(motionSync.audioContext, 'destination', {
      value: silentNode,
      writable: true,
      configurable: true
    });
    motionSync.play(audioBuffer);
  };

  const stop = () => {
    motionSyncRef.current?.reset();
  };
  
  return (
    <>
      <div className="live2d-container" style={{ width, height }}>
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
      
      <div className="control-panel">
        <Button className="control-button" onClick={play}>
          Start speak
        </Button>
        <Button className="control-button" onClick={stop}>
          Start speak
          Stop 
        </Button>
      </div>
    </>
  );
};

export { Customer };

export interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
}

export interface MediaPipeHandedness {
  label: string;
  score: number;
}

export interface MediaPipeResults {
  multiHandLandmarks?: MediaPipeLandmark[][];
  multiHandedness?: MediaPipeHandedness[];
}

declare global {
  class Hands {
    constructor(options: { locateFile: (file: string) => string });
    setOptions(options: {
      maxNumHands?: number;
      modelComplexity?: number;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    onResults(callback: (results: MediaPipeResults) => void): void;
    send(input: { image: HTMLVideoElement }): Promise<void>;
  }

  class Camera {
    constructor(
      video: HTMLVideoElement,
      options: { onFrame: () => Promise<void>; width: number; height: number }
    );
    start(): Promise<void>;
    stop(): Promise<void>;
  }
}

export {};

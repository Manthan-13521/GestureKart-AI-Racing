declare const Hands: any;
declare const Camera: any;

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  handsDetected: number;
  centerX: number;
  rawCenterX: number;
  landmarks: Landmark[][];
  handedness: string[];
  confidence: number;
}

export type HandCallback = (data: HandData) => void;

const LEFT_THRESHOLD = 0.40;
const RIGHT_THRESHOLD = 0.60;

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17], [1, 5],
];

export class HandTracker {
  private hands: any;
  private camera: any;
  private callback: HandCallback;
  private running = false;
  private smoothAlpha = 0.55;
  private smoothedX = 0.5;

  constructor(videoElement: HTMLVideoElement, callback: HandCallback) {
    this.callback = callback;

    this.hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((results: any) => this.onResults(results));

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        try {
          await this.hands.send({ image: videoElement });
        } catch {
          // frame skipped
        }
      },
      width: 640,
      height: 480,
    });
  }

  setSmoothing(alpha: number): void {
    this.smoothAlpha = Math.max(0.01, Math.min(0.99, alpha));
  }

  async start(): Promise<void> {
    this.running = true;
    try {
      await this.camera.start();
    } catch (err) {
      console.error('Camera start failed:', err);
      this.running = false;
      throw err;
    }
  }

  stop(): void {
    this.running = false;
    try {
      this.camera.stop();
    } catch {
      // ignore
    }
  }

  private onResults(results: any): void {
    if (!this.running) return;

    const allLandmarks = results.multiHandLandmarks;
    const handedness = results.multiHandedness || [];
    const handsDetected = allLandmarks?.length ?? 0;

    let rawCenterX = 0.5;
    const landmarksOut: Landmark[][] = [];

    if (handsDetected >= 2) {
      const lm0 = allLandmarks[0];
      const lm1 = allLandmarks[1];
      const palm0 = (lm0[0].x + lm0[5].x + lm0[9].x) / 3;
      const palm1 = (lm1[0].x + lm1[5].x + lm1[9].x) / 3;
      rawCenterX = (palm0 + palm1) / 2;
    } else if (handsDetected === 1) {
      const lm = allLandmarks[0];
      rawCenterX = (lm[0].x + lm[5].x + lm[9].x) / 3;
    }

    this.smoothedX =
      this.smoothAlpha * rawCenterX + (1 - this.smoothAlpha) * this.smoothedX;

    for (const lm of allLandmarks || []) {
      landmarksOut.push(
        lm.map((p: any) => ({ x: p.x, y: p.y, z: p.z }))
      );
    }

    const confidence =
      handsDetected > 0
        ? handedness.reduce(
            (sum: number, h: any) => sum + (h.score ?? 0),
            0,
          ) / handsDetected
        : 0;

    this.callback({
      handsDetected,
      centerX: this.smoothedX,
      rawCenterX,
      landmarks: landmarksOut,
      handedness: handedness.map((h: any) => h.label ?? ''),
      confidence,
    });
  }
}

export function getDirection(
  centerX: number,
): 'LEFT' | 'STRAIGHT' | 'RIGHT' {
  if (centerX < LEFT_THRESHOLD) return 'LEFT';
  if (centerX > RIGHT_THRESHOLD) return 'RIGHT';
  return 'STRAIGHT';
}

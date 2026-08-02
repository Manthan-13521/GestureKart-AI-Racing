export class AudioManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private volume = 1;

  get masterVolume(): number {
    return this.volume;
  }

  set masterVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.ctx.state !== 'suspended') {
      this.refreshEngine();
    }
  }

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;
      this.engineOsc.connect(this.engineGain);
      this.engineOsc.start();

      this.subGain = this.ctx.createGain();
      this.subGain.gain.value = 0;
      this.subGain.connect(this.ctx.destination);

      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.value = 30;
      this.subOsc.connect(this.subGain);
      this.subOsc.start();
    } catch {
      // audio not available
    }
  }

  updateEngineSound(speed: number): void {
    if (!this.engineOsc || !this.engineGain || !this.subOsc || !this.subGain || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const freq = 60 + speed * 80;
    const vol = speed > 0.1 ? (0.04 + speed * 0.02) * this.volume : 0;
    const subVol = speed > 0.1 ? (0.06 + speed * 0.015) * this.volume : 0;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    this.subOsc.frequency.setTargetAtTime(freq * 0.5, this.ctx.currentTime, 0.15);
    this.subGain.gain.setTargetAtTime(subVol, this.ctx.currentTime, 0.15);
  }

  playCollision(): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 120;
    gain.gain.value = 0.15 * this.volume;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.stop(this.ctx.currentTime + 0.3);
  }

  private refreshEngine(): void {
    const speed = 0;
    this.updateEngineSound(speed);
  }

  stopEngine(): void {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
    if (this.subGain && this.ctx) {
      this.subGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }

  dispose(): void {
    this.engineOsc?.stop();
    this.subOsc?.stop();
    this.engineGain?.disconnect();
    this.subGain?.disconnect();
    void this.ctx?.close();
    this.engineOsc = null;
    this.subOsc = null;
    this.engineGain = null;
    this.subGain = null;
    this.ctx = null;
  }
}

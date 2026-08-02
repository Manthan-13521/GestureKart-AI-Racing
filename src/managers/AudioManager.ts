import type { WeatherKind } from '../graphics/WeatherSystem';

export class AudioManager {
  private ctx: AudioContext | null = null;

  // Engine layer
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;

  // Turbo whine (high-freq sine, speed > 0.7)
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Rain ambience (filtered noise)
  private rainBuffer: AudioBuffer | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  // Master output
  private masterGain: GainNode | null = null;

  private volume = 1;
  private lastGear = 1;

  get masterVolume(): number {
    return this.volume;
  }
  set masterVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      // Engine oscillator (sawtooth) through low-pass filter
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineGain.connect(this.masterGain);

      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;

      const lpf = this.ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 900;
      lpf.Q.value = 0.8;
      this.engineOsc.connect(lpf);
      lpf.connect(this.engineGain);
      this.engineOsc.start();

      // Sub oscillator (sine rumble)
      this.subGain = this.ctx.createGain();
      this.subGain.gain.value = 0;
      this.subGain.connect(this.masterGain);

      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.value = 30;
      this.subOsc.connect(this.subGain);
      this.subOsc.start();

      // Turbo whine (high-frequency sine)
      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.value = 0;
      this.turboGain.connect(this.masterGain);

      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.value = 1400;
      this.turboOsc.connect(this.turboGain);
      this.turboOsc.start();

      // Rain ambience setup
      this.setupRain();
    } catch {
      // audio not available
    }
  }

  private setupRain(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    this.rainBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = this.rainBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.value = 3500;
    this.rainFilter.Q.value = 0.4;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain!);
  }

  private startRainSource(): void {
    if (!this.ctx || !this.rainBuffer || !this.rainFilter) return;
    try {
      this.rainSource?.stop();
    } catch {
      /* ok */
    }
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = this.rainBuffer;
    this.rainSource.loop = true;
    this.rainSource.connect(this.rainFilter);
    this.rainSource.start();
  }

  updateEngineSound(speed: number): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.subOsc || !this.subGain) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const t = this.ctx.currentTime;
    const freq = 60 + speed * 90;
    const vol = speed > 0.1 ? 0.035 + speed * 0.018 : 0;
    const subVol = speed > 0.1 ? 0.055 + speed * 0.013 : 0;

    this.engineOsc.frequency.setTargetAtTime(freq, t, 0.08);
    this.engineGain.gain.setTargetAtTime(vol, t, 0.08);
    this.subOsc.frequency.setTargetAtTime(freq * 0.5, t, 0.12);
    this.subGain.gain.setTargetAtTime(subVol, t, 0.12);

    if (this.turboOsc && this.turboGain) {
      const turboIntensity = Math.max(0, (speed - 1.8) / 1.2);
      this.turboOsc.frequency.setTargetAtTime(1200 + speed * 200, t, 0.15);
      this.turboGain.gain.setTargetAtTime(turboIntensity * 0.012, t, 0.15);
    }
  }

  /** React to gear changes — upshift crackle / downshift blip. */
  updateGear(gear: number): void {
    if (!this.ctx || gear === this.lastGear) return;
    const up = gear > this.lastGear;
    this.lastGear = gear;
    if (up) {
      this.playTone(220 + gear * 30, 0.06, 0.06, 'square');
      setTimeout(() => this.playTone(180 + gear * 25, 0.04, 0.04, 'square'), 40);
    } else {
      this.playTone(160, 0.08, 0.09, 'sawtooth');
    }
  }

  /** Crossfade rain ambience based on weather. */
  updateWeather(kind: WeatherKind): void {
    if (!this.ctx || !this.rainGain) return;
    const t = this.ctx.currentTime;
    if (!this.rainSource && (kind === 'rain' || kind === 'storm')) {
      this.startRainSource();
    }
    const rainVol = kind === 'storm' ? 0.14 : kind === 'rain' ? 0.07 : 0;
    this.rainGain.gain.setTargetAtTime(rainVol, t, 1.5);
    if (this.rainFilter) {
      this.rainFilter.frequency.setTargetAtTime(kind === 'storm' ? 4500 : 3000, t, 1.5);
    }
  }

  playCollision(): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.playTone(80, 0.18, 0.15, 'square');
    setTimeout(() => this.playTone(55, 0.12, 0.12, 'sawtooth'), 30);
    setTimeout(() => this.playTone(40, 0.07, 0.1, 'sine'), 80);
  }

  stopEngine(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.engineGain?.gain.setTargetAtTime(0, t, 0.2);
    this.subGain?.gain.setTargetAtTime(0, t, 0.2);
    this.turboGain?.gain.setTargetAtTime(0, t, 0.3);
  }

  private playTone(freq: number, vol: number, duration: number, type: OscillatorType): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol * this.volume;
    osc.connect(gain);
    gain.connect(this.masterGain ?? this.ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.stop(this.ctx.currentTime + duration);
  }

  dispose(): void {
    try {
      this.rainSource?.stop();
    } catch {
      /* ok */
    }
    this.engineOsc?.stop();
    this.subOsc?.stop();
    this.turboOsc?.stop();
    this.masterGain?.disconnect();
    void this.ctx?.close();
    this.ctx = null;
    this.engineOsc = null;
    this.subOsc = null;
    this.turboOsc = null;
    this.turboGain = null;
    this.rainSource = null;
    this.rainGain = null;
    this.rainFilter = null;
    this.masterGain = null;
  }
}

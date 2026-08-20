import type { WeatherKind } from '../graphics/WeatherSystem';
import { SfxCooldown } from './SfxCooldown';

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

  // Wind ambience (filtered noise, GDD §12.2 ambience loop)
  private windBuffer: AudioBuffer | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Music layer (GDD §12.1 adaptive music: menu −6dB / race pad)
  private musicGain: GainNode | null = null;
  private musicOscs: OscillatorNode[] = [];
  private musicPlaying = false;
  private raceMusicIntensity = 0;

  // Master output
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  private volume = 1;
  private lastGear = 1;

  /** Cooldown guard (ms) so one-shot SFX never double-trigger in a frame. */
  private readonly sfxCooldown = new SfxCooldown();

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

      // Buses (GDD §12.1): sfx + ambience under the master.
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.value = 1;
      this.ambienceGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      // Menu music mixed at −6dB per GDD §12.3.
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.masterGain);

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
      this.setupWind();
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
    this.rainGain.connect(this.ambienceGain!);
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

  private setupWind(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    this.windBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = this.windBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      // Low-pass-ish noise via simple leaky integrator for a "wind" bed.
      last = (last + (Math.random() * 2 - 1) * 0.08) * 0.992;
      data[i] = last * 2.5;
    }
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 320;
    this.windFilter.Q.value = 0.6;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambienceGain!);
  }

  private startWindSource(): void {
    if (!this.ctx || !this.windBuffer || !this.windFilter) return;
    try {
      this.windSource?.stop();
    } catch {
      /* ok */
    }
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.windBuffer;
    this.windSource.loop = true;
    this.windSource.connect(this.windFilter);
    this.windSource.start();
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

  /** Crossfade rain + wind ambience based on weather. */
  updateWeather(kind: WeatherKind): void {
    if (!this.ctx || !this.rainGain || !this.windGain) return;
    const t = this.ctx.currentTime;
    if (!this.rainSource && (kind === 'rain' || kind === 'storm')) {
      this.startRainSource();
    }
    if (!this.windSource) {
      this.startWindSource();
    }
    const rainVol = kind === 'storm' ? 0.14 : kind === 'rain' ? 0.07 : 0;
    this.rainGain.gain.setTargetAtTime(rainVol, t, 1.5);
    if (this.rainFilter) {
      this.rainFilter.frequency.setTargetAtTime(kind === 'storm' ? 4500 : 3000, t, 1.5);
    }
    // Wind bed present for clear / fog; rain layers the storm on top.
    const windVol = kind === 'fog' ? 0.05 : kind === 'storm' ? 0.045 : 0.03;
    this.windGain.gain.setTargetAtTime(windVol, t, 1.5);
    if (this.windFilter) {
      this.windFilter.frequency.setTargetAtTime(kind === 'fog' ? 240 : 320, t, 1.5);
    }
  }

  /** One-shot SFX with a per-kind cooldown (no duplicate playback in a frame). */
  private playSfx(name: string, ms: number, fn: () => void): void {
    if (!this.ctx) return;
    if (!this.sfxCooldown.tryAcquire(name, ms)) return;
    fn();
  }

  /** Boost activation swell (GDD §12.2). */
  playBoost(): void {
    this.playSfx('boost', 250, () => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06 * this.volume, this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain ?? this.masterGain ?? this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    });
  }

  /** Near-miss whoosh (GDD §12.2). */
  playNearMiss(): void {
    this.playSfx('nearmiss', 300, () => {
      if (!this.ctx || !this.sfxGain) return;
      const duration = 0.22;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const p = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.sin(p * Math.PI) * 0.5;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(400, this.ctx.currentTime);
      bp.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + duration);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      src.connect(bp);
      bp.connect(gain);
      gain.connect(this.sfxGain);
      src.start();
      src.stop(this.ctx.currentTime + duration);
    });
  }

  /** Ghost delta tick — pitch up when ahead, down when behind (GDD §12.2). */
  playGhostTick(ahead: boolean): void {
    this.playSfx('ghost', 450, () => {
      if (!this.ctx) return;
      this.playTone(ahead ? 1320 : 620, 0.05, 0.05, 'sine');
    });
  }

  /** Cinematic intro sting (GDD §12.2). */
  playIntroSting(): void {
    this.playSfx('intro', 1000, () => {
      if (!this.ctx) return;
      this.playTone(220, 0.6, 0.05, 'triangle');
      setTimeout(() => this.playTone(330, 0.6, 0.05, 'triangle'), 120);
      setTimeout(() => this.playTone(440, 0.7, 0.055, 'triangle'), 260);
    });
  }

  /** Lightning rumble during storms (GDD §12.2). */
  playLightningRumble(): void {
    this.playSfx('lightning', 800, () => {
      if (!this.ctx) return;
      this.playTone(60, 0.7, 0.12, 'sine');
      setTimeout(() => this.playTone(48, 0.8, 0.1, 'sine'), 120);
    });
  }

  /** Victory brass + crowd wash (GDD §12.2). */
  playVictory(): void {
    if (!this.ctx) return;
    this.playTone(523, 0.5, 0.06, 'triangle');
    setTimeout(() => this.playTone(659, 0.5, 0.06, 'triangle'), 140);
    setTimeout(() => this.playTone(784, 0.6, 0.065, 'triangle'), 280);
    setTimeout(() => this.playTone(1046, 0.9, 0.05, 'sine'), 420);
    this.playNoiseWash(0.16);
  }

  /** Defeat minor resolve (GDD §12.2). */
  playDefeat(): void {
    if (!this.ctx) return;
    this.playTone(440, 0.4, 0.05, 'triangle');
    setTimeout(() => this.playTone(349, 0.4, 0.05, 'triangle'), 160);
    setTimeout(() => this.playTone(294, 0.7, 0.05, 'triangle'), 320);
  }

  private playNoiseWash(volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const duration = 1.4;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    src.connect(gain);
    gain.connect(this.sfxGain);
    src.start();
    src.stop(this.ctx.currentTime + duration);
  }

  /** Menu / race music layer. `intensity` 0..1 drives race music pace (GDD §12.1). */
  startMusic(kind: 'menu' | 'race', intensity = 0): void {
    if (!this.ctx || !this.musicGain) return;
    if (this.musicPlaying) this.stopMusic();
    this.raceMusicIntensity = intensity;
    this.musicPlaying = true;

    const baseFreq = kind === 'menu' ? 164 : 196;
    const oscCount = kind === 'menu' ? 3 : 2;
    const startedAt = this.ctx.currentTime;
    for (let i = 0; i < oscCount; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const detune = (i - (oscCount - 1) / 2) * (kind === 'menu' ? 4 : 2);
      osc.frequency.value = baseFreq * (1 + (i % 2) * 0.25) + detune;
      osc.detune.value = detune;
      const gain = this.ctx.createGain();
      const vol = kind === 'menu' ? 0.05 : 0.035;
      gain.gain.setValueAtTime(0.001, startedAt);
      gain.gain.exponentialRampToValueAtTime(vol, startedAt + 0.6);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(startedAt);
      if (kind === 'menu') {
        // Slow LFO on the pad so the menu bed breathes.
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.08 + i * 0.03;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = vol * 0.4;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start(startedAt);
        this.musicOscs.push(lfo as OscillatorNode);
      }
      this.musicOscs.push(osc);
    }
  }

  /** Retune the race music pad from 0..1 intensity (GDD §12.1 adaptive music). */
  updateMusic(intensity: number): void {
    this.raceMusicIntensity = Math.max(0, Math.min(1, intensity));
    if (!this.ctx || !this.musicOscs.length) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < this.musicOscs.length; i++) {
      this.musicOscs[i].frequency.setTargetAtTime(
        (i % 2 === 0 ? 196 : 246.9) * (1 + this.raceMusicIntensity * 0.25),
        t,
        0.3
      );
    }
  }

  stopMusic(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const osc of this.musicOscs) {
      try {
        osc.stop(t + 0.2);
      } catch {
        /* ok */
      }
    }
    this.musicOscs = [];
    this.musicPlaying = false;
  }

  get isMusicPlaying(): boolean {
    return this.musicPlaying;
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

  /** Silence all continuous layers (engine, ambience, music) — lifecycle stop. */
  stopAll(): void {
    this.stopEngine();
    this.stopMusic();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.rainGain?.gain.setTargetAtTime(0, t, 0.2);
    this.windGain?.gain.setTargetAtTime(0, t, 0.2);
  }

  private playTone(freq: number, vol: number, duration: number, type: OscillatorType): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol * this.volume;
    osc.connect(gain);
    gain.connect(this.sfxGain ?? this.masterGain ?? this.ctx.destination);
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
    try {
      this.windSource?.stop();
    } catch {
      /* ok */
    }
    this.engineOsc?.stop();
    this.subOsc?.stop();
    this.turboOsc?.stop();
    for (const osc of this.musicOscs) {
      try {
        osc.stop();
      } catch {
        /* ok */
      }
    }
    this.masterGain?.disconnect();
    this.sfxGain?.disconnect();
    this.ambienceGain?.disconnect();
    this.musicGain?.disconnect();
    void this.ctx?.close();
    this.ctx = null;
    this.engineOsc = null;
    this.subOsc = null;
    this.turboOsc = null;
    this.turboGain = null;
    this.rainSource = null;
    this.rainGain = null;
    this.rainFilter = null;
    this.windSource = null;
    this.windGain = null;
    this.windFilter = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;
    this.musicGain = null;
    this.musicOscs = [];
  }
}

/**
 * UI sound hooks. Tiny synthesized UI feedback (hover, press, confirm,
 * back) that respects the audio context unlock contract used elsewhere
 * in the game. Playback is a no-op until the user has interacted once.
 */
export class SoundHooks {
  private static ctx: AudioContext | null = null;
  private static unlocked = false;
  static enabled = true;
  /** 0..1 UI gain multiplier synced to the game master volume (GDD §12.3). */
  static volume = 1;

  static unlock(): void {
    if (SoundHooks.unlocked) return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        SoundHooks.ctx = new Ctor();
        void SoundHooks.ctx.resume();
        SoundHooks.unlocked = true;
      }
    } catch {
      // audio unavailable
    }
  }

  static dispose(): void {
    void SoundHooks.ctx?.close();
    SoundHooks.ctx = null;
    SoundHooks.unlocked = false;
  }

  static hover(): void {
    SoundHooks.tone(880, 0.03, 0.02, 'sine');
  }

  static press(): void {
    SoundHooks.tone(440, 0.05, 0.05, 'triangle');
  }

  static confirm(): void {
    SoundHooks.tone(660, 0.07, 0.06, 'sine');
    setTimeout(() => SoundHooks.tone(990, 0.09, 0.05, 'sine'), 60);
  }

  static back(): void {
    SoundHooks.tone(330, 0.08, 0.05, 'triangle');
  }

  static error(): void {
    SoundHooks.tone(180, 0.15, 0.06, 'square');
  }

  /** Soft tick used by the race countdown (3-2-1). */
  static countdownTick(): void {
    SoundHooks.tone(520, 0.06, 0.045, 'square');
  }

  /** Rising chime for GO / race start. */
  static raceStart(): void {
    SoundHooks.tone(523, 0.08, 0.05, 'sine');
    setTimeout(() => SoundHooks.tone(784, 0.08, 0.05, 'sine'), 90);
    setTimeout(() => SoundHooks.tone(1046, 0.16, 0.055, 'sine'), 180);
  }

  /** Descending fanfare for race finished. */
  static raceFinish(): void {
    SoundHooks.tone(1046, 0.1, 0.05, 'sine');
    setTimeout(() => SoundHooks.tone(784, 0.1, 0.05, 'sine'), 110);
    setTimeout(() => SoundHooks.tone(523, 0.24, 0.05, 'sine'), 220);
  }

  /** Bright rising "NEW RECORD" gold sting (GDD §12.2). */
  static newRecord(): void {
    SoundHooks.tone(784, 0.09, 0.06, 'sine');
    setTimeout(() => SoundHooks.tone(988, 0.09, 0.06, 'sine'), 90);
    setTimeout(() => SoundHooks.tone(1318, 0.16, 0.07, 'sine'), 180);
    setTimeout(() => SoundHooks.tone(1760, 0.28, 0.05, 'sine'), 280);
  }

  /** Deny buzz for rejected actions (GDD §12.2 UI deny). */
  static deny(): void {
    SoundHooks.tone(160, 0.12, 0.05, 'square');
    setTimeout(() => SoundHooks.tone(120, 0.16, 0.05, 'square'), 90);
  }

  /** Attach hover/press feedback to a button element. */
  static attach(btn: HTMLElement): void {
    btn.addEventListener('pointerenter', () => SoundHooks.hover());
    btn.addEventListener('click', () => SoundHooks.press());
  }

  private static tone(freq: number, duration: number, volume: number, type: OscillatorType): void {
    if (!SoundHooks.ctx || !SoundHooks.unlocked || !SoundHooks.enabled) return;
    if (SoundHooks.ctx.state === 'suspended') void SoundHooks.ctx.resume();
    const osc = SoundHooks.ctx.createOscillator();
    const gain = SoundHooks.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume * SoundHooks.volume;
    osc.connect(gain);
    gain.connect(SoundHooks.ctx.destination);
    osc.start();
    osc.stop(SoundHooks.ctx.currentTime + duration);
  }
}

/**
 * UI sound hooks. Tiny synthesized UI feedback (hover, press, confirm,
 * back) that respects the audio context unlock contract used elsewhere
 * in the game. Playback is a no-op until the user has interacted once.
 */
export class SoundHooks {
  private static ctx: AudioContext | null = null;
  private static unlocked = false;
  static enabled = true;

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
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(SoundHooks.ctx.destination);
    osc.start();
    osc.stop(SoundHooks.ctx.currentTime + duration);
  }
}

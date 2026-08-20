/**
 * Boost state for Survival mode.
 * Activated by collecting a boost pickup.
 * Provides a speed burst and 1.5 seconds of invulnerability.
 */

export const BOOST_DURATION = 1.5; // seconds of invulnerability
export const BOOST_SPEED_BONUS = 1.0; // additional speed during boost

export interface BoostState {
  active: boolean;
  timeLeft: number; // seconds remaining
  speedBonus: number;
  invulnerable: boolean;
}

/**
 * Boost controller for Survival mode.
 * Manages boost timer, invulnerability, and speed bonus.
 * Refreshes duration on new pickup (does not stack additively).
 */
export class BoostController {
  private timeLeft = 0;
  private readonly duration: number;
  private readonly speedBonus: number;

  constructor(duration = BOOST_DURATION, speedBonus = BOOST_SPEED_BONUS) {
    this.duration = duration;
    this.speedBonus = speedBonus;
  }

  get state(): BoostState {
    return {
      active: this.timeLeft > 0,
      timeLeft: this.timeLeft,
      speedBonus: this.speedBonus,
      invulnerable: this.timeLeft > 0,
    };
  }

  /** Activate or refresh boost (e.g., on pickup collection). */
  activate(): void {
    this.timeLeft = this.duration;
  }

  /** Decrement timer by delta (seconds). Returns true if boost was active this frame. */
  tick(delta: number): boolean {
    if (this.timeLeft > 0) {
      this.timeLeft = Math.max(0, this.timeLeft - delta);
      return true;
    }
    return false;
  }

  reset(): void {
    this.timeLeft = 0;
  }
}

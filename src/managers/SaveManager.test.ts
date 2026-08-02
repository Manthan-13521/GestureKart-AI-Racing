import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from './SaveManager';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing is stored', () => {
    const sm = new SaveManager();
    expect(sm.sensitivity).toBe(75);
    expect(sm.autoAccelerate).toBe(false);
    expect(sm.gyroscopeMode).toBe(false);
    expect(sm.bestScore).toBe(0);
  });

  it('persists settings across instances', () => {
    const a = new SaveManager();
    a.sensitivity = 40;
    a.autoAccelerate = true;
    a.setBestScore(1234);

    const b = new SaveManager();
    expect(b.sensitivity).toBe(40);
    expect(b.autoAccelerate).toBe(true);
    expect(b.bestScore).toBe(1234);
  });

  it('recovers from corrupted storage', () => {
    localStorage.setItem('virtual-steering:v1', '{not valid json');
    const sm = new SaveManager();
    expect(sm.sensitivity).toBe(75);
  });

  it('merges missing keys with defaults (forward compat)', () => {
    localStorage.setItem('virtual-steering:v1', JSON.stringify({ sensitivity: 30 }));
    const sm = new SaveManager();
    expect(sm.sensitivity).toBe(30);
    expect(sm.gyroscopeMode).toBe(false);
    expect(sm.version).toBe(2);
    expect(sm.masterVolume).toBe(1);
    expect(sm.a11y.reducedMotion).toBe(false);
  });

  it('only keeps the best score', () => {
    const sm = new SaveManager();
    sm.setBestScore(500);
    sm.setBestScore(200);
    expect(sm.bestScore).toBe(500);
  });
});

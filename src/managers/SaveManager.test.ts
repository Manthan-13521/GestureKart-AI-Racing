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
    expect(sm.version).toBe(4);
    expect(sm.masterVolume).toBe(1);
    expect(sm.a11y.reducedMotion).toBe(false);
    expect(sm.a11y.colorblindMode).toBe('none');
  });

  it('migrates legacy colorblind boolean to deuteranopia preset', () => {
    localStorage.setItem('virtual-steering:v1', JSON.stringify({ colorblind: true }));
    const sm = new SaveManager();
    expect(sm.a11y.colorblind).toBe(true);
    expect(sm.a11y.colorblindMode).toBe('deuteranopia');
  });

  it('only keeps the best score', () => {
    const sm = new SaveManager();
    sm.setBestScore(500);
    sm.setBestScore(200);
    expect(sm.bestScore).toBe(500);
  });
});

describe('SaveManager - High Scores', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a high score', () => {
    const sm = new SaveManager('virtual-steering:test_add');
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    const scores = sm.getHighScores('endless', 'survival');
    expect(scores.length).toBe(1);
    expect(scores[0].score).toBe(1000);
    expect(scores[0].track).toBe('endless');
    expect(scores[0].mode).toBe('survival');
  });

  it('sorts scores descending', () => {
    const sm = new SaveManager('virtual-steering:test_sort');
    sm.addHighScore({ score: 500, track: 'endless', mode: 'survival' });
    sm.addHighScore({ score: 1500, track: 'endless', mode: 'survival' });
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    const scores = sm.getHighScores('endless', 'survival');
    expect(scores[0].score).toBe(1500);
    expect(scores[1].score).toBe(1000);
    expect(scores[2].score).toBe(500);
  });

  it('caps at MAX_HIGH_SCORES (10)', () => {
    const sm = new SaveManager('virtual-steering:test_cap');
    for (let i = 1; i <= 15; i++) {
      sm.addHighScore({ score: i * 100, track: 'endless', mode: 'survival' });
    }
    const scores = sm.getHighScores('endless', 'survival');
    expect(scores.length).toBe(10);
    expect(scores[0].score).toBe(1500);
    expect(scores[9].score).toBe(600);
  });

  it('prevents duplicate insertion', () => {
    let time = 1000000;
    const timeFn = () => time;
    const sm = new SaveManager('virtual-steering:test_dup', timeFn);
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    time += 100;
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    const scores = sm.getHighScores('endless', 'survival');
    expect(scores.length).toBe(1);
  });

  it('allows same score after time window', () => {
    let time = 1000000;
    const timeFn = () => time;
    const sm = new SaveManager('virtual-steering:test_timewin', timeFn);
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    time += 6000;
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    const scores = sm.getHighScores('endless', 'survival');
    expect(scores.length).toBe(2);
  });

  it('isolates by track and mode', () => {
    const sm = new SaveManager('virtual-steering:test_iso');
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    sm.addHighScore({ score: 2000, track: 'cyber-city', mode: 'versus' });
    const survivalScores = sm.getHighScores('endless', 'survival');
    const versusScores = sm.getHighScores('cyber-city', 'versus');
    expect(survivalScores.length).toBe(1);
    expect(versusScores.length).toBe(1);
    expect(survivalScores[0].score).toBe(1000);
    expect(versusScores[0].score).toBe(2000);
  });

  it('isHighScore returns true when table not full', () => {
    const sm = new SaveManager('virtual-steering:test_ishigh');
    expect(sm.isHighScore(100, 'endless', 'survival')).toBe(true);
  });

  it('isHighScore returns true when score beats lowest', () => {
    const sm = new SaveManager('virtual-steering:test_beats');
    for (let i = 1; i <= 10; i++) {
      sm.addHighScore({ score: i * 100, track: 'endless', mode: 'survival' });
    }
    expect(sm.isHighScore(150, 'endless', 'survival')).toBe(true);
    expect(sm.isHighScore(50, 'endless', 'survival')).toBe(false);
  });

  it('getAllHighScores returns all scores', () => {
    const sm = new SaveManager('virtual-steering:test_all');
    sm.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    sm.addHighScore({ score: 2000, track: 'cyber-city', mode: 'versus' });
    const all = sm.getAllHighScores();
    expect(all.length).toBe(2);
  });

  it('persists high scores across instances', () => {
    const sm1 = new SaveManager('virtual-steering:test_persist');
    sm1.addHighScore({ score: 1000, track: 'endless', mode: 'survival' });
    const sm2 = new SaveManager('virtual-steering:test_persist');
    const scores = sm2.getHighScores('endless', 'survival');
    expect(scores.length).toBe(1);
    expect(scores[0].score).toBe(1000);
  });

  it('legacy bestScore still works', () => {
    const sm = new SaveManager('virtual-steering:test_legacy');
    sm.setBestScore(500);
    expect(sm.bestScore).toBe(500);
    sm.setBestScore(300);
    expect(sm.bestScore).toBe(500);
    sm.setBestScore(700);
    expect(sm.bestScore).toBe(700);
  });

  it('handles corrupted high scores gracefully', () => {
    localStorage.setItem(
      'virtual-steering:test_corrupt',
      JSON.stringify({
        version: 3,
        bestScore: 0,
        highScores: 'not an array',
      })
    );
    const sm = new SaveManager('virtual-steering:test_corrupt');
    expect(sm.getHighScores('endless', 'survival')).toEqual([]);
  });
});

describe('SaveManager - P12 sanitization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clamps out-of-range numeric settings to valid bounds', () => {
    localStorage.setItem(
      'virtual-steering:p12_clamp',
      JSON.stringify({ version: 4, sensitivity: 999, masterVolume: 99 })
    );
    const sm = new SaveManager('virtual-steering:p12_clamp');
    expect(sm.sensitivity).toBe(100);
    expect(sm.masterVolume).toBe(1);
  });

  it('rejects non-numeric settings instead of propagating NaN', () => {
    localStorage.setItem(
      'virtual-steering:p12_nan',
      JSON.stringify({ version: 4, sensitivity: 'abc', masterVolume: 'loud', bestScore: 'x' })
    );
    const sm = new SaveManager('virtual-steering:p12_nan');
    expect(sm.sensitivity).toBe(75);
    expect(sm.masterVolume).toBe(1);
    expect(sm.bestScore).toBe(0);
  });

  it('rejects unknown enum values for graphicsQuality and colorblindMode', () => {
    localStorage.setItem(
      'virtual-steering:p12_enum',
      JSON.stringify({ version: 4, graphicsQuality: 'ultra', colorblindMode: 'protanopia' })
    );
    const sm = new SaveManager('virtual-steering:p12_enum');
    expect(sm.graphicsQuality).toBe('balanced');
    expect(sm.a11y.colorblindMode).toBe('protanopia');
  });

  it('rejects boolean fields that are not booleans', () => {
    localStorage.setItem(
      'virtual-steering:p12_bool',
      JSON.stringify({ version: 4, autoAccelerate: 1, oneHand: 'yes', shadows: true })
    );
    const sm = new SaveManager('virtual-steering:p12_bool');
    expect(sm.autoAccelerate).toBe(false);
    expect(sm.oneHand).toBe(false);
    expect(sm.shadows).toBe(true);
  });

  it('fails closed on unknown future versions', () => {
    localStorage.setItem(
      'virtual-steering:p12_future',
      JSON.stringify({ version: 99, sensitivity: 10, bestScore: 5000 })
    );
    const sm = new SaveManager('virtual-steering:p12_future');
    expect(sm.sensitivity).toBe(75);
    expect(sm.bestScore).toBe(0);
  });

  it('strips invalid high-score entries (stored-data XSS defense)', () => {
    localStorage.setItem(
      'virtual-steering:p12_hs',
      JSON.stringify({
        version: 4,
        highScores: [
          { score: 1000, track: 'endless', mode: 'survival', timestamp: 12345 },
          { score: '<img onerror=alert(1)>', track: 'endless', mode: 'survival', timestamp: 1 },
          { score: 500, track: 'endless', mode: 'survival', timestamp: 'not-a-number' },
          { score: -50, track: 'endless', mode: 'survival', timestamp: 9000 },
          { score: 200, track: 'endless', mode: 'survival', timestamp: 8000, distance: 'x', combo: -3 },
        ],
      })
    );
    const sm = new SaveManager('virtual-steering:p12_hs');
    const scores = sm.getAllHighScores();
    expect(scores.length).toBe(2);
    expect(scores[0].score).toBe(1000);
    expect(scores[0].timestamp).toBe(12345);
    expect(scores[1].score).toBe(200);
  });

  it('caps sanitized high scores at the max and keeps them sorted', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      score: 1000 + i,
      track: 'endless',
      mode: 'survival',
      timestamp: i,
    }));
    localStorage.setItem('virtual-steering:p12_hs_cap', JSON.stringify({ version: 4, highScores: entries }));
    const sm = new SaveManager('virtual-steering:p12_hs_cap');
    const scores = sm.getAllHighScores();
    expect(scores.length).toBe(10);
    expect(scores[0].score).toBe(1019);
    expect(scores[9].score).toBe(1010);
  });

  it('still migrates legacy colorblind boolean to the preset default', () => {
    localStorage.setItem(
      'virtual-steering:p12_legacy',
      JSON.stringify({ version: 4, colorblind: true, colorblindMode: 'none' })
    );
    const sm = new SaveManager('virtual-steering:p12_legacy');
    expect(sm.a11y.colorblindMode).toBe('none');
  });
});

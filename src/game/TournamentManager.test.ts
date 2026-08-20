/**
 * Tournament Manager Tests
 *
 * Tests for P5.4 Tournament + Podium Verification
 * Covers division progression, points calculation, promotion rules, persistence, etc.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TournamentManager } from './TournamentManager';

describe('TournamentManager', () => {
  let tm: TournamentManager;

  beforeEach(() => {
    // Create a fresh instance for each test
    tm = new TournamentManager();
    // Clear localStorage between tests to avoid interference
    localStorage.removeItem('vs_tournament_state');
  });

  describe('Initial State', () => {
    it('starts in Rookie division', () => {
      expect(tm.activeState.division).toBe('rookie');
    });

    it('starts at race 0', () => {
      expect(tm.activeState.currentRace).toBe(0);
    });

    it('starts with 0 points', () => {
      expect(tm.activeState.points).toBe(0);
    });

    it('starts with empty history', () => {
      expect(tm.activeState.history).toEqual([]);
    });

    it('starts inactive', () => {
      expect(tm.activeState.active).toBe(false);
    });
  });

  describe('startNew()', () => {
    it('resets to Rookie division', () => {
      // First put TM in some non-initial state
      tm.recordFinish(1);
      tm.recordFinish(2);
      expect(tm.activeState.currentRace).toBeGreaterThan(0);
      expect(tm.activeState.points).toBeGreaterThan(0);

      // Call startNew
      tm.startNew();
      const state = tm.activeState;
      expect(state.division).toBe('rookie');
      expect(state.currentRace).toBe(0);
      expect(state.points).toBe(0);
      expect(state.history).toEqual([]);
      expect(state.active).toBe(true);
    });
  });

  describe('reset()', () => {
    it('resets to Rookie division and inactive', () => {
      // First set to active state by completing some races
      tm.recordFinish(1);
      tm.recordFinish(1);
      expect(tm.activeState.active).toBe(true);
      expect(tm.activeState.division).toBe('rookie');

      tm.reset();
      const state = tm.activeState;
      expect(state.division).toBe('rookie');
      expect(state.currentRace).toBe(0);
      expect(state.points).toBe(0);
      expect(state.history).toEqual([]);
      expect(state.active).toBe(false);
    });
  });

  describe('Points Calculation', () => {
    it('awards correct points for each position', () => {
      tm.startNew(); // Ensures active state
      const testCases = [
        { position: 1, expected: 10 },
        { position: 2, expected: 8 },
        { position: 3, expected: 6 },
        { position: 4, expected: 4 },
        { position: 5, expected: 2 },
        { position: 6, expected: 1 },
        { position: 7, expected: 1 }, // Clamped to 6
        { position: 10, expected: 1 }, // Clamped to 6
        { position: 0, expected: 10 }, // Clamped to 1
        { position: -5, expected: 10 }, // Clamped to 1
      ];

      for (const { position, expected } of testCases) {
        const result = tm.recordFinish(position);
        expect(result.pointsAwarded).toBe(expected);
        // Reset for next test to avoid points accumulation affecting isolation
        tm.startNew();
      }
    });

    it('accumulates points across races (but resets after division completion)', () => {
      tm.startNew();
      tm.recordFinish(1); // 10 points
      tm.recordFinish(3); // 6 points
      const result = tm.recordFinish(2); // 8 points
      expect(result.pointsAwarded).toBe(8);
      // After third race, points reset due to division completion (promotion or reset)
      expect(tm.activeState.points).toBe(0);
    });
  });

  describe('Rewards Calculation', () => {
    it('scales coins and XP by division', () => {
      // Test Rookie division
      tm.startNew(); // Rookie
      const rookieRes = tm.recordFinish(1);
      expect(rookieRes.coinsAwarded).toBe((10 - 1) * 50 * 1); // 450
      expect(rookieRes.xpAwarded).toBe((10 - 1) * 100 * 1); // 900

      // Test Pro division: advance to pro by winning rookie division
      tm.startNew();
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1); // Win rookie division
      // Now in Pro division
      const proRes = tm.recordFinish(1);
      expect(proRes.coinsAwarded).toBe((10 - 1) * 50 * 2); // 900
      expect(proRes.xpAwarded).toBe((10 - 1) * 100 * 2); // 1800
    });

    it('scales rewards by position (worse position = less reward)', () => {
      tm.startNew(); // Rookie
      const firstRes = tm.recordFinish(1);
      const lastRes = tm.recordFinish(6);
      expect(firstRes.coinsAwarded).toBeGreaterThan(lastRes.coinsAwarded);
      expect(firstRes.xpAwarded).toBeGreaterThan(lastRes.xpAwarded);
    });
  });

  describe('Race Progression', () => {
    it('increments currentRace after each finish (until race 2)', () => {
      tm.startNew();
      expect(tm.activeState.currentRace).toBe(0);

      tm.recordFinish(3);
      expect(tm.activeState.currentRace).toBe(1);

      tm.recordFinish(2);
      expect(tm.activeState.currentRace).toBe(2);

      // After third race, currentRace resets to 0 (whether promoted or not)
      tm.recordFinish(1);
      expect(tm.activeState.currentRace).toBe(0);
    });

    it('sets finishedChampionship after third race', () => {
      tm.startNew();
      const res1 = tm.recordFinish(3);
      expect(res1.finishedChampionship).toBe(false);

      const res2 = tm.recordFinish(2);
      expect(res2.finishedChampionship).toBe(false);

      const res3 = tm.recordFinish(1);
      expect(res3.finishedChampionship).toBe(true);
    });
  });

  describe('Promotion Rules', () => {
    it('promotes when average finish <= 3 after 3 races', () => {
      tm.startNew();
      // First two races: positions 2 and 2
      tm.recordFinish(2);
      tm.recordFinish(2);
      // Third race: position 2 -> average = (2+2+2)/3 = 2.0 <= 3 -> should promote
      const result = tm.recordFinish(2);
      expect(result.promoted).toBe(true);
      expect(result.finishedChampionship).toBe(true);
      expect(tm.activeState.division).toBe('pro');
      expect(result.averageFinish).toBeCloseTo(2.0);
    });

    it('does not promote when average finish > 3 after 3 races', () => {
      tm.startNew();
      // First two races: positions 4 and 4
      tm.recordFinish(4);
      tm.recordFinish(4);
      // Third race: position 4 -> average = (4+4+4)/3 = 4.0 > 3 -> should not promote
      const result = tm.recordFinish(4);
      expect(result.promoted).toBe(false);
      expect(result.finishedChampionship).toBe(true);
      expect(tm.activeState.division).toBe('rookie'); // Still rookie
      expect(result.averageFinish).toBeCloseTo(4.0);
      // Should reset division progress
      expect(tm.activeState.currentRace).toBe(0);
      expect(tm.activeState.points).toBe(0);
      expect(tm.activeState.history).toEqual([]);
    });

    it('promotes at exactly average finish = 3.0', () => {
      tm.startNew();
      // Positions: 2, 3, 4 -> average = (2+3+4)/3 = 3.0
      tm.recordFinish(2);
      tm.recordFinish(3);
      const result = tm.recordFinish(4);
      expect(result.promoted).toBe(true);
      expect(result.averageFinish).toBeCloseTo(3.0);
    });

    it('does not promote when average finish = 3.1', () => {
      tm.startNew();
      // Positions: 3, 3, 4 -> average = (3+3+4)/3 = 3.333... > 3
      tm.recordFinish(3);
      tm.recordFinish(3);
      const result = tm.recordFinish(4);
      expect(result.promoted).toBe(false);
      expect(result.averageFinish).toBeCloseTo(3.333, 2);
    });

    it('champion division stays champion when promoted', () => {
      // Get to champion division by winning races
      tm.startNew(); // rookie
      // Win 3 races to promote to pro
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      // Win 3 races to promote to elite
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      // Win 2 races in elite (need 3 total to promote)
      tm.recordFinish(1);
      tm.recordFinish(1);
      // Now in elite division, have completed 2 races, next race will complete division
      const result = tm.recordFinish(1);
      expect(result.promoted).toBe(true);
      expect(tm.activeState.division).toBe('champion'); // Still champion (or just promoted to champion)
    });
  });

  describe('Division Progression', () => {
    it('progresses Rookie -> Pro -> Elite -> Champion', () => {
      // Start Rookie, win 3 races with average 1.0
      tm.startNew();
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      expect(tm.activeState.division).toBe('pro');

      // Win 3 more races
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      expect(tm.activeState.division).toBe('elite');

      // Win 3 more races
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      expect(tm.activeState.division).toBe('champion');
    });

    it('Champion does not overflow', () => {
      // Get to champion division and complete some races
      tm.startNew(); // rookie
      // Win 3 races to promote to pro
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      // Win 3 races to promote to elite
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      // Win 3 races to promote to champion
      tm.recordFinish(1);
      tm.recordFinish(1);
      tm.recordFinish(1);
      // Now in champion division, have completed 3 races (division complete)
      // Another race should keep us in champion
      tm.recordFinish(1);
      expect(tm.activeState.division).toBe('champion'); // Still champion
    });
  });

  describe('Persistence', () => {
    it('saves state to localStorage', () => {
      tm.startNew();
      tm.recordFinish(3);
      const stateBefore = tm.activeState;

      // Create new instance to simulate reload
      const tm2 = new TournamentManager();
      const stateAfter = tm2.activeState;

      expect(stateAfter.division).toBe(stateBefore.division);
      expect(stateAfter.currentRace).toBe(stateBefore.currentRace);
      expect(stateAfter.points).toBe(stateBefore.points);
      expect(stateAfter.history).toEqual(stateBefore.history);
      expect(stateAfter.active).toBe(stateBefore.active);
    });

    it('handles corrupted localStorage gracefully', () => {
      // Save corrupted data
      localStorage.setItem('vs_tournament_state', 'invalid json');

      // Should not throw, should reset to default
      const tm = new TournamentManager();
      const state = tm.activeState;
      expect(state.division).toBe('rookie');
      expect(state.currentRace).toBe(0);
      expect(state.points).toBe(0);
      expect(state.history).toEqual([]);
      expect(state.active).toBe(false);
    });

    it('handles missing localStorage gracefully', () => {
      // Ensure no data
      localStorage.removeItem('vs_tournament_state');

      const tm = new TournamentManager();
      const state = tm.activeState;
      expect(state.division).toBe('rookie');
      expect(state.active).toBe(false);
    });

    it('fails closed on unknown future versions', () => {
      localStorage.setItem(
        'vs_tournament_state',
        JSON.stringify({
          version: 99,
          division: 'champion',
          currentRace: 1,
          points: 99,
          history: [1],
          active: true,
        })
      );
      const tm = new TournamentManager();
      const state = tm.activeState;
      expect(state.division).toBe('rookie');
      expect(state.active).toBe(false);
    });

    it('fails closed on malformed shapes', () => {
      localStorage.setItem(
        'vs_tournament_state',
        JSON.stringify({
          version: 1,
          division: 'god',
          currentRace: 1,
          points: 99,
          history: [1],
          active: true,
        })
      );
      const tm = new TournamentManager();
      expect(tm.activeState.division).toBe('rookie');

      localStorage.setItem(
        'vs_tournament_state',
        JSON.stringify({
          version: 1,
          division: 'pro',
          currentRace: 9,
          points: 99,
          history: [1],
          active: true,
        })
      );
      const tm2 = new TournamentManager();
      expect(tm2.activeState.division).toBe('rookie');

      localStorage.setItem(
        'vs_tournament_state',
        JSON.stringify({
          version: 1,
          division: 'pro',
          currentRace: 1,
          points: -5,
          history: [1],
          active: true,
        })
      );
      const tm3 = new TournamentManager();
      expect(tm3.activeState.division).toBe('rookie');

      localStorage.setItem(
        'vs_tournament_state',
        JSON.stringify({
          version: 1,
          division: 'pro',
          currentRace: 1,
          points: 5,
          history: [99],
          active: true,
        })
      );
      const tm4 = new TournamentManager();
      expect(tm4.activeState.division).toBe('rookie');
    });

    it('persists a versioned payload that round-trips', () => {
      tm.startNew();
      tm.recordFinish(1);
      const raw = JSON.parse(localStorage.getItem('vs_tournament_state')!);
      expect(raw.version).toBe(1);
      expect(raw.division).toBe('rookie');
      expect(raw.history).toEqual([1]);
    });
  });

  describe('Determinism', () => {
    it('produces identical results for identical inputs', () => {
      const tm1 = new TournamentManager();
      const tm2 = new TournamentManager();

      const results1 = [];
      const results2 = [];

      const positions = [3, 1, 4, 2, 5, 6];
      for (const pos of positions) {
        results1.push(tm1.recordFinish(pos));
        results2.push(tm2.recordFinish(pos));
      }

      expect(results1).toEqual(results2);
    });
  });

  describe('Edge Cases', () => {
    it('handles recordFinish when inactive (calls startNew)', () => {
      // Ensure inactive
      tm.reset();
      expect(tm.activeState.active).toBe(false);

      const result = tm.recordFinish(2);
      expect(result.pointsAwarded).toBe(8);
      expect(tm.activeState.active).toBe(true); // Should have been activated
      expect(tm.activeState.currentRace).toBe(1); // After first race
    });

    it('clamps position to valid range 1-6 for points calculation', () => {
      tm.startNew();
      // Test various out-of-bounds positions
      const resNeg1 = tm.recordFinish(-1);
      const resZero = tm.recordFinish(0);
      const resSeven = tm.recordFinish(7);
      const resTwenty = tm.recordFinish(20);

      // All should map to position 1 for points (best case)
      expect(resNeg1.pointsAwarded).toBe(10);
      expect(resZero.pointsAwarded).toBe(10);
      expect(resSeven.pointsAwarded).toBe(1);
      expect(resTwenty.pointsAwarded).toBe(1);
    });
  });
});

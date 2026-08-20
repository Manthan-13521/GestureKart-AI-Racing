import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeaderboardScreen } from './LeaderboardScreen';
import { SaveManager } from '../managers/SaveManager';
import { ReplayStore } from '../replay/store';

describe('LeaderboardScreen', () => {
  let screen: LeaderboardScreen;

  beforeEach(() => {
    // Create a real SaveManager with test data using a unique key
    const saveManager = new SaveManager('test-leaderboard-save');
    saveManager.addHighScore({ score: 50000, track: 'cyber-city', mode: 'survival' });
    saveManager.addHighScore({ score: 45000, track: 'mountain-highway', mode: 'ai-race' });
    saveManager.addHighScore({ score: 40000, track: 'space-highway', mode: 'versus' });
    saveManager.addHighScore({ score: 35000, track: 'cyber-city', mode: 'multiplayer' });

    // Mock ReplayStore bestScore
    vi.spyOn(ReplayStore.prototype, 'bestScore').mockImplementation((track: string, mode: string) => {
      if (track === 'cyber-city' && mode === 'survival') return 55000;
      if (track === 'mountain-highway' && mode === 'ai-race') return 50000;
      return null;
    });

    screen = new LeaderboardScreen();
    screen.onBack = vi.fn();
    (screen as unknown as { build(): void }).build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    screen.dispose();
    try {
      localStorage.removeItem('test-leaderboard-save');
    } catch {
      // localStorage may be unavailable in the test env
    }
  });

  it('builds without errors', () => {
    expect(screen.el).toBeDefined();
    expect(screen.el.querySelector('.screen-title')?.textContent).toBe('Leaderboards');
  });

  it('shows local notice', () => {
    const notice = screen.el.querySelector('.leaderboard-notice');
    expect(notice).toBeTruthy();
    expect(notice?.textContent).toContain('LOCAL LEADERBOARDS');
  });

  it('has three main tabs', () => {
    const tabs = screen.el.querySelectorAll('.tab-bar .tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent).toBe('Global');
    expect(tabs[1].textContent).toBe('By Track');
    expect(tabs[2].textContent).toBe('By Mode');
  });

  it('shows global leaderboard by default', () => {
    const table = screen.el.querySelector('.leaderboard-table');
    expect(table).toBeTruthy();
    const rows = table!.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows track filter when By Track tab selected', () => {
    const tabs = screen.el.querySelectorAll('.tab-bar .tab');
    (tabs[1] as HTMLElement).click(); // By Track
    const filter = screen.el.querySelector('.filter-bar select');
    expect(filter).toBeTruthy();
    expect(filter!.querySelectorAll('option').length).toBe(3);
  });

  it('shows mode filter when By Mode tab selected', () => {
    const tabs = screen.el.querySelectorAll('.tab-bar .tab');
    (tabs[2] as HTMLElement).click(); // By Mode
    const filter = screen.el.querySelector('.filter-bar select');
    expect(filter).toBeTruthy();
    expect(filter!.querySelectorAll('option').length).toBe(4);
  });

  it('filters correctly when track changed', () => {
    const tabs = screen.el.querySelectorAll('.tab-bar .tab');
    (tabs[1] as HTMLElement).click(); // By Track
    const select = screen.el.querySelector('.filter-bar select') as HTMLSelectElement;
    select.value = 'mountain-highway';
    select.dispatchEvent(new Event('change'));
    const rows = screen.el.querySelectorAll('.leaderboard-table tbody tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      // When filtering by track, column 1 shows the MODE
      expect(cells[1].textContent).toContain('AI Race');
    }
  });

  it('filters correctly when mode changed', () => {
    const tabs = screen.el.querySelectorAll('.tab-bar .tab');
    (tabs[2] as HTMLElement).click(); // By Mode
    const select = screen.el.querySelector('.filter-bar select') as HTMLSelectElement;
    select.value = 'survival';
    select.dispatchEvent(new Event('change'));
    const rows = screen.el.querySelectorAll('.leaderboard-table tbody tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      // When filtering by mode, column 1 shows the TRACK
      expect(cells[1].textContent).toContain('Cyber City');
    }
  });

  it('shows medal icons for top 3', () => {
    const rows = screen.el.querySelectorAll('.leaderboard-table tbody tr.top-three');
    expect(rows.length).toBeLessThanOrEqual(3);
    for (const row of rows) {
      const rankCell = row.querySelector('.rank-col');
      const svg = rankCell?.querySelector('svg');
      expect(svg, 'expected an SVG medal icon in rank cell').toBeTruthy();
    }
  });

  it('shows empty state when no scores', () => {
    // Create a fresh screen with empty data
    vi.restoreAllMocks();
    const emptyScreen = new LeaderboardScreen();
    emptyScreen.onBack = vi.fn();
    (emptyScreen as unknown as { build(): void }).build();
    const empty = emptyScreen.el.querySelector('.leaderboard-empty');
    expect(empty).toBeTruthy();
    emptyScreen.dispose();
  });

  it('calls onBack when back button clicked', () => {
    const backBtn = screen.el.querySelector('.screen-footer .btn') as HTMLElement | null;
    backBtn?.click();
    expect(screen.onBack).toHaveBeenCalled();
  });
});

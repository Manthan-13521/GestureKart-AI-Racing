import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProfileScreen } from './ProfileScreen';
import { profileManager } from '../managers/ProfileManager';
import { ReplayStore } from '../replay/store';

describe('ProfileScreen', () => {
  let screen: ProfileScreen;
  let mockOnBack: () => void;

  beforeEach(() => {
    mockOnBack = vi.fn();
    vi.spyOn(profileManager, 'currentState', 'get').mockReturnValue({
      version: 2,
      xp: 5000,
      coins: 25000,
      unlockedSkins: ['default', 'blue', 'green'],
      selectedSkin: 'green',
      unlockedNeons: ['red', 'blue', 'green', 'pink'],
      selectedNeon: 'pink',
      completedRaces: ['race-1', 'race-2', 'race-3'],
      lifetimeStats: { racesFinished: 42 },
      level: 5,
    });

    // Mock ReplayStore
    vi.spyOn(ReplayStore.prototype, 'bestScore').mockReturnValue(15000);

    screen = new ProfileScreen();
    screen.onBack = mockOnBack;
    (screen as unknown as { build(): void }).build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    screen.dispose();
  });

  it('builds without errors', () => {
    expect(screen.el).toBeDefined();
    expect(screen.el.querySelector('.screen-title')?.textContent).toBe('Profile');
  });

  it('shows hero section with level, title, XP bar', () => {
    const hero = screen.el.querySelector('.profile-hero');
    expect(hero).toBeTruthy();
    expect(hero?.querySelector('.profile-hero-level')?.textContent).toBe('LEVEL 5');
    expect(hero?.querySelector('.profile-hero-title')?.textContent).toBe('STREET RACER');
  });

  it('shows hero stats (coins, races, skins, neons)', () => {
    const hero = screen.el.querySelector('.profile-hero');
    const stats = hero!.querySelectorAll('.hero-stat-val');
    expect(stats.length).toBe(4);
    // Coins should be formatted
    expect(stats[0].textContent).toContain('25');
    expect(stats[1].textContent).toBe('42');
    expect(stats[2].textContent).toBe('3');
    expect(stats[3].textContent).toBe('4');
  });

  it('shows title progression with all tiers', () => {
    const titleSection = screen.el.querySelector('.title-progression');
    expect(titleSection).toBeTruthy();
    const tiers = titleSection!.querySelectorAll('.title-tier');
    expect(tiers.length).toBe(6); // Rookie through Champion
  });

  it('marks current title tier as current', () => {
    const currentTier = screen.el.querySelector('.title-tier.current');
    expect(currentTier).toBeTruthy();
    expect(currentTier?.querySelector('.tier-name')?.textContent).toBe('STREET RACER');
  });

  it('shows best records table when data exists', () => {
    const recordsSection = screen.el.querySelector('.records-table-wrap');
    expect(recordsSection).toBeTruthy();
    const rows = recordsSection!.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows recent completions', () => {
    const recentSection = screen.el.querySelector('.recent-races');
    expect(recentSection).toBeTruthy();
    const races = recentSection!.querySelectorAll('.recent-race');
    expect(races.length).toBe(3); // 3 completed races
  });

  it('calls onBack when back button clicked', () => {
    const backBtn = screen.el.querySelector('.screen-footer .btn') as HTMLElement | null;
    backBtn?.click();
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows next title hint when not max level', () => {
    const hint = screen.el.querySelector('.next-title-hint');
    expect(hint).toBeTruthy();
    expect(hint?.textContent).toContain('APEX');
  });
});

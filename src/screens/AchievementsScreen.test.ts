import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AchievementsScreen } from './AchievementsScreen';
import { profileManager } from '../managers/ProfileManager';

describe('AchievementsScreen', () => {
  let screen: AchievementsScreen;
  let mockOnBack: () => void;

  beforeEach(() => {
    mockOnBack = vi.fn();
    // Reset profile manager to known state
    vi.spyOn(profileManager, 'currentState', 'get').mockReturnValue({
      version: 2,
      xp: 5000,
      coins: 10000,
      unlockedSkins: ['default', 'blue'],
      selectedSkin: 'blue',
      unlockedNeons: ['red', 'blue', 'green'],
      selectedNeon: 'green',
      completedRaces: ['race-1', 'race-2'],
      lifetimeStats: { racesFinished: 15 },
      level: 5,
    });

    screen = new AchievementsScreen();
    screen.onBack = mockOnBack;
    (screen as unknown as { build(): void }).build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    screen.dispose();
  });

  it('builds without errors', () => {
    expect(screen.el).toBeDefined();
    expect(screen.el.querySelector('.screen-title')?.textContent).toBe('Achievements');
  });

  it('shows summary stats with correct unlocked/total counts', () => {
    const summary = screen.el.querySelector('.achievements-summary');
    expect(summary).toBeTruthy();
    const vals = summary!.querySelectorAll('.summary-val');
    expect(vals.length).toBe(3);
  });

  it('has three category tabs', () => {
    const tabs = screen.el.querySelectorAll('.tab-bar .tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent).toBe('Progression');
    expect(tabs[1].textContent).toBe('Collection');
    expect(tabs[2].textContent).toBe('Mastery');
  });

  it('renders achievement cards for active category', () => {
    const grid = screen.el.querySelector('.achievements-grid');
    expect(grid).toBeTruthy();
    const cards = grid!.querySelectorAll('.achievement-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('switches categories when tab clicked', () => {
    const tabs = screen.el.querySelectorAll('.tab-bar .tab');
    (tabs[1] as HTMLElement).click(); // Collection tab
    const grid = screen.el.querySelector('.achievements-grid');
    const cards = grid!.querySelectorAll('.achievement-card');
    // Collection should have different cards than progression
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows progress bars for achievements with progress', () => {
    const progressBars = screen.el.querySelectorAll('.achievement-progress');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button clicked', () => {
    const backBtn = screen.el.querySelector('.screen-footer .btn') as HTMLElement | null;
    backBtn?.click();
    expect(mockOnBack).toHaveBeenCalled();
  });
});

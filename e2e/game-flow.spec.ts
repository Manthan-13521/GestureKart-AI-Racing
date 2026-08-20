/**
 * End-to-End Game Flow Tests (P7.1)
 *
 * Verifies the full player journey: splash → menu → track select → mode
 * select → gameplay staging → AI race (HUD + victory ceremony), plus mobile
 * viewport sanity and console/runtime monitoring.
 *
 * The full race loop is exercised on the desktop project only; the mobile
 * project (Pixel 5 emulation) covers loading, navigation and overflow sanity.
 */
import { test, expect, type Locator, type Page } from '@playwright/test';

const IGNORED_ERROR_PATTERNS = ['WebGL', 'favicon', 'peerjs', 'mediapipe', 'unpkg'];

function isIgnoredError(text: string): boolean {
  return IGNORED_ERROR_PATTERNS.some((p) => text.toLowerCase().includes(p.toLowerCase()));
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

/**
 * Click a navigation trigger and wait for `expected` to become visible.
 *
 * The game's NavigationSystem intentionally drops `nav.go` calls that arrive
 * while a screen transition is still running (see qa.test.ts "spam" contract),
 * so a click that lands mid-enter-animation is silently swallowed. This helper
 * re-clicks like a real user tapping again, and bails once `expected` appears.
 */
async function clickUntilVisible(
  page: Page,
  trigger: Locator,
  expected: Locator,
  timeout = 20000,
  perAttempt = 4000
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    // The trigger is gone once navigation actually ran (the outgoing screen is
    // disposed) — only re-click while it still exists.
    if ((await trigger.count()) > 0) {
      try {
        await trigger.evaluate((el) => (el as HTMLElement).click());
      } catch {
        // Element removed mid-transition; retry.
      }
    }
    try {
      await expected.first().waitFor({ state: 'visible', timeout: perAttempt });
      return;
    } catch {
      // Nav dropped mid-transition (NavigationSystem ignores go() while a
      // transition runs) — settle and retry like a user tapping again.
      await page.waitForTimeout(400);
    }
  }
  throw new Error(`clickUntilVisible timed out waiting for: ${expected}`);
}

/** Load the app, let it settle, and advance the splash into the main menu. */
async function reachMenu(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-screen="menu"]')).toBeVisible({ timeout: 20000 });
}

/** Drive the menu to the gameplay staging screen for AI Race on the first track. */
async function reachGameplay(page: Page): Promise<void> {
  await reachMenu(page);

  await clickUntilVisible(
    page,
    page.locator('button.btn', { hasText: 'Race' }),
    page.locator('[data-screen="track-select"]')
  );

  await clickUntilVisible(
    page,
    page.locator('article.track-card').first(),
    page.locator('[data-screen="mode-select"]')
  );

  await clickUntilVisible(
    page,
    page.locator('article.glass-card').filter({ hasText: 'AI Race' }).first(),
    page.locator('[data-screen="gameplay"]')
  );
}

test.describe('App Loading', () => {
  test('should load without critical errors', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(errors.filter((e) => !isIgnoredError(e))).toHaveLength(0);
  });

  test('should show splash screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('.splash-logo')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.splash-logo')).toContainText('Virtual Steering');
  });
});

test.describe('Navigation', () => {
  test('should advance from splash to the main menu', async ({ page }) => {
    await reachMenu(page);
    await expect(page.locator('.menu-title')).toContainText('Virtual Steering');
  });

  test('should navigate from menu to track select', async ({ page }) => {
    await reachMenu(page);
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Race' }),
      page.locator('[data-screen="track-select"]')
    );
    await expect(page.locator('.screen-title')).toContainText('Select Track');
    await expect(page.locator('article.track-card')).toHaveCount(3);
  });

  test('should select a track and reach mode select', async ({ page }) => {
    await reachMenu(page);
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Race' }),
      page.locator('[data-screen="track-select"]')
    );
    await clickUntilVisible(
      page,
      page.locator('article.track-card').first(),
      page.locator('[data-screen="mode-select"]')
    );
    await expect(page.locator('article.glass-card')).toHaveCount(4);
    await expect(page.locator('article.glass-card').filter({ hasText: 'AI Race' })).toHaveCount(1);
  });

  test('should select AI Race and reach gameplay staging', async ({ page }) => {
    await reachMenu(page);
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Race' }),
      page.locator('[data-screen="track-select"]')
    );
    await clickUntilVisible(
      page,
      page.locator('article.track-card').first(),
      page.locator('[data-screen="mode-select"]')
    );
    await clickUntilVisible(
      page,
      page.locator('article.glass-card').filter({ hasText: 'AI Race' }).first(),
      page.locator('[data-screen="gameplay"]')
    );
    await expect(page.locator('button.btn', { hasText: 'Start Race' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('AI Race (desktop)', () => {
  test('should start the race and display the AI HUD', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'full race loop covered on desktop only');

    await reachGameplay(page);
    // Intro + countdown run (~2.6s) before the AI HUD overlay appears.
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('#ai-hud'),
      30000,
      8000
    );

    await expect(page.locator('#ai-hud-pos')).toBeAttached();
    await expect(page.locator('.ai-hud-rank-num')).toBeAttached();
    await expect(page.locator('#ai-hud-gap-ahead')).toBeAttached();
    await expect(page.locator('#ai-hud-gap-behind')).toBeAttached();
    await expect(page.locator('#ai-hud-draft')).toBeAttached();
    await expect(page.locator('#ai-hud-draft-fill')).toBeAttached();
    await expect(page.locator('#ai-hud-lap')).toBeAttached();
  });

  test('should complete the race and show the victory ceremony', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'full race loop covered on desktop only');

    await reachGameplay(page);
    // The race ends quickly (collision/finish); the ceremony replaces results.
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('.ceremony-rank-num'),
      90000,
      20000
    );

    await expect(page.locator('.results-title')).toContainText('VICTORY CEREMONY');
    await expect(page.locator('.ceremony-stat')).toHaveCount(3);
    await expect(page.locator('.ceremony-rank-suffix')).toBeAttached();
  });
});

test.describe('Mobile Viewport', () => {
  test('should render without horizontal overflow on splash and menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const splashOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(splashOverflow).toBe(false);

    await page.keyboard.press('Space');
    await expect(page.locator('[data-screen="menu"]')).toBeVisible({ timeout: 20000 });

    const menuOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(menuOverflow).toBe(false);
  });
});

test.describe('Console/Runtime Monitoring', () => {
  test('should have no critical console or page errors during navigation', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.keyboard.press('Space');
    await expect(page.locator('[data-screen="menu"]')).toBeVisible({ timeout: 20000 });
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Race' }),
      page.locator('[data-screen="track-select"]')
    );
    await clickUntilVisible(
      page,
      page.locator('article.track-card').first(),
      page.locator('[data-screen="mode-select"]')
    );

    expect(errors.filter((e) => !isIgnoredError(e))).toHaveLength(0);
  });
});

/**
 * P7.2 — Mobile UX & Input Reliability
 *
 * Touch controls must only surface while a race is active (never over the
 * menus), every pointer gesture must have a release path (pointerup,
 * pointercancel, pointerleave), and the full race loop must hold up on a
 * mobile viewport — including the victory ceremony, retry and replay.
 */
const isMobile = (project: string): boolean => project === 'mobile-chromium';

/** Start an AI race on the mobile viewport and wait for the AI HUD. */
async function reachRaceMobile(page: Page): Promise<void> {
  await reachGameplay(page);
  await clickUntilVisible(
    page,
    page.locator('button.btn', { hasText: 'Start Race' }),
    page.locator('#ai-hud'),
    30000,
    8000
  );
}

/** Drive a full mobile race through to the victory ceremony. */
async function reachCeremonyMobile(page: Page): Promise<void> {
  await reachGameplay(page);
  await clickUntilVisible(
    page,
    page.locator('button.btn', { hasText: 'Start Race' }),
    page.locator('.ceremony-rank-num'),
    90000,
    20000
  );
}

test.describe('Mobile Touch Controls (P7.2)', () => {
  test('touch controls stay hidden on menus and appear only during a race', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), 'touch gating covered on mobile viewport only');

    await reachMenu(page);
    await expect(page.locator('#touch-controls')).not.toBeVisible();

    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Race' }),
      page.locator('[data-screen="track-select"]')
    );
    await clickUntilVisible(
      page,
      page.locator('article.track-card').first(),
      page.locator('[data-screen="mode-select"]')
    );
    await clickUntilVisible(
      page,
      page.locator('article.glass-card').filter({ hasText: 'AI Race' }).first(),
      page.locator('[data-screen="gameplay"]')
    );
    await expect(page.locator('#touch-controls')).not.toBeVisible();

    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('#ai-hud'),
      30000,
      8000
    );
    await expect(page.locator('#touch-controls')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/race-active/);
    await expect(page.locator('body')).toHaveClass(/ai-race/);
  });

  test('GAS button press, release and pointercancel lifecycle works during a race', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), 'touch lifecycle covered on mobile viewport only');

    await reachRaceMobile(page);
    const gas = page.locator('#touch-accel');

    await gas.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', button: 0 });
    await expect(gas).toHaveClass(/pressed/);

    await gas.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', button: 0 });
    await expect(gas).not.toHaveClass(/pressed/);

    await gas.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', button: 0 });
    await expect(gas).toHaveClass(/pressed/);
    await gas.dispatchEvent('pointercancel', { pointerId: 7, pointerType: 'touch', button: 0 });
    await expect(gas).not.toHaveClass(/pressed/);

    // Steering buttons follow the same lifecycle.
    const left = page.locator('#touch-left');
    await left.dispatchEvent('pointerdown', { pointerId: 8, pointerType: 'touch', button: 0 });
    await expect(left).toHaveClass(/pressed/);
    await left.dispatchEvent('pointerup', { pointerId: 8, pointerType: 'touch', button: 0 });
    await expect(left).not.toHaveClass(/pressed/);
  });

  test('AUTO toggle responds to real touch taps during a race', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), 'touch toggle covered on mobile viewport only');

    await reachRaceMobile(page);
    const auto = page.locator('#touch-auto');
    await expect(auto).toHaveClass(/active/); // auto-accelerate forced ON at race start

    await page.locator('#touch-auto').tap();
    await expect(auto).not.toHaveClass(/active/);

    await page.locator('#touch-auto').tap();
    await expect(auto).toHaveClass(/active/);
  });
});

test.describe('AI HUD Opponent Readout (P7.2)', () => {
  test('renders opponent identity and intent during a race', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'opponent readout asserted on desktop');

    await reachGameplay(page);
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('#ai-hud'),
      30000,
      8000
    );

    await expect(page.locator('#ai-hud-opp')).toBeVisible();
    await expect(page.locator('#ai-hud-opp-name')).not.toBeEmpty();
    await expect(page.locator('#ai-hud-opp-intent')).toBeAttached();
  });
});

test.describe('Race Feel (P7.3)', () => {
  test('countdown overlay leads into the race HUD reveal with one-shot feedback elements', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'race presentation asserted on desktop');

    await reachGameplay(page);
    // The pipeline runs intro (~1.6s) before the countdown overlay appears.
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('#countdown-overlay'),
      30000,
      8000
    );
    await expect(page.locator('#countdown-overlay')).toBeVisible();

    // GO → race start reveals the HUD and the one-shot feedback elements.
    await expect(page.locator('#game-hud')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#race-flash')).toBeAttached();
    await expect(page.locator('#pos-change-pop')).toBeAttached();
    await expect(page.locator('#hud-position-chip')).toBeAttached();
  });

  test('draft indicator renders a valid zone state during a race', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'draft indicator asserted on desktop');

    await reachGameplay(page);
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('#ai-hud'),
      30000,
      8000
    );

    await expect(page.locator('#ai-hud')).toBeVisible();
    const zone = (await page.locator('#ai-hud').getAttribute('data-draft')) ?? '';
    expect(['none', 'entry', 'optimal', 'dirty', 'cooldown']).toContain(zone);
    await expect(page.locator('#ai-hud-draft-label')).not.toBeEmpty();

    const fillWidth = parseFloat(
      (await page.locator('#ai-hud-draft-fill').evaluate((el) => el.style.width)) || '0'
    );
    expect(fillWidth).toBeGreaterThanOrEqual(0);
    expect(fillWidth).toBeLessThanOrEqual(100);
  });

  test('standing HUD and AI HUD rank stay consistent during a race', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'rank consistency asserted on desktop');

    await reachGameplay(page);
    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('#ai-hud'),
      30000,
      8000
    );

    const hudPos = Number(await page.locator('#hud-position').textContent());
    const aiPos = Number(await page.locator('#ai-hud-pos').getAttribute('data-pos'));
    expect(Number.isInteger(hudPos) && hudPos >= 1 && hudPos <= 6).toBe(true);
    expect(aiPos).toBe(hudPos);
  });
});

test.describe('Mobile Race (P7.2)', () => {
  test('race completes on mobile with victory ceremony and no overflow', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), 'full mobile race covered on mobile viewport only');

    await reachRaceMobile(page);
    const duringRace = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(duringRace).toBe(false);

    await clickUntilVisible(
      page,
      page.locator('button.btn', { hasText: 'Start Race' }),
      page.locator('.ceremony-rank-num'),
      90000,
      20000
    );

    await expect(page.locator('.results-title')).toContainText('VICTORY CEREMONY');
    await expect(page.locator('.ceremony-stat')).toHaveCount(3);

    const atCeremony = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(atCeremony).toBe(false);

    const resultsBox = await page.locator('#game-over-overlay').boundingBox();
    const viewport = page.viewportSize();
    expect(resultsBox).not.toBeNull();
    expect(resultsBox!.x).toBeGreaterThanOrEqual(0);
    expect(resultsBox!.x + resultsBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(resultsBox!.y).toBeGreaterThanOrEqual(0);
    expect(resultsBox!.y + resultsBox!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test('retry after ceremony restarts the race on mobile', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), 'retry covered on mobile viewport only');

    await reachCeremonyMobile(page);
    await expect(page.locator('.ceremony-rank-num')).toBeVisible();

    await clickUntilVisible(page, page.locator('#results-retry'), page.locator('#ai-hud'), 90000, 20000);
    await expect(page.locator('#ai-hud')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/race-active/);
  });

  test('replay after ceremony opens the replay overlay on mobile', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), 'replay covered on mobile viewport only');

    await reachCeremonyMobile(page);

    if (!(await page.locator('#results-replay').isVisible())) {
      test.skip(true, 'no ghost recording was captured for this race');
    }

    await page.locator('#results-replay').click();
    await expect(page.locator('#replay-overlay')).toBeVisible();

    await page.locator('#replay-close').click();
    await expect(page.locator('#replay-overlay')).not.toBeVisible();
    await expect(page.locator('.ceremony-rank-num')).toBeVisible();
  });
});

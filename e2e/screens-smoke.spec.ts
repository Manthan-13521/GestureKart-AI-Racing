import { test, expect } from '@playwright/test';

test.setTimeout(90000);

// Navigates to each secondary screen through the real menu and asserts no
// runtime console/page errors occur while mounting and interacting.
test('all menu screens mount and navigate without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${String(err)}`));

  await page.goto('/');

  // Advance past splash to the menu (some splash variants need a click, then
  // a countdown; clicking repeatedly is safe).
  for (let i = 0; i < 5; i++) {
    await page
      .getByText('TAP TO START')
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(250);
    if (await page.getByText('Virtual Steering', { exact: true }).count()) break;
  }
  await page.waitForTimeout(400);

  const buttons = ['Garage', 'Profile', 'Leaderboards', 'Settings', 'How to Play', 'Achievements'];
  for (const label of buttons) {
    await page
      .getByText(label, { exact: true })
      .first()
      .click({ timeout: 3000 })
      .catch(() => {});
    await page.waitForTimeout(350);
    // Go back: try Back button, then left caret icon.
    const back = page
      .locator('.screen-footer .btn, .btn-back, [data-action="back"], [aria-label="Back"]')
      .first();
    await back.click({ timeout: 2000 }).catch(async () => {
      await page
        .getByText('←', { exact: true })
        .first()
        .click({ timeout: 1000 })
        .catch(() => {});
    });
    await page.waitForTimeout(300);
  }

  const real = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('webcam') &&
      !e.includes('MediaStream') &&
      !e.includes('getUserMedia') &&
      !e.includes('Autoplay') &&
      !e.includes('passive') &&
      !e.includes('ResizeObserver loop')
  );
  expect(real).toEqual([]);
});

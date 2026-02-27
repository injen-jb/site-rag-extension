import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, chromium } from '@playwright/test';

test('Mode 1: streams an answer in popup for a page question', async () => {
  const extensionPath = path.resolve('dist');
  expect(existsSync(extensionPath)).toBe(true);
  const manifest = JSON.parse(
    readFileSync(path.join(extensionPath, 'manifest.json'), 'utf8'),
  ) as { readonly action?: { readonly default_popup?: string } };
  const popupPath = manifest.action?.default_popup;
  expect(popupPath).toBeTruthy();

  const context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();
  await page.goto('data:text/html,<main><h1>Test Page</h1><p>Useful test context.</p></main>');

  const existingWorker = context.serviceWorkers()[0];
  const waitedWorker = await context
    .waitForEvent('serviceworker', { timeout: 5_000 })
    .catch(() => null);
  const serviceWorker = existingWorker ?? waitedWorker;
  test.skip(!serviceWorker, 'Extension service worker is unavailable in this Chromium environment.');
  if (!serviceWorker) {
    await context.close();
    return;
  }

  const extensionId = serviceWorker.url().split('/')[2];
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

  await popup.getByLabel('Ask a question').fill('What is this page about?');
  await popup.getByRole('button', { name: 'Send' }).click();

  await expect(popup.locator('.response-body')).toContainText('Mock answer');

  await context.close();
});

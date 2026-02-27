import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test('Mode 2: Site RAG flow', async () => {
  const extensionPath = path.resolve(__dirname, '../dist');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();
  await page.goto('https://example.com');

  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  const extensionId = background.url().split('/')[2];
  
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

  // Switch mode to site
  await popupPage.selectOption('select', 'site');

  await popupPage.fill('input[type="text"]', 'Tell me about the site');
  await popupPage.click('button[type="submit"]');

  // Verify the mock response appears
  await expect(popupPage.locator('main')).toContainText('Site mode');
  
  await context.close();
});
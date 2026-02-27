import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test('Mode 1: answers a question about the current page', async () => {
  const extensionPath = path.resolve(__dirname, '../dist');
  
  // Launch chromium with the extension
  const context = await chromium.launchPersistentContext('', {
    headless: false, // Extensions only work in headful mode usually
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // Since we don't have a real page up and running, we might mock this or just check the popup loads.
  const page = await context.newPage();
  await page.goto('https://example.com');

  // To test the popup, we need its extension URL, which is tricky in Playwright
  // We can look at the service worker to find the extension ID
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }

  const extensionId = background.url().split('/')[2];
  
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

  await popupPage.fill('input[type="text"]', 'What is the domain?');
  await popupPage.click('button[type="submit"]');

  // Verify the mock response appears
  await expect(popupPage.locator('main')).toContainText('Mock streaming answer');
  
  await context.close();
});
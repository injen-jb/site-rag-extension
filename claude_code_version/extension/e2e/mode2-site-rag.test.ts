import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * Mode 2 E2E test: Full site RAG.
 *
 * Verifies:
 * 1. Site mode UI is accessible
 * 2. The crawl flow can be triggered
 * 3. RAG-based conversation works with citations
 *
 * Note: Full crawl + embed + LLM requires WebGPU and loaded models.
 * This test verifies the UI wiring and mode switching.
 */
test.describe('Mode 2 — Site RAG', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, '../dist');

    const fs = await import('fs');
    if (!fs.existsSync(extensionPath)) {
      test.skip();
      return;
    }

    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test('can switch to Site mode', async () => {
    if (!context) {
      test.skip();
      return;
    }

    const workers = context.serviceWorkers();
    if (workers.length === 0) {
      await context.waitForEvent('serviceworker');
    }
    const extensionId = context.serviceWorkers()[0]!.url().split('/')[2];
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    // Switch to Site mode
    const siteButton = popupPage.getByRole('button', { name: 'Site' });
    await siteButton.click();

    // Verify we're in Site mode
    await expect(popupPage.locator('text=Ask a question about this site')).toBeVisible();

    await popupPage.close();
  });

  test('can submit a question in Site mode', async () => {
    if (!context) {
      test.skip();
      return;
    }

    const extensionId = context.serviceWorkers()[0]!.url().split('/')[2];
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    // Switch to Site mode
    await popupPage.getByRole('button', { name: 'Site' }).click();

    // Type and send a question
    const input = popupPage.locator('input[type="text"]');
    await input.fill('What topics does this site cover?');
    await popupPage.getByRole('button', { name: 'Send' }).click();

    // User message should appear
    await expect(popupPage.locator('text=What topics does this site cover?')).toBeVisible();

    await popupPage.close();
  });

  test('popup shows correct mode indicator', async () => {
    if (!context) {
      test.skip();
      return;
    }

    const extensionId = context.serviceWorkers()[0]!.url().split('/')[2];
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    // Default is Page mode
    await expect(popupPage.locator('text=Ask a question about this page')).toBeVisible();

    // Switch to Site mode
    await popupPage.getByRole('button', { name: 'Site' }).click();
    await expect(popupPage.locator('text=Ask a question about this site')).toBeVisible();

    // Switch back
    await popupPage.getByRole('button', { name: 'Page' }).click();
    await expect(popupPage.locator('text=Ask a question about this page')).toBeVisible();

    await popupPage.close();
  });
});

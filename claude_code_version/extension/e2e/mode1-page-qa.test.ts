import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * Mode 1 E2E test: Current page Q&A.
 *
 * Loads the extension in a real Chromium instance and verifies:
 * 1. The popup opens with the chat interface
 * 2. Mode toggle between Page and Site works
 * 3. Input field accepts text
 * 4. Send button triggers a response (even if placeholder)
 *
 * Note: Full LLM inference requires WebGPU and a loaded model,
 * which is not available in CI. This test verifies the UI wiring.
 */
test.describe('Mode 1 — Page Q&A', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, '../dist');

    // Only run if dist exists (requires a build)
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

  test('popup opens with chat interface', async () => {
    if (!context) {
      test.skip();
      return;
    }

    // Get the extension ID
    const backgroundPages = context.serviceWorkers();
    if (backgroundPages.length === 0) {
      // Wait for service worker
      await context.waitForEvent('serviceworker');
    }

    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);

    const extensionId = workers[0]!.url().split('/')[2];
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    // Verify the title is present
    await expect(popupPage.locator('h1')).toContainText('Converse With This Site');

    // Verify mode toggle buttons exist
    await expect(popupPage.getByRole('button', { name: 'Page' })).toBeVisible();
    await expect(popupPage.getByRole('button', { name: 'Site' })).toBeVisible();

    // Verify input field exists
    await expect(popupPage.locator('input[type="text"]')).toBeVisible();

    // Verify send button exists
    await expect(popupPage.getByRole('button', { name: 'Send' })).toBeVisible();

    await popupPage.close();
  });

  test('mode toggle switches between Page and Site', async () => {
    if (!context) {
      test.skip();
      return;
    }

    const workers = context.serviceWorkers();
    const extensionId = workers[0]!.url().split('/')[2];
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    // Default should be Page mode
    const pageButton = popupPage.getByRole('button', { name: 'Page' });
    const siteButton = popupPage.getByRole('button', { name: 'Site' });

    // Click Site mode
    await siteButton.click();

    // Verify placeholder text changes
    await expect(popupPage.locator('text=Ask a question about this site')).toBeVisible();

    // Switch back to Page mode
    await pageButton.click();
    await expect(popupPage.locator('text=Ask a question about this page')).toBeVisible();

    await popupPage.close();
  });

  test('user can type a question and click send', async () => {
    if (!context) {
      test.skip();
      return;
    }

    const workers = context.serviceWorkers();
    const extensionId = workers[0]!.url().split('/')[2];
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    const input = popupPage.locator('input[type="text"]');
    await input.fill('What is this page about?');

    const sendButton = popupPage.getByRole('button', { name: 'Send' });
    await sendButton.click();

    // The user message should appear in the chat
    await expect(popupPage.locator('text=What is this page about?')).toBeVisible();

    await popupPage.close();
  });
});

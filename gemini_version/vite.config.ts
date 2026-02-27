import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension from 'vite-plugin-web-extension';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      manifest: 'manifest.json',
      webExtConfig: {
        port: 5173
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
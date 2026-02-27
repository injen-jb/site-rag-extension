import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension from '@samrum/vite-plugin-web-extension';
import manifest from './extension/manifest.json';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(currentDir, 'extension/src'),
    },
  },
  plugins: [
    svelte(),
    webExtension({
      manifest,
      browser: 'chrome',
      watchFilePaths: [path.resolve(currentDir, 'extension/src')],
    }),
  ],
});

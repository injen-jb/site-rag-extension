import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      manifest: 'manifest.json',
      additionalInputs: [
        'src/workers/llm.worker.ts',
        'src/workers/embedder.worker.ts',
        'src/workers/crawler.worker.ts',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '$lib': path.resolve(__dirname, './src/lib'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
});

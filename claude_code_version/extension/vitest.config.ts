import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '$lib': path.resolve(__dirname, './src/lib'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/providers/**'],
      exclude: ['src/test/**', '**/*.test.ts'],
      thresholds: {
        'src/core/': {
          lines: 90,
          functions: 90,
          branches: 90,
        },
      },
    },
  },
});

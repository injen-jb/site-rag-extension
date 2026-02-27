import { describe, it, expect } from 'vitest';
import type { LLMProvider } from '@/core/interfaces/LLMProvider';

/**
 * Shared contract test suite for LLMProvider implementations.
 * Import and call this in every provider's test file.
 *
 * @param createProvider - Factory returning a fresh provider instance
 */
export function runLLMProviderContractTests(
  createProvider: () => LLMProvider
): void {
  describe('LLMProvider contract', () => {
    it('exposes a non-empty name', () => {
      const provider = createProvider();
      expect(provider.name).toBeTruthy();
      expect(typeof provider.name).toBe('string');
    });

    it('isAvailable() returns a boolean', async () => {
      const provider = createProvider();
      const result = await provider.isAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('initialize() resolves without throwing when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await expect(provider.initialize()).resolves.not.toThrow();
      }
    });

    it('generate() returns a non-empty string', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await provider.initialize();
        const result = await provider.generate('Say hello.');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      }
    });

    it('stream() calls handler at least once with token content', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await provider.initialize();
        const tokens: string[] = [];
        await provider.stream('Say hello.', (token) => tokens.push(token));
        expect(tokens.length).toBeGreaterThan(0);
      }
    });

    it('dispose() can be called without throwing', () => {
      const provider = createProvider();
      expect(() => provider.dispose()).not.toThrow();
    });
  });
}

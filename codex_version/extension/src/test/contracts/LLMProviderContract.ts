import { describe, expect, it } from 'vitest';
import type { LLMProvider } from '@/core/interfaces/LLMProvider';

/**
 * Shared contract test suite for LLMProvider implementations.
 * @param createProvider Factory returning a fresh provider instance.
 */
export function runLLMProviderContractTests(createProvider: () => LLMProvider): void {
  describe('LLMProvider contract', () => {
    it('exposes a non-empty name', () => {
      const provider = createProvider();
      expect(provider.name).toBeTruthy();
    });

    it('reports availability as a boolean', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('initialize() resolves without throwing when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (!available) {
        return;
      }
      await expect(provider.initialize()).resolves.toBeUndefined();
    });

    it('generate() returns a string when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (!available) {
        return;
      }
      await provider.initialize();
      const result = await provider.generate('Say hello.');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('stream() emits at least one token when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (!available) {
        return;
      }
      await provider.initialize();
      const tokens: string[] = [];
      await provider.stream('Say hello.', (token) => {
        tokens.push(token);
      });
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('dispose() can be called without throwing', () => {
      const provider = createProvider();
      expect(() => provider.dispose()).not.toThrow();
    });
  });
}

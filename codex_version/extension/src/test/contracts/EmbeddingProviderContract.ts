import { describe, expect, it } from 'vitest';
import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';

/**
 * Shared contract test suite for EmbeddingProvider implementations.
 * @param createProvider Factory returning a fresh provider instance.
 */
export function runEmbeddingProviderContractTests(createProvider: () => EmbeddingProvider): void {
  describe('EmbeddingProvider contract', () => {
    it('exposes non-empty name and positive dimensions', () => {
      const provider = createProvider();
      expect(provider.name).toBeTruthy();
      expect(provider.dimensions).toBeGreaterThan(0);
    });

    it('initialize() resolves when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (!available) {
        return;
      }
      await expect(provider.initialize()).resolves.toBeUndefined();
    });

    it('embed() returns vector matching dimensions when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (!available) {
        return;
      }
      await provider.initialize();
      const result = await provider.embed('hello world');
      expect(result.vector.length).toBe(provider.dimensions);
      expect(result.dimensions).toBe(provider.dimensions);
    });

    it('embedBatch() returns one result per input when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (!available) {
        return;
      }
      await provider.initialize();
      const results = await provider.embedBatch(['one', 'two']);
      expect(results).toHaveLength(2);
    });

    it('dispose() can be called safely', () => {
      const provider = createProvider();
      expect(() => provider.dispose()).not.toThrow();
    });
  });
}

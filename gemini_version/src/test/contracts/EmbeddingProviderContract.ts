import { describe, it, expect } from 'vitest';
import { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';

/**
 * Shared contract test suite for EmbeddingProvider implementations.
 */
export function runEmbeddingProviderContractTests(
  createProvider: () => EmbeddingProvider
): void {
  describe('EmbeddingProvider contract', () => {
    it('exposes a non-empty name and dimensions > 0', () => {
      const provider = createProvider();
      expect(provider.name).toBeTruthy();
      expect(provider.dimensions).toBeGreaterThan(0);
    });

    it('initialize() resolves without throwing when available', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await expect(provider.initialize()).resolves.not.toThrow();
      }
    });

    it('embed() returns a valid vector of expected dimensions', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await provider.initialize();
        const result = await provider.embed('Test sentence.');
        expect(result.dimensions).toBe(provider.dimensions);
        expect(result.vector.length).toBe(provider.dimensions);
      }
    });

    it('embedBatch() returns an array of valid vectors', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await provider.initialize();
        const texts = ['Sentence one.', 'Sentence two.'];
        const results = await provider.embedBatch(texts);
        expect(results.length).toBe(texts.length);
        for (const res of results) {
          expect(res.dimensions).toBe(provider.dimensions);
          expect(res.vector.length).toBe(provider.dimensions);
        }
      }
    });

    it('dispose() can be called without throwing', () => {
      const provider = createProvider();
      expect(() => provider.dispose()).not.toThrow();
    });
  });
}
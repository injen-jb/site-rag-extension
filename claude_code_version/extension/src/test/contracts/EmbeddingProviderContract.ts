import { describe, it, expect } from 'vitest';
import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';

/**
 * Shared contract test suite for EmbeddingProvider implementations.
 *
 * @param createProvider - Factory returning a fresh provider instance
 */
export function runEmbeddingProviderContractTests(
  createProvider: () => EmbeddingProvider
): void {
  describe('EmbeddingProvider contract', () => {
    it('exposes a non-empty name', () => {
      const provider = createProvider();
      expect(provider.name).toBeTruthy();
      expect(typeof provider.name).toBe('string');
    });

    it('exposes a positive dimensions value', () => {
      const provider = createProvider();
      expect(provider.dimensions).toBeGreaterThan(0);
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

    it('embed() returns a vector with correct dimensions', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await provider.initialize();
        const result = await provider.embed('test text');
        expect(result.vector).toBeInstanceOf(Float32Array);
        expect(result.vector.length).toBe(provider.dimensions);
        expect(result.dimensions).toBe(provider.dimensions);
      }
    });

    it('embedBatch() returns correct number of results', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await provider.initialize();
        const texts = ['text one', 'text two', 'text three'];
        const results = await provider.embedBatch(texts);
        expect(results.length).toBe(3);
        for (const result of results) {
          expect(result.vector).toBeInstanceOf(Float32Array);
          expect(result.vector.length).toBe(provider.dimensions);
        }
      }
    });

    it('embed() produces different vectors for different inputs', async () => {
      const provider = createProvider();
      const available = await provider.isAvailable();
      if (available) {
        await provider.initialize();
        const r1 = await provider.embed('cats are great');
        const r2 = await provider.embed('quantum physics theory');
        // Vectors should not be identical
        let allSame = true;
        for (let i = 0; i < r1.vector.length; i++) {
          if (r1.vector[i] !== r2.vector[i]) {
            allSame = false;
            break;
          }
        }
        expect(allSame).toBe(false);
      }
    });

    it('dispose() can be called without throwing', () => {
      const provider = createProvider();
      expect(() => provider.dispose()).not.toThrow();
    });
  });
}

import { describe, it, expect } from 'vitest';
import { TransformersEmbeddingProvider } from './TransformersEmbeddingProvider';
import { runEmbeddingProviderContractTests } from '@/test/contracts/EmbeddingProviderContract';

// Run contract (isAvailable will be false in Node → skips GPU-dependent tests)
runEmbeddingProviderContractTests(() =>
  new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' })
);

describe('TransformersEmbeddingProvider (unit)', () => {
  it('has a descriptive name', () => {
    const provider = new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' });
    expect(provider.name).toBe('Transformers.js Embeddings (WebGPU)');
  });

  it('reports 384 dimensions for MiniLM', () => {
    const provider = new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' });
    expect(provider.dimensions).toBe(384);
  });

  it('isAvailable() returns false when navigator.gpu is absent', async () => {
    const provider = new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' });
    const result = await provider.isAvailable();
    expect(result).toBe(false);
  });

  it('initialize() throws EmbeddingError when WebGPU is unavailable', async () => {
    const provider = new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' });
    await expect(provider.initialize()).rejects.toThrow('WebGPU is not available');
  });

  it('dispose() can be called safely before initialization', () => {
    const provider = new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' });
    expect(() => provider.dispose()).not.toThrow();
  });

  it('allows custom dimensions', () => {
    const provider = new TransformersEmbeddingProvider({
      modelId: 'some/custom-model',
      dimensions: 768,
    });
    expect(provider.dimensions).toBe(768);
  });
});

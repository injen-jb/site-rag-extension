import { describe, it, expect } from 'vitest';
import { runEmbeddingProviderContractTests } from '@/test/contracts/EmbeddingProviderContract';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';

runEmbeddingProviderContractTests(() =>
  new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' })
);

describe('TransformersEmbeddingProvider specific tests', () => {
  it('instantiates correctly', () => {
    const provider = new TransformersEmbeddingProvider({ modelId: 'test' });
    expect(provider).toBeDefined();
  });
});
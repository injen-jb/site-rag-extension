import { describe, expect, it } from 'vitest';
import type { LLMProvider } from '@/core/interfaces/LLMProvider';
import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import type { VectorStore } from '@/core/interfaces/VectorStore';
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';
import { runEmbeddingProviderContractTests } from '@/test/contracts/EmbeddingProviderContract';
import { runVectorStoreContractTests } from '@/test/contracts/VectorStoreContract';
import { MockEmbeddingProvider } from '@/test/mocks/MockEmbeddingProvider';
import { MockLLMProvider } from '@/test/mocks/MockLLMProvider';
import { MockVectorStore } from '@/test/mocks/MockVectorStore';

runLLMProviderContractTests((): LLMProvider => new MockLLMProvider());
runEmbeddingProviderContractTests((): EmbeddingProvider => new MockEmbeddingProvider());
runVectorStoreContractTests((): VectorStore => new MockVectorStore());

describe('contract suites', () => {
  it('loads all contract helpers', () => {
    expect(typeof runLLMProviderContractTests).toBe('function');
    expect(typeof runEmbeddingProviderContractTests).toBe('function');
    expect(typeof runVectorStoreContractTests).toBe('function');
  });
});

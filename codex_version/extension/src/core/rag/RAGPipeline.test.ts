import { beforeEach, describe, expect, it } from 'vitest';
import { EmbeddingError } from '@/core/errors';
import { PromptBuilder } from '@/core/rag/PromptBuilder';
import { RAGPipeline } from '@/core/rag/RAGPipeline';
import { MockEmbeddingProvider } from '@/test/mocks/MockEmbeddingProvider';
import { MockVectorStore } from '@/test/mocks/MockVectorStore';

describe('RAGPipeline', () => {
  let embeddingProvider: MockEmbeddingProvider;
  let vectorStore: MockVectorStore;
  let pipeline: RAGPipeline;

  beforeEach(async () => {
    embeddingProvider = new MockEmbeddingProvider();
    vectorStore = new MockVectorStore();
    pipeline = new RAGPipeline(embeddingProvider, vectorStore, new PromptBuilder());

    await vectorStore.upsertBatch([
      {
        id: 'best',
        text: 'best chunk',
        embedding: new Float32Array([20, 10, 6.6666665, 5]),
        url: 'https://example.com/best',
        title: 'Best',
        crawledAt: 1,
      },
      {
        id: 'worse',
        text: 'worse chunk',
        embedding: new Float32Array([2, 1, 0.66, 0.5]),
        url: 'https://example.com/worse',
        title: 'Worse',
        crawledAt: 2,
      },
    ]);
  });

  it('retrieves top-k chunks ordered by similarity score', async () => {
    const results = await pipeline.retrieve('what is best content?', { topK: 2 });

    expect(results).toHaveLength(2);
    expect(results[0]?.chunk.id).toBe('best');
    expect((results[0]?.score ?? 0) >= (results[1]?.score ?? 0)).toBe(true);
  });

  it('builds prompt containing retrieved chunk texts', async () => {
    const prompt = await pipeline.buildPrompt('what is best content?', { topK: 2 });

    expect(prompt).toContain('best chunk');
    expect(prompt).toContain('worse chunk');
    expect(prompt).toContain('what is best content?');
  });

  it('throws EmbeddingError when embedding provider fails', async () => {
    embeddingProvider.embed = async () => {
      throw new Error('boom');
    };

    await expect(pipeline.retrieve('failure expected')).rejects.toBeInstanceOf(EmbeddingError);
  });
});

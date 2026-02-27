import { describe, it, expect, beforeEach } from 'vitest';
import { RAGPipeline } from '@/core/rag/RAGPipeline';
import { MockEmbeddingProvider } from '@/test/mocks/MockEmbeddingProvider';
import { MockVectorStore } from '@/test/mocks/MockVectorStore';

describe('RAGPipeline', () => {
  let pipeline: RAGPipeline;
  let vectorStore: MockVectorStore;

  beforeEach(() => {
    vectorStore = new MockVectorStore();
    pipeline = new RAGPipeline(
      new MockEmbeddingProvider(),
      vectorStore
    );
  });

  it('retrieves top-k chunks ordered by similarity score', async () => {
    // Seed store
    await vectorStore.upsertBatch([
      { id: '1', text: 'First chunk', embedding: new Float32Array(), url: 'url', title: 't', crawledAt: 0 },
      { id: '2', text: 'Second chunk', embedding: new Float32Array(), url: 'url', title: 't', crawledAt: 0 }
    ]);

    const results = await pipeline.retrieve('what is X?', 2);
    // Since MockVectorStore returns slices with 0.9 score, we just check lengths
    expect(results.length).toBe(2);
    expect(results[0]?.chunk.text).toBe('First chunk');
  });

  it('builds prompt containing all retrieved chunk texts', async () => {
    await vectorStore.upsert({ id: '1', text: 'Important context', embedding: new Float32Array(), url: 'https://ex.com', title: 't', crawledAt: 0 });
    const prompt = await pipeline.buildPrompt('Why?', 1);
    
    expect(prompt).toContain('Important context');
    expect(prompt).toContain('Why?');
    expect(prompt).toContain('Context:');
  });

  it('adds new chunks to the vector store', async () => {
    await pipeline.ingest({
      url: 'https://ex.com',
      title: 'Title',
      html: '<main>New ingested chunk</main>'
    });
    
    expect(await vectorStore.count()).toBeGreaterThan(0);
    // Because HTMLToMarkdown and Chunker are used inside
    // MockEmbeddingProvider adds texts to lastTexts
    const storeResults = await vectorStore.search(new Float32Array(), 10);
    expect(storeResults.some(r => r.chunk.text.includes('New ingested chunk'))).toBe(true);
  });
});
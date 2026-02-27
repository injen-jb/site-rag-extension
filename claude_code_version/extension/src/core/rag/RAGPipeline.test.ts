import { describe, it, expect, beforeEach } from 'vitest';
import { RAGPipeline } from './RAGPipeline';
import { MockEmbeddingProvider } from '@/test/mocks/MockEmbeddingProvider';
import { MockVectorStore } from '@/test/mocks/MockVectorStore';
import { Chunker } from './Chunker';
import type { ChunkRecord } from '@/core/interfaces/VectorStore';

describe('RAGPipeline', () => {
  let pipeline: RAGPipeline;
  let embeddingProvider: MockEmbeddingProvider;
  let vectorStore: MockVectorStore;

  beforeEach(() => {
    embeddingProvider = new MockEmbeddingProvider({ dimensions: 3 });
    vectorStore = new MockVectorStore();
    pipeline = new RAGPipeline(embeddingProvider, vectorStore, new Chunker({ maxTokens: 10, overlapTokens: 2 }));
  });

  it('ingest() chunks and stores documents with embeddings', async () => {
    await pipeline.ingest('Hello world this is a test', 'https://example.com', 'Test Page');
    const count = await vectorStore.count();
    expect(count).toBeGreaterThan(0);
  });

  it('retrieve() returns top-k chunks ordered by similarity score', async () => {
    // Seed the store with known records
    const records: ChunkRecord[] = [
      {
        id: 'r1',
        text: 'Cats are domestic animals',
        embedding: new Float32Array([1, 0, 0]),
        url: 'https://example.com/cats',
        title: 'Cats',
        crawledAt: Date.now(),
      },
      {
        id: 'r2',
        text: 'Dogs are loyal pets',
        embedding: new Float32Array([0, 1, 0]),
        url: 'https://example.com/dogs',
        title: 'Dogs',
        crawledAt: Date.now(),
      },
      {
        id: 'r3',
        text: 'Fish swim in water',
        embedding: new Float32Array([0, 0, 1]),
        url: 'https://example.com/fish',
        title: 'Fish',
        crawledAt: Date.now(),
      },
    ];
    await vectorStore.upsertBatch(records);

    const results = await pipeline.retrieve('What about cats?', 2);
    expect(results.length).toBe(2);
    // Results should be ordered by descending score
    expect(results[0]!.score).toBeGreaterThanOrEqual(results[1]!.score);
  });

  it('retrieve() returns empty array when store is empty', async () => {
    const results = await pipeline.retrieve('anything', 5);
    expect(results).toEqual([]);
  });

  it('ingest() generates unique IDs for each chunk', async () => {
    await pipeline.ingest('word '.repeat(30).trim(), 'https://example.com', 'Test');
    const count = await vectorStore.count();
    expect(count).toBeGreaterThan(1);
  });

  it('ingest() stores correct URL and title on each chunk', async () => {
    await pipeline.ingest('Some content here', 'https://example.com/page', 'My Page');
    const results = await vectorStore.search(new Float32Array([0, 0, 0]), 10);
    for (const result of results) {
      expect(result.chunk.url).toBe('https://example.com/page');
      expect(result.chunk.title).toBe('My Page');
    }
  });

  it('clearDomain() delegates to vectorStore.deleteByDomain()', async () => {
    await pipeline.ingest('Content A', 'https://example.com/a', 'A');
    await pipeline.ingest('Content B', 'https://other.com/b', 'B');
    await pipeline.clearDomain('example.com');
    const count = await vectorStore.count();
    expect(count).toBeGreaterThan(0);
    const results = await vectorStore.search(new Float32Array([0, 0, 0]), 10);
    for (const r of results) {
      expect(new URL(r.chunk.url).hostname).not.toBe('example.com');
    }
  });
});

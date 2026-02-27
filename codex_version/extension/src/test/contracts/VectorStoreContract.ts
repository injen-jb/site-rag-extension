import { describe, expect, it } from 'vitest';
import type { ChunkRecord, VectorStore } from '@/core/interfaces/VectorStore';

/**
 * Shared contract test suite for VectorStore implementations.
 * @param createStore Factory returning a fresh vector store instance.
 */
export function runVectorStoreContractTests(createStore: () => VectorStore): void {
  describe('VectorStore contract', () => {
    it('upsert() and count() persist records', async () => {
      const store = createStore();
      await store.clear();
      await store.upsert(createChunk('a', 'https://example.com/a', [1, 0, 0]));
      expect(await store.count()).toBe(1);
    });

    it('upsertBatch() inserts multiple records', async () => {
      const store = createStore();
      await store.clear();
      await store.upsertBatch([
        createChunk('a', 'https://example.com/a', [1, 0, 0]),
        createChunk('b', 'https://example.com/b', [0, 1, 0]),
      ]);
      expect(await store.count()).toBe(2);
    });

    it('search() returns ordered results by score', async () => {
      const store = createStore();
      await store.clear();
      await store.upsertBatch([
        createChunk('a', 'https://example.com/a', [1, 0, 0]),
        createChunk('b', 'https://example.com/b', [0, 1, 0]),
      ]);
      const results = await store.search(new Float32Array([1, 0, 0]), 2);
      expect(results).toHaveLength(2);
      expect(results[0]?.chunk.id).toBe('a');
      expect(results[0]?.score ?? 0).toBeGreaterThanOrEqual(results[1]?.score ?? 0);
    });

    it('deleteByDomain() removes all records for hostname', async () => {
      const store = createStore();
      await store.clear();
      await store.upsertBatch([
        createChunk('a', 'https://example.com/a', [1, 0, 0]),
        createChunk('b', 'https://other.example/b', [0, 1, 0]),
      ]);
      await store.deleteByDomain('example.com');
      const results = await store.search(new Float32Array([1, 0, 0]), 10);
      expect(results.some((result) => new URL(result.chunk.url).hostname === 'example.com')).toBe(false);
    });

    it('clear() removes all records', async () => {
      const store = createStore();
      await store.upsert(createChunk('a', 'https://example.com/a', [1, 0, 0]));
      await store.clear();
      expect(await store.count()).toBe(0);
    });
  });
}

function createChunk(id: string, url: string, vector: number[]): ChunkRecord {
  return {
    id,
    text: `chunk ${id}`,
    embedding: new Float32Array(vector),
    url,
    title: `title ${id}`,
    crawledAt: Date.now(),
  };
}

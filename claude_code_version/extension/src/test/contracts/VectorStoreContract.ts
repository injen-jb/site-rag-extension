import { describe, it, expect, beforeEach } from 'vitest';
import type { VectorStore, ChunkRecord } from '@/core/interfaces/VectorStore';

/**
 * Shared contract test suite for VectorStore implementations.
 *
 * @param createStore - Factory returning a fresh, empty store instance
 */
export function runVectorStoreContractTests(
  createStore: () => VectorStore
): void {
  let store: VectorStore;

  /** Helper: create a ChunkRecord with a given embedding. */
  function makeChunk(id: string, embedding: number[], url = 'https://example.com/page'): ChunkRecord {
    return {
      id,
      text: `Chunk text for ${id}`,
      embedding: new Float32Array(embedding),
      url,
      title: `Title ${id}`,
      crawledAt: Date.now(),
    };
  }

  beforeEach(async () => {
    store = createStore();
    await store.clear();
  });

  describe('VectorStore contract', () => {
    it('starts empty', async () => {
      expect(await store.count()).toBe(0);
    });

    it('upsert() adds a record and count() reflects it', async () => {
      await store.upsert(makeChunk('c1', [1, 0, 0]));
      expect(await store.count()).toBe(1);
    });

    it('upsert() with same id updates rather than duplicates', async () => {
      await store.upsert(makeChunk('c1', [1, 0, 0]));
      await store.upsert(makeChunk('c1', [0, 1, 0]));
      expect(await store.count()).toBe(1);
    });

    it('upsertBatch() adds multiple records', async () => {
      await store.upsertBatch([
        makeChunk('c1', [1, 0, 0]),
        makeChunk('c2', [0, 1, 0]),
        makeChunk('c3', [0, 0, 1]),
      ]);
      expect(await store.count()).toBe(3);
    });

    it('search() returns results sorted by descending similarity', async () => {
      await store.upsertBatch([
        makeChunk('c1', [1, 0, 0]),
        makeChunk('c2', [0.9, 0.1, 0]),
        makeChunk('c3', [0, 0, 1]),
      ]);
      const query = new Float32Array([1, 0, 0]);
      const results = await store.search(query, 3);
      expect(results.length).toBe(3);
      // c1 should be most similar to [1,0,0]
      expect(results[0]!.chunk.id).toBe('c1');
      // Scores should be descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
      }
    });

    it('search() respects topK limit', async () => {
      await store.upsertBatch([
        makeChunk('c1', [1, 0, 0]),
        makeChunk('c2', [0, 1, 0]),
        makeChunk('c3', [0, 0, 1]),
      ]);
      const query = new Float32Array([1, 0, 0]);
      const results = await store.search(query, 1);
      expect(results.length).toBe(1);
    });

    it('deleteByDomain() removes records matching hostname', async () => {
      await store.upsertBatch([
        makeChunk('c1', [1, 0, 0], 'https://example.com/page1'),
        makeChunk('c2', [0, 1, 0], 'https://other.com/page1'),
      ]);
      await store.deleteByDomain('example.com');
      expect(await store.count()).toBe(1);
    });

    it('clear() removes all records', async () => {
      await store.upsertBatch([
        makeChunk('c1', [1, 0, 0]),
        makeChunk('c2', [0, 1, 0]),
      ]);
      await store.clear();
      expect(await store.count()).toBe(0);
    });
  });
}

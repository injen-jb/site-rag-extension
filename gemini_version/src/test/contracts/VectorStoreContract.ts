import { describe, it, expect, beforeEach } from 'vitest';
import { VectorStore, ChunkRecord } from '@/core/interfaces/VectorStore';

/**
 * Shared contract test suite for VectorStore implementations.
 */
export function runVectorStoreContractTests(
  createStore: () => VectorStore,
  dimensions: number = 384
): void {
  describe('VectorStore contract', () => {
    let store: VectorStore;

    beforeEach(async () => {
      store = createStore();
      await store.clear();
    });

    const createDummyChunk = (id: string, url: string, scoreVal: number): ChunkRecord => {
      const vector = new Float32Array(dimensions).fill(0);
      // Give each chunk a distinct vector direction based on scoreVal
      vector[0] = scoreVal;
      vector[1] = 1 - scoreVal;
      return {
        id,
        text: `Content for ${id}`,
        embedding: vector,
        url,
        title: `Title ${id}`,
        crawledAt: Date.now()
      };
    };

    it('upsert() adds a record and count() reflects it', async () => {
      const chunk = createDummyChunk('1', 'https://example.com/1', 0.1);
      await store.upsert(chunk);
      expect(await store.count()).toBe(1);
    });

    it('upsertBatch() adds multiple records', async () => {
      const chunks = [
        createDummyChunk('1', 'https://example.com/1', 0.1),
        createDummyChunk('2', 'https://example.com/2', 0.2)
      ];
      await store.upsertBatch(chunks);
      expect(await store.count()).toBe(2);
    });

    it('search() retrieves records', async () => {
      const chunk1 = createDummyChunk('1', 'https://example.com/1', 0.9);
      const chunk2 = createDummyChunk('2', 'https://example.com/2', 0.1);
      await store.upsertBatch([chunk1, chunk2]);

      // Query embedding matches chunk1 perfectly
      const query = new Float32Array(dimensions).fill(0);
      query[0] = 0.9;
      query[1] = 0.1;
      const results = await store.search(query, 1);
      
      expect(results.length).toBe(1);
      expect(results[0]?.chunk.id).toBe('1');
    });

    it('deleteByDomain() removes only relevant records', async () => {
      await store.upsertBatch([
        createDummyChunk('1', 'https://example.com/1', 0.1),
        createDummyChunk('2', 'https://example.com/2', 0.2),
        createDummyChunk('3', 'https://other.com/1', 0.3)
      ]);

      await store.deleteByDomain('example.com');
      expect(await store.count()).toBe(1);
      
      // The remaining chunk should be from other.com
      const allQuery = new Float32Array(dimensions).fill(0);
      const remaining = await store.search(allQuery, 10);
      expect(remaining[0]?.chunk.id).toBe('3');
    });

    it('clear() removes all records', async () => {
      await store.upsert(createDummyChunk('1', 'https://example.com/1', 0.1));
      await store.clear();
      expect(await store.count()).toBe(0);
    });
  });
}
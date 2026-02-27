import { describe, it, expect } from 'vitest';
import { IndexedDBVectorStore } from './IndexedDBVectorStore';

describe('IndexedDBVectorStore (unit)', () => {
  it('has default db name', () => {
    const store = new IndexedDBVectorStore();
    expect(store.dbName).toBe('converse-with-site');
  });

  it('accepts custom db name', () => {
    const store = new IndexedDBVectorStore({ dbName: 'test-db' });
    expect(store.dbName).toBe('test-db');
  });

  it('isAvailable() returns false when indexedDB is not present', () => {
    const store = new IndexedDBVectorStore();
    // In Node, indexedDB doesn't exist
    expect(store.isAvailable()).toBe(false);
  });
});

import { VectorStore, ChunkRecord, SearchResult } from '@/core/interfaces/VectorStore';
import { openDB, IDBPDatabase } from 'idb';

export interface IDBConfig {
  readonly dbName: string;
}

export class IndexedDBVectorStore implements VectorStore {
  private readonly dbName: string;
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor(config: IDBConfig) {
    this.dbName = config.dbName;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('chunks')) {
            const store = db.createObjectStore('chunks', { keyPath: 'id' });
            store.createIndex('hostname', 'hostname', { unique: false });
          }
        },
      });
    }
    return this.dbPromise;
  }

  public async upsert(record: ChunkRecord): Promise<void> {
    const db = await this.getDB();
    let hostname = '';
    try {
      hostname = new URL(record.url).hostname;
    } catch (e) {
      // ignore
    }

    await db.put('chunks', {
      ...record,
      hostname
    });
  }

  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('chunks', 'readwrite');
    for (const record of records) {
      let hostname = '';
      try {
        hostname = new URL(record.url).hostname;
      } catch (e) {
        // ignore
      }
      void tx.store.put({ ...record, hostname });
    }
    await tx.done;
  }

  public async search(queryEmbedding: Float32Array, topK: number = 5): Promise<SearchResult[]> {
    const db = await this.getDB();
    const allChunks = await db.getAll('chunks');
    const results: SearchResult[] = [];

    for (const item of allChunks) {
      // item includes hostname which is not in ChunkRecord but safe to pass through or strip
      const score = this.cosineSimilarity(queryEmbedding, item.embedding);
      results.push({ chunk: item as ChunkRecord, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  public async deleteByDomain(hostname: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('chunks', 'readwrite');
    const index = tx.store.index('hostname');
    
    let cursor = await index.openCursor(IDBKeyRange.only(hostname));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  public async count(): Promise<number> {
    const db = await this.getDB();
    return await db.count('chunks');
  }

  public async clear(): Promise<void> {
    const db = await this.getDB();
    await db.clear('chunks');
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
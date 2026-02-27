import type { VectorStore, ChunkRecord, SearchResult } from '@/core/interfaces/VectorStore';

/** Configuration for the IndexedDB vector store. */
export interface IndexedDBVectorStoreConfig {
  readonly dbName?: string;
}

/** Default database name. */
const DEFAULT_DB_NAME = 'converse-with-site';

/** IndexedDB object store name for chunk records. */
const STORE_NAME = 'chunks';

/**
 * Persistent vector store backed by IndexedDB.
 * Stores embeddings per domain, persists across browser sessions.
 * Uses the `idb` library for a Promise-based API.
 */
export class IndexedDBVectorStore implements VectorStore {
  public readonly dbName: string;
  private db: unknown = null;

  constructor(config?: IndexedDBVectorStoreConfig) {
    this.dbName = config?.dbName ?? DEFAULT_DB_NAME;
  }

  /** Check if IndexedDB is available. */
  public isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /** Open the database connection. */
  private async getDb(): Promise<import('idb').IDBPDatabase> {
    if (this.db) {
      return this.db as import('idb').IDBPDatabase;
    }

    const { openDB } = await import('idb');
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false });
        }
      },
    });

    return this.db as import('idb').IDBPDatabase;
  }

  /** Insert or update a single record. */
  public async upsert(record: ChunkRecord): Promise<void> {
    const db = await this.getDb();
    const serialized = this.serialize(record);
    await db.put(STORE_NAME, serialized);
  }

  /** Insert or update a batch of records. */
  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const record of records) {
      await tx.store.put(this.serialize(record));
    }
    await tx.done;
  }

  /** Find the top-k most similar chunks via cosine similarity. */
  public async search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]> {
    const db = await this.getDb();
    const allRecords = await db.getAll(STORE_NAME);
    const results: SearchResult[] = [];

    for (const raw of allRecords) {
      const chunk = this.deserialize(raw);
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({ chunk, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /** Delete all records matching the given hostname. */
  public async deleteByDomain(hostname: string): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    let cursor = await tx.store.openCursor();

    while (cursor) {
      try {
        const url = new URL(cursor.value.url as string);
        if (url.hostname === hostname) {
          await cursor.delete();
        }
      } catch {
        /* skip invalid URLs */
      }
      cursor = await cursor.continue();
    }

    await tx.done;
  }

  /** Return the total number of stored records. */
  public async count(): Promise<number> {
    const db = await this.getDb();
    return db.count(STORE_NAME);
  }

  /** Remove all records. */
  public async clear(): Promise<void> {
    const db = await this.getDb();
    await db.clear(STORE_NAME);
  }

  /** Serialize a ChunkRecord for IndexedDB storage (Float32Array → Array). */
  private serialize(record: ChunkRecord): Record<string, unknown> {
    return {
      id: record.id,
      text: record.text,
      embedding: Array.from(record.embedding),
      url: record.url,
      title: record.title,
      crawledAt: record.crawledAt,
    };
  }

  /** Deserialize a stored record back to a ChunkRecord. */
  private deserialize(raw: Record<string, unknown>): ChunkRecord {
    return {
      id: raw['id'] as string,
      text: raw['text'] as string,
      embedding: new Float32Array(raw['embedding'] as number[]),
      url: raw['url'] as string,
      title: raw['title'] as string,
      crawledAt: raw['crawledAt'] as number,
    };
  }

  /** Cosine similarity between two vectors. */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}

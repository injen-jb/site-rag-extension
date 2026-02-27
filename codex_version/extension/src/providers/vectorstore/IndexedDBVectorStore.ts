import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChunkRecord, SearchResult, VectorStore } from '@/core/interfaces/VectorStore';

interface VectorStoreSchema extends DBSchema {
  chunks: {
    key: string;
    value: StoredChunkRecord;
    indexes: {
      'by-hostname': string;
    };
  };
}

interface StoredChunkRecord {
  readonly id: string;
  readonly text: string;
  readonly embedding: number[];
  readonly url: string;
  readonly title: string;
  readonly crawledAt: number;
  readonly hostname: string;
}

/** Configuration for IndexedDB vector store. */
export interface IndexedDBVectorStoreConfig {
  /** IndexedDB database name. */
  readonly dbName: string;
  /** Object store name; currently fixed to `chunks`. */
  readonly storeName?: 'chunks';
}

/**
 * Persistent vector store backed by IndexedDB.
 */
export class IndexedDBVectorStore implements VectorStore {
  private readonly config: Required<IndexedDBVectorStoreConfig>;
  private dbPromise: Promise<IDBPDatabase<VectorStoreSchema>> | null = null;
  private readonly memoryFallback = new Map<string, ChunkRecord>();

  /**
   * @param config IndexedDB configuration.
   */
  constructor(config: IndexedDBVectorStoreConfig) {
    this.config = {
      dbName: config.dbName,
      storeName: config.storeName ?? 'chunks',
    };
  }

  /** @inheritdoc */
  public async upsert(record: ChunkRecord): Promise<void> {
    if (!(await this.canUseIndexedDb())) {
      this.memoryFallback.set(record.id, record);
      return;
    }

    const database = await this.getDatabase();
    await database.put(this.config.storeName, serialize(record));
  }

  /** @inheritdoc */
  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    if (!(await this.canUseIndexedDb())) {
      for (const record of records) {
        this.memoryFallback.set(record.id, record);
      }
      return;
    }

    const database = await this.getDatabase();
    const transaction = database.transaction(this.config.storeName, 'readwrite');
    for (const record of records) {
      await transaction.store.put(serialize(record));
    }
    await transaction.done;
  }

  /** @inheritdoc */
  public async search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]> {
    const records = await this.loadRecords();
    const results: SearchResult[] = records.map((record) => ({
      chunk: record,
      score: cosineSimilarity(queryEmbedding, record.embedding),
    }));

    return results.sort((left, right) => right.score - left.score).slice(0, topK);
  }

  /** @inheritdoc */
  public async deleteByDomain(hostname: string): Promise<void> {
    if (!(await this.canUseIndexedDb())) {
      for (const [id, record] of this.memoryFallback.entries()) {
        if (new URL(record.url).hostname === hostname) {
          this.memoryFallback.delete(id);
        }
      }
      return;
    }

    const database = await this.getDatabase();
    const keys = await database.getAllKeysFromIndex(this.config.storeName, 'by-hostname', hostname);
    const transaction = database.transaction(this.config.storeName, 'readwrite');
    for (const key of keys) {
      await transaction.store.delete(key);
    }
    await transaction.done;
  }

  /** @inheritdoc */
  public async count(): Promise<number> {
    if (!(await this.canUseIndexedDb())) {
      return this.memoryFallback.size;
    }

    const database = await this.getDatabase();
    return database.count(this.config.storeName);
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    if (!(await this.canUseIndexedDb())) {
      this.memoryFallback.clear();
      return;
    }

    const database = await this.getDatabase();
    await database.clear(this.config.storeName);
  }

  private async loadRecords(): Promise<ChunkRecord[]> {
    if (!(await this.canUseIndexedDb())) {
      return Array.from(this.memoryFallback.values());
    }

    const database = await this.getDatabase();
    const stored = await database.getAll(this.config.storeName);
    return stored.map((record) => deserialize(record));
  }

  private async canUseIndexedDb(): Promise<boolean> {
    return typeof indexedDB !== 'undefined';
  }

  private async getDatabase(): Promise<IDBPDatabase<VectorStoreSchema>> {
    if (this.dbPromise === null) {
      this.dbPromise = openDB<VectorStoreSchema>(this.config.dbName, 1, {
        upgrade: (database) => {
          if (!database.objectStoreNames.contains(this.config.storeName)) {
            const store = database.createObjectStore(this.config.storeName, { keyPath: 'id' });
            store.createIndex('by-hostname', 'hostname', { unique: false });
          }
        },
      });
    }

    return this.dbPromise;
  }
}

function serialize(record: ChunkRecord): StoredChunkRecord {
  return {
    id: record.id,
    text: record.text,
    embedding: Array.from(record.embedding),
    url: record.url,
    title: record.title,
    crawledAt: record.crawledAt,
    hostname: new URL(record.url).hostname,
  };
}

function deserialize(record: StoredChunkRecord): ChunkRecord {
  return {
    id: record.id,
    text: record.text,
    embedding: new Float32Array(record.embedding),
    url: record.url,
    title: record.title,
    crawledAt: record.crawledAt,
  };
}

function cosineSimilarity(left: Float32Array, right: Float32Array): number {
  if (left.length !== right.length) {
    return -1;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];

    if (leftValue === undefined || rightValue === undefined) {
      return -1;
    }

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

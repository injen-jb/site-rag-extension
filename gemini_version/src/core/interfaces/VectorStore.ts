export interface ChunkRecord {
  readonly id: string;
  readonly text: string;
  readonly embedding: Float32Array;
  readonly url: string;
  readonly title: string;
  readonly crawledAt: number;
}

export interface SearchResult {
  readonly chunk: ChunkRecord;
  readonly score: number;
}

export interface VectorStore {
  upsert(record: ChunkRecord): Promise<void>;
  upsertBatch(records: ChunkRecord[]): Promise<void>;
  search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]>;
  deleteByDomain(hostname: string): Promise<void>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
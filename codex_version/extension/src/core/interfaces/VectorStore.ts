/** One chunk record persisted in a vector store. */
export interface ChunkRecord {
  /** Stable unique id for this chunk. */
  readonly id: string;
  /** Raw chunk text stored for retrieval. */
  readonly text: string;
  /** Embedding for similarity search. */
  readonly embedding: Float32Array;
  /** Source URL from which this chunk was extracted. */
  readonly url: string;
  /** Source page title. */
  readonly title: string;
  /** Unix timestamp when the page was crawled. */
  readonly crawledAt: number;
}

/** Result returned from similarity search. */
export interface SearchResult {
  /** Chunk that matched the query. */
  readonly chunk: ChunkRecord;
  /** Similarity score where higher is better. */
  readonly score: number;
}

/** Contract for storing and searching embedding vectors. */
export interface VectorStore {
  /** Insert or replace a single record by id. */
  upsert(record: ChunkRecord): Promise<void>;
  /** Insert or replace multiple records. */
  upsertBatch(records: ChunkRecord[]): Promise<void>;
  /** Return top K most similar records for the query vector. */
  search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]>;
  /** Delete all records belonging to the provided domain hostname. */
  deleteByDomain(hostname: string): Promise<void>;
  /** Return total number of stored records. */
  count(): Promise<number>;
  /** Remove all records from the store. */
  clear(): Promise<void>;
}

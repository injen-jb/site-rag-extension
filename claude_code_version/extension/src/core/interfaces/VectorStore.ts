/** A stored chunk with its embedding and metadata. */
export interface ChunkRecord {
  readonly id: string;
  readonly text: string;
  readonly embedding: Float32Array;
  readonly url: string;
  readonly title: string;
  readonly crawledAt: number;
}

/** A search result with similarity score. */
export interface SearchResult {
  readonly chunk: ChunkRecord;
  readonly score: number;
}

/** Contract for vector storage backends. */
export interface VectorStore {
  /** Insert or update a single record. */
  upsert(record: ChunkRecord): Promise<void>;

  /** Insert or update a batch of records. */
  upsertBatch(records: ChunkRecord[]): Promise<void>;

  /** Find the top-k most similar chunks to the query embedding. */
  search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]>;

  /** Delete all records for a given hostname. */
  deleteByDomain(hostname: string): Promise<void>;

  /** Return the total number of stored records. */
  count(): Promise<number>;

  /** Remove all records from the store. */
  clear(): Promise<void>;
}

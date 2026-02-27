/** Embedding result value object. */
export interface EmbeddingResult {
  /** Generated vector values. */
  readonly vector: Float32Array;
  /** Number of vector dimensions. */
  readonly dimensions: number;
}

/** Contract for an embedding model provider. */
export interface EmbeddingProvider {
  /** Human-readable provider name. */
  readonly name: string;
  /** Vector dimensionality returned by this provider. */
  readonly dimensions: number;

  /** Load model and related resources into memory. */
  initialize(): Promise<void>;
  /** Returns true when embeddings can be generated in this environment. */
  isAvailable(): Promise<boolean>;
  /** Create one embedding vector for a single text input. */
  embed(text: string): Promise<EmbeddingResult>;
  /** Create embeddings for multiple texts in one request. */
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  /** Release model and associated resources. */
  dispose(): void;
}

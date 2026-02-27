/** Result of embedding a single text input. */
export interface EmbeddingResult {
  readonly vector: Float32Array;
  readonly dimensions: number;
}

/** Contract for all embedding backends. */
export interface EmbeddingProvider {
  /** Human-readable provider name. */
  readonly name: string;

  /** Number of dimensions in the output embedding vector. */
  readonly dimensions: number;

  /** Load the embedding model into memory. */
  initialize(): Promise<void>;

  /** Returns true if this provider can run in the current environment. */
  isAvailable(): Promise<boolean>;

  /** Embed a single text string. */
  embed(text: string): Promise<EmbeddingResult>;

  /** Embed a batch of text strings. */
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;

  /** Release resources. */
  dispose(): void;
}

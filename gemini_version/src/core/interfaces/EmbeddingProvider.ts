export interface EmbeddingResult {
  readonly vector: Float32Array;
  readonly dimensions: number;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  dispose(): void;
}
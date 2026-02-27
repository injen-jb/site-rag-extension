import type { EmbeddingProvider, EmbeddingResult } from '@/core/interfaces/EmbeddingProvider';

/** Deterministic mock EmbeddingProvider for unit testing. */
export class MockEmbeddingProvider implements EmbeddingProvider {
  public readonly name = 'Mock Embedder';
  public readonly dimensions: number;
  public initializeCalled = false;
  public lastText: string | null = null;
  private available = true;

  constructor(options?: { readonly dimensions?: number; readonly available?: boolean }) {
    this.dimensions = options?.dimensions ?? 384;
    if (options?.available !== undefined) {
      this.available = options.available;
    }
  }

  public async isAvailable(): Promise<boolean> {
    return this.available;
  }

  public async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  /** Returns a deterministic embedding based on text hash. */
  public async embed(text: string): Promise<EmbeddingResult> {
    this.lastText = text;
    const vector = this.createDeterministicVector(text);
    return { vector, dimensions: this.dimensions };
  }

  public async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  public dispose(): void {
    /* no-op */
  }

  /** Creates a deterministic vector from text using a simple hash. */
  private createDeterministicVector(text: string): Float32Array {
    const vector = new Float32Array(this.dimensions);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    for (let i = 0; i < this.dimensions; i++) {
      hash = ((hash << 5) - hash + i) | 0;
      vector[i] = (hash % 1000) / 1000;
    }
    // Normalize
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vector[i]! * vector[i]!;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = vector[i]! / norm;
      }
    }
    return vector;
  }
}

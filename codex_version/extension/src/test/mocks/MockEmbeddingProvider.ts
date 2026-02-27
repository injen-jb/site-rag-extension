import type { EmbeddingProvider, EmbeddingResult } from '@/core/interfaces/EmbeddingProvider';

/** Deterministic mock embedding provider used in tests. */
export class MockEmbeddingProvider implements EmbeddingProvider {
  /** Provider display name. */
  public readonly name = 'Mock Embedding';
  /** Fixed embedding dimensions for deterministic tests. */
  public readonly dimensions = 4;

  /** @inheritdoc */
  public async initialize(): Promise<void> {
    return;
  }

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    return true;
  }

  /** @inheritdoc */
  public async embed(text: string): Promise<EmbeddingResult> {
    const length = text.length;
    const vector = new Float32Array([length, length / 2, length / 3, length / 4]);
    return {
      vector,
      dimensions: this.dimensions,
    };
  }

  /** @inheritdoc */
  public async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  /** @inheritdoc */
  public dispose(): void {
    return;
  }
}

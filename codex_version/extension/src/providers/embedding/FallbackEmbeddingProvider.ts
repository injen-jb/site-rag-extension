import type { EmbeddingProvider, EmbeddingResult } from '@/core/interfaces/EmbeddingProvider';

/**
 * Lightweight deterministic embedding provider used as runtime fallback.
 */
export class FallbackEmbeddingProvider implements EmbeddingProvider {
  /** @inheritdoc */
  public readonly name = 'Fallback Embeddings';
  /** @inheritdoc */
  public readonly dimensions = 8;

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
    const normalized = text.trim();
    const vector = new Float32Array(this.dimensions);

    for (let index = 0; index < normalized.length; index += 1) {
      const value = normalized.charCodeAt(index);
      const bucket = index % this.dimensions;
      const current = vector[bucket];
      if (current === undefined) {
        continue;
      }

      vector[bucket] = current + value;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (magnitude > 0) {
      for (let index = 0; index < vector.length; index += 1) {
        const value = vector[index];
        if (value === undefined) {
          continue;
        }
        vector[index] = value / magnitude;
      }
    }

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

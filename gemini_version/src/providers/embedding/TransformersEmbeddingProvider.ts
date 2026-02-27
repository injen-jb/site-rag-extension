import { EmbeddingProvider, EmbeddingResult } from '@/core/interfaces/EmbeddingProvider';
import { ModelLoadError, EmbeddingError } from '@/core/errors';

export interface EmbeddingConfig {
  readonly modelId: string;
}

export class TransformersEmbeddingProvider implements EmbeddingProvider {
  public readonly name = 'Transformers.js Embeddings';
  public readonly dimensions = 384; // MiniLM-L6-v2 dimensions
  private pipeline: any = null;
  private readonly config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  public async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  public async initialize(): Promise<void> {
    if (this.pipeline) return;

    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.pipeline = await pipeline('feature-extraction', this.config.modelId, {
        device: 'webgpu',
        dtype: 'q8',
      });
    } catch (err: unknown) {
      throw new ModelLoadError(`Failed to load embedding model: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async embed(text: string): Promise<EmbeddingResult> {
    if (!this.pipeline) {
      throw new EmbeddingError('Provider is not initialized.');
    }

    try {
      const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
      return {
        vector: Array.from(output.data) as unknown as Float32Array,
        dimensions: this.dimensions
      };
    } catch (err: unknown) {
      throw new EmbeddingError(`Embedding failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.pipeline) {
      throw new EmbeddingError('Provider is not initialized.');
    }

    if (texts.length === 0) return [];

    try {
      // Some versions of transformers.js support batching directly for feature-extraction
      const output = await this.pipeline(texts, { pooling: 'mean', normalize: true });
      
      const results: EmbeddingResult[] = [];
      // output.data is a flat array if batched, shape is [batch_size, seq_len, hidden_size] or similar
      // Actually with mean pooling and normalize, shape should be [batch_size, hidden_size]
      
      const totalElements = output.data.length;
      const dims = this.dimensions;
      const numItems = totalElements / dims;

      for (let i = 0; i < numItems; i++) {
        const start = i * dims;
        const end = start + dims;
        const slice = output.data.slice(start, end);
        results.push({
          vector: new Float32Array(slice),
          dimensions: dims
        });
      }

      return results;
    } catch (err: unknown) {
      throw new EmbeddingError(`Batch embedding failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public dispose(): void {
    if (this.pipeline && typeof this.pipeline.dispose === 'function') {
      try {
        this.pipeline.dispose();
      } catch (e) {
        // ignore
      }
    }
    this.pipeline = null;
  }
}
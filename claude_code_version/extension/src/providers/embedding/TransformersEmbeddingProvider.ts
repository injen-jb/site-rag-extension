import type { EmbeddingProvider, EmbeddingResult } from '@/core/interfaces/EmbeddingProvider';
import { EmbeddingError } from '@/core/errors';

/** Configuration for the Transformers.js embedding provider. */
export interface TransformersEmbeddingConfig {
  readonly modelId: string;
  readonly dimensions?: number;
  readonly dtype?: 'fp32' | 'fp16' | 'q8';
}

/** Default embedding dimensions for all-MiniLM-L6-v2. */
const DEFAULT_DIMENSIONS = 384;

/**
 * Embedding provider using Hugging Face Transformers.js with WebGPU acceleration.
 * Default model: Xenova/all-MiniLM-L6-v2 (~23MB quantized).
 */
export class TransformersEmbeddingProvider implements EmbeddingProvider {
  public readonly name = 'Transformers.js Embeddings (WebGPU)';
  public readonly dimensions: number;
  private pipeline: unknown = null;
  private readonly config: TransformersEmbeddingConfig;

  constructor(config: TransformersEmbeddingConfig) {
    this.config = config;
    this.dimensions = config.dimensions ?? DEFAULT_DIMENSIONS;
  }

  /** Returns true if WebGPU is available in the current environment. */
  public async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * Load the embedding model into GPU memory.
   * @throws {EmbeddingError} if WebGPU is unavailable or model fails to load.
   */
  public async initialize(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new EmbeddingError('WebGPU is not available in this browser.');
    }

    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.pipeline = await pipeline('feature-extraction', this.config.modelId, {
        device: 'webgpu',
        dtype: this.config.dtype ?? 'q8',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new EmbeddingError(`Failed to load embedding model: ${message}`);
    }
  }

  /** Embed a single text input. */
  public async embed(text: string): Promise<EmbeddingResult> {
    this.assertInitialized();

    const pipelineFn = this.pipeline as (input: string, options: unknown) => Promise<{ data: Float32Array }>;
    const output = await pipelineFn(text, { pooling: 'mean', normalize: true });

    const vector = new Float32Array(output.data.slice(0, this.dimensions));
    return { vector, dimensions: this.dimensions };
  }

  /** Embed a batch of text inputs. */
  public async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  /** Release resources. */
  public dispose(): void {
    this.pipeline = null;
  }

  /** Throws if the model has not been initialized. */
  private assertInitialized(): void {
    if (!this.pipeline) {
      throw new EmbeddingError('Embedding model not initialized. Call initialize() first.');
    }
  }
}

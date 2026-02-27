import { EmbeddingError, ModelLoadError } from '@/core/errors';
import type { EmbeddingProvider, EmbeddingResult } from '@/core/interfaces/EmbeddingProvider';

/** Configuration for transformers.js embedding provider. */
export interface TransformersEmbeddingConfig {
  /** Hugging Face model id for feature extraction. */
  readonly modelId: string;
  /** Expected vector dimensions. */
  readonly dimensions: number;
  /** Optional quantization mode. */
  readonly dtype?: 'fp32' | 'fp16' | 'q8' | 'q4';
}

type EmbeddingPipelineOutput = number[] | number[][];
type EmbeddingPipeline = (input: string | string[]) => Promise<EmbeddingPipelineOutput>;

type EmbeddingPipelineFactory = (
  task: 'feature-extraction',
  modelId: string,
  options: { readonly device: 'webgpu'; readonly dtype?: TransformersEmbeddingConfig['dtype'] },
) => Promise<EmbeddingPipeline>;

/** Runtime dependencies that can be swapped in tests. */
export interface EmbeddingDependencies {
  /** Detects whether WebGPU is available. */
  readonly hasWebGPU?: () => boolean;
  /** Creates the transformers feature extraction pipeline. */
  readonly pipelineFactory?: EmbeddingPipelineFactory;
}

/**
 * Embedding provider backed by transformers.js feature extraction models.
 */
export class TransformersEmbeddingProvider implements EmbeddingProvider {
  /** @inheritdoc */
  public readonly name = 'Transformers Embeddings (WebGPU)';
  /** @inheritdoc */
  public readonly dimensions: number;

  private readonly config: TransformersEmbeddingConfig;
  private readonly dependencies: EmbeddingDependencies;
  private pipeline: EmbeddingPipeline | null = null;

  /**
   * @param config Embedding model configuration.
   * @param dependencies Optional runtime dependency overrides.
   */
  constructor(config: TransformersEmbeddingConfig, dependencies?: EmbeddingDependencies) {
    this.config = config;
    this.dependencies = dependencies ?? {};
    this.dimensions = config.dimensions;
  }

  /** @inheritdoc */
  public async initialize(): Promise<void> {
    if (this.pipeline !== null) {
      return;
    }

    const available = await this.isAvailable();
    if (!available) {
      throw new ModelLoadError('WebGPU is not available for embedding inference.');
    }

    const factory = this.dependencies.pipelineFactory ?? (await this.loadDefaultFactory());
    this.pipeline = await factory('feature-extraction', this.config.modelId, {
      device: 'webgpu',
      dtype: this.config.dtype,
    });
  }

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    if (this.dependencies.hasWebGPU) {
      return this.dependencies.hasWebGPU();
    }

    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /** @inheritdoc */
  public async embed(text: string): Promise<EmbeddingResult> {
    const pipeline = await this.getPipeline();
    const output = await pipeline(text);
    const vector = normalizeSingleVector(output, this.dimensions);

    return {
      vector,
      dimensions: this.dimensions,
    };
  }

  /** @inheritdoc */
  public async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const pipeline = await this.getPipeline();
    const output = await pipeline(texts);

    if (!Array.isArray(output) || output.length === 0 || !Array.isArray(output[0])) {
      throw new EmbeddingError('Embedding model returned invalid batch output.');
    }

    return output.map((vectorLike) => {
      const vector = normalizeVector(vectorLike, this.dimensions);
      return {
        vector,
        dimensions: this.dimensions,
      };
    });
  }

  /** @inheritdoc */
  public dispose(): void {
    this.pipeline = null;
  }

  private async getPipeline(): Promise<EmbeddingPipeline> {
    if (this.pipeline === null) {
      await this.initialize();
    }

    if (this.pipeline === null) {
      throw new EmbeddingError('Embedding pipeline failed to initialize.');
    }

    return this.pipeline;
  }

  private async loadDefaultFactory(): Promise<EmbeddingPipelineFactory> {
    const module = (await import('@huggingface/transformers')) as {
      readonly pipeline: EmbeddingPipelineFactory;
    };
    return module.pipeline;
  }
}

function normalizeSingleVector(output: EmbeddingPipelineOutput, dimensions: number): Float32Array {
  if (Array.isArray(output) && output.length > 0 && Array.isArray(output[0])) {
    return normalizeVector(output[0], dimensions);
  }

  if (Array.isArray(output)) {
    return normalizeVector(output, dimensions);
  }

  throw new EmbeddingError('Embedding model returned invalid single output.');
}

function normalizeVector(vectorLike: number[], dimensions: number): Float32Array {
  const padded = vectorLike.slice(0, dimensions);
  while (padded.length < dimensions) {
    padded.push(0);
  }

  return new Float32Array(padded);
}

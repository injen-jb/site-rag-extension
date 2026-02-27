import { ModelLoadError, ProviderError } from '@/core/errors';
import type { GenerateOptions, LLMProvider, StreamHandler } from '@/core/interfaces/LLMProvider';

/** Configuration for LFM2 WebGPU provider. */
export interface LFM2Config {
  /** Hugging Face model id. */
  readonly modelId: string;
  /** Numeric precision / quantization mode. */
  readonly dtype: 'fp32' | 'fp16' | 'q8' | 'q4';
}

interface PipelineCallOptions {
  readonly max_new_tokens?: number;
  readonly temperature?: number;
  readonly do_sample?: boolean;
  readonly streamer?: (token: string) => void;
}

type TextGenerationResult = Array<{ readonly generated_text?: string }>;
type TextGenerationPipeline = (prompt: string, options?: PipelineCallOptions) => Promise<TextGenerationResult>;

type PipelineFactory = (
  task: 'text-generation',
  modelId: string,
  options: { readonly device: 'webgpu'; readonly dtype: LFM2Config['dtype'] },
) => Promise<TextGenerationPipeline>;

/** Runtime dependencies that can be overridden in tests. */
export interface LFM2Dependencies {
  /** Checks whether WebGPU is available. */
  readonly hasWebGPU?: () => boolean;
  /** Creates a transformers text generation pipeline. */
  readonly pipelineFactory?: PipelineFactory;
}

/**
 * In-browser LFM2 provider backed by transformers.js and WebGPU.
 */
export class LFM2WebGPUProvider implements LLMProvider {
  /** @inheritdoc */
  public readonly name = 'LFM2 (WebGPU)';

  private readonly config: LFM2Config;
  private readonly dependencies: LFM2Dependencies;
  private pipeline: TextGenerationPipeline | null = null;

  /**
   * @param config Provider model configuration.
   * @param dependencies Optional runtime dependency overrides.
   */
  constructor(config: LFM2Config, dependencies?: LFM2Dependencies) {
    this.config = config;
    this.dependencies = dependencies ?? {};
  }

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    if (this.dependencies.hasWebGPU) {
      return this.dependencies.hasWebGPU();
    }

    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /** @inheritdoc */
  public async initialize(): Promise<void> {
    if (this.pipeline !== null) {
      return;
    }

    const available = await this.isAvailable();
    if (!available) {
      throw new ModelLoadError('WebGPU is not available in this browser environment.');
    }

    const factory = this.dependencies.pipelineFactory ?? (await this.loadDefaultPipelineFactory());
    this.pipeline = await factory('text-generation', this.config.modelId, {
      device: 'webgpu',
      dtype: this.config.dtype,
    });
  }

  /** @inheritdoc */
  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const pipeline = await this.getPipeline();
    const result = await pipeline(prompt, this.mapOptions(options));
    const generatedText = result[0]?.generated_text;
    if (!generatedText) {
      throw new ProviderError('Model returned an empty generation result.');
    }

    return generatedText;
  }

  /** @inheritdoc */
  public async stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void> {
    const pipeline = await this.getPipeline();
    const streamedTokens: string[] = [];

    const result = await pipeline(prompt, {
      ...this.mapOptions(options),
      streamer: (token: string) => {
        streamedTokens.push(token);
        handler(token);
      },
    });

    if (streamedTokens.length > 0) {
      return;
    }

    const generatedText = result[0]?.generated_text ?? '';
    if (generatedText.length === 0) {
      throw new ProviderError('Model returned an empty generation result.');
    }

    for (const word of generatedText.split(/\s+/u)) {
      if (word.length === 0) {
        continue;
      }
      handler(`${word} `);
    }
  }

  /** @inheritdoc */
  public dispose(): void {
    this.pipeline = null;
  }

  private async getPipeline(): Promise<TextGenerationPipeline> {
    if (this.pipeline === null) {
      await this.initialize();
    }

    if (this.pipeline === null) {
      throw new ProviderError('Pipeline failed to initialize.');
    }

    return this.pipeline;
  }

  private mapOptions(options?: GenerateOptions): PipelineCallOptions {
    return {
      max_new_tokens: options?.maxNewTokens ?? 512,
      temperature: options?.temperature ?? 0.3,
      do_sample: options?.doSample ?? true,
    };
  }

  private async loadDefaultPipelineFactory(): Promise<PipelineFactory> {
    const module = (await import('@huggingface/transformers')) as {
      readonly pipeline: PipelineFactory;
    };

    return module.pipeline;
  }
}

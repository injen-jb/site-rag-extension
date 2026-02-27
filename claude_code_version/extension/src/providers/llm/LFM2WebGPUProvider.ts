import type { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';
import { ModelLoadError } from '@/core/errors';

/** Configuration for the LFM2 WebGPU provider. */
export interface LFM2Config {
  readonly modelId: string;
  readonly dtype: 'fp32' | 'fp16' | 'q8' | 'q4';
}

/** Default generation options. */
const DEFAULT_OPTIONS: Required<GenerateOptions> = {
  maxNewTokens: 512,
  temperature: 0.3,
  doSample: true,
};

/**
 * In-browser LLM inference using Liquid AI's LFM2 model via WebGPU.
 * Requires `wasm-unsafe-eval` CSP and a WebGPU-capable browser.
 */
export class LFM2WebGPUProvider implements LLMProvider {
  public readonly name = 'LFM2 (WebGPU)';
  private pipeline: unknown = null;
  private readonly config: LFM2Config;

  constructor(config: LFM2Config) {
    this.config = config;
  }

  /** Returns true if WebGPU is available in the current environment. */
  public async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * Load the LFM2 model into GPU memory.
   * @throws {ModelLoadError} if WebGPU is unavailable or model fails to load.
   */
  public async initialize(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new ModelLoadError('WebGPU is not available in this browser.');
    }

    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.pipeline = await pipeline('text-generation', this.config.modelId, {
        device: 'webgpu',
        dtype: this.config.dtype,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ModelLoadError(`Failed to load LFM2 model: ${message}`);
    }
  }

  /** Generate a complete response (non-streaming). */
  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    this.assertInitialized();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const pipelineFn = this.pipeline as (
      messages: unknown,
      opts: unknown,
    ) => Promise<Array<{ generated_text: string }>>;

    const messages = [{ role: 'user', content: prompt }];
    const result = await pipelineFn(messages, {
      max_new_tokens: opts.maxNewTokens,
      do_sample: opts.doSample,
      temperature: opts.temperature,
    });

    const firstResult = result[0];
    if (!firstResult) {
      return '';
    }
    return firstResult.generated_text;
  }

  /** Stream tokens one at a time to the handler callback. */
  public async stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void> {
    this.assertInitialized();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const pipelineFn = this.pipeline as (
      messages: unknown,
      opts: unknown,
    ) => Promise<Array<{ generated_text: string }>>;

    const messages = [{ role: 'user', content: prompt }];

    const streamer = (token: string): void => {
      handler(token);
    };

    await pipelineFn(messages, {
      max_new_tokens: opts.maxNewTokens,
      do_sample: opts.doSample,
      temperature: opts.temperature,
      streamer,
    });
  }

  /** Release GPU/memory resources. */
  public dispose(): void {
    this.pipeline = null;
  }

  /** Throws if the model has not been initialized. */
  private assertInitialized(): void {
    if (!this.pipeline) {
      throw new ModelLoadError('LFM2 model not initialized. Call initialize() first.');
    }
  }
}

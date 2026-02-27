import { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';
import { ModelLoadError, ProviderError } from '@/core/errors';

export interface LFM2Config {
  readonly modelId: string;
  readonly dtype: 'fp32' | 'fp16' | 'q8' | 'q4';
}

/**
 * In-browser LLM inference using Liquid AI's LFM2 model via WebGPU.
 */
export class LFM2WebGPUProvider implements LLMProvider {
  public readonly name = 'LFM2 (WebGPU)';
  private pipeline: any = null;
  private readonly config: LFM2Config;

  constructor(config: LFM2Config) {
    this.config = config;
  }

  public async isAvailable(): Promise<boolean> {
    // navigator.gpu is only available in secure contexts with WebGPU support
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  public async initialize(): Promise<void> {
    if (this.pipeline) return;

    const available = await this.isAvailable();
    if (!available) {
      throw new ModelLoadError('WebGPU is not available in this browser environment.');
    }

    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.pipeline = await pipeline('text-generation', this.config.modelId, {
        device: 'webgpu',
        dtype: this.config.dtype,
      });
    } catch (err: unknown) {
      throw new ModelLoadError(`Failed to load LFM2 model: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    if (!this.pipeline) {
      throw new ProviderError('Provider is not initialized. Call initialize() first.');
    }

    try {
      const messages = [{ role: 'user', content: prompt }];
      // Provide fallback defaults
      const max_new_tokens = options?.maxNewTokens || 512;
      const temperature = options?.temperature || 0.3;
      const do_sample = options?.doSample ?? true;

      const result = await this.pipeline(messages, {
        max_new_tokens,
        temperature,
        do_sample,
      });

      // text-generation pipeline with chat template returns structured output
      return result[0]?.generated_text?.at(-1)?.content || result[0]?.generated_text || '';
    } catch (err: unknown) {
      throw new ProviderError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void> {
    if (!this.pipeline) {
      throw new ProviderError('Provider is not initialized. Call initialize() first.');
    }

    try {
      const messages = [{ role: 'user', content: prompt }];
      
      const max_new_tokens = options?.maxNewTokens || 512;
      const temperature = options?.temperature || 0.3;
      const do_sample = options?.doSample ?? true;

      const tokenCallback = (tokens: any[]) => {
        // tokens is typically an array of token objects or strings depending on transformers.js version
        // Let's assume transformers.js streamer callback provides string chunks
        const token = Array.isArray(tokens) ? tokens[0] : String(tokens);
        if (token) handler(token);
      };

      await this.pipeline(messages, {
        max_new_tokens,
        temperature,
        do_sample,
        streamer: tokenCallback,
      });
    } catch (err: unknown) {
      throw new ProviderError(`Streaming failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public dispose(): void {
    if (this.pipeline && typeof this.pipeline.dispose === 'function') {
      try {
        this.pipeline.dispose();
      } catch (e) {
        // ignore dispose errors
      }
    }
    this.pipeline = null;
  }
}
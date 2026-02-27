import type { GenerateOptions, LLMProvider, StreamHandler } from '@/core/interfaces/LLMProvider';

/**
 * Lightweight fallback LLM provider used when WebGPU inference is unavailable.
 */
export class FallbackLLMProvider implements LLMProvider {
  /** @inheritdoc */
  public readonly name = 'Fallback Mock LLM';

  /** @inheritdoc */
  public async initialize(): Promise<void> {
    return;
  }

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    return true;
  }

  /** @inheritdoc */
  public async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    return this.buildResponse(prompt);
  }

  /** @inheritdoc */
  public async stream(prompt: string, handler: StreamHandler, _options?: GenerateOptions): Promise<void> {
    const response = this.buildResponse(prompt);
    for (const word of response.split(/\s+/u)) {
      if (word.length === 0) {
        continue;
      }
      handler(`${word} `);
    }
  }

  /** @inheritdoc */
  public dispose(): void {
    return;
  }

  private buildResponse(prompt: string): string {
    const normalized = prompt.replace(/\s+/gu, ' ').trim();
    const preview = normalized.length > 120 ? `${normalized.slice(0, 120)}...` : normalized;
    return `Mock answer: ${preview}`;
  }
}

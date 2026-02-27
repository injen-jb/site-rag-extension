import type { GenerateOptions, LLMProvider, StreamHandler } from '@/core/interfaces/LLMProvider';

/** Deterministic mock LLM provider used in tests. */
export class MockLLMProvider implements LLMProvider {
  /** Provider display name. */
  public readonly name = 'Mock LLM';
  /** Tracks initialize invocation count. */
  public initializeCalled = false;
  /** Stores the most recent prompt passed to generate/stream. */
  public lastPrompt: string | null = null;
  /** Configurable deterministic response payload. */
  public mockResponse = 'mock response';

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    return true;
  }

  /** @inheritdoc */
  public async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  /** @inheritdoc */
  public async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    this.lastPrompt = prompt;
    return this.mockResponse;
  }

  /** @inheritdoc */
  public async stream(prompt: string, handler: StreamHandler, _options?: GenerateOptions): Promise<void> {
    this.lastPrompt = prompt;
    for (const word of this.mockResponse.split(' ')) {
      handler(`${word} `);
    }
  }

  /** @inheritdoc */
  public dispose(): void {
    return;
  }
}

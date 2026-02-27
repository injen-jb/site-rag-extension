import type { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';

/** Deterministic mock LLMProvider for unit testing. */
export class MockLLMProvider implements LLMProvider {
  public readonly name = 'Mock LLM';
  public initializeCalled = false;
  public lastPrompt: string | null = null;
  public mockResponse = 'mock response';
  private available = true;

  constructor(options?: { readonly available?: boolean; readonly mockResponse?: string }) {
    if (options?.available !== undefined) {
      this.available = options.available;
    }
    if (options?.mockResponse !== undefined) {
      this.mockResponse = options.mockResponse;
    }
  }

  public async isAvailable(): Promise<boolean> {
    return this.available;
  }

  public async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  public async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    this.lastPrompt = prompt;
    return this.mockResponse;
  }

  public async stream(prompt: string, handler: StreamHandler, _options?: GenerateOptions): Promise<void> {
    this.lastPrompt = prompt;
    for (const word of this.mockResponse.split(' ')) {
      handler(word + ' ');
    }
  }

  public dispose(): void {
    /* no-op */
  }
}

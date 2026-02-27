import { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';

/** Deterministic mock LLMProvider for unit testing. */
export class MockLLMProvider implements LLMProvider {
  public readonly name = 'Mock LLM';
  public initializeCalled = false;
  public lastPrompt: string | null = null;
  public mockResponse = 'mock response';

  public async isAvailable(): Promise<boolean> { return true; }
  public async initialize(): Promise<void> { this.initializeCalled = true; }

  public async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    this.lastPrompt = prompt;
    return this.mockResponse;
  }

  public async stream(prompt: string, handler: StreamHandler): Promise<void> {
    this.lastPrompt = prompt;
    for (const word of this.mockResponse.split(' ')) {
      handler(word + ' ');
    }
  }

  public dispose(): void {}
}
import type { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';
import { ProviderError } from '@/core/errors';

/** Configuration for the Claude API provider. */
export interface ClaudeSDKConfig {
  readonly model: string;
  readonly apiKey: string;
  readonly baseUrl?: string;
}

/** Claude API endpoint. */
const DEFAULT_BASE_URL = 'https://api.anthropic.com';

/** Default generation options. */
const DEFAULT_OPTIONS: Required<GenerateOptions> = {
  maxNewTokens: 1024,
  temperature: 0.3,
  doSample: true,
};

/** Claude API response shape. */
interface ClaudeAPIResponse {
  readonly content: ReadonlyArray<{ readonly type: string; readonly text: string }>;
}

/**
 * LLM provider that calls the Anthropic Claude API.
 * Demonstrates that the LLMProvider interface supports both local and API backends.
 */
export class ClaudeSDKProvider implements LLMProvider {
  public readonly name = 'Claude API';
  private readonly config: ClaudeSDKConfig;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private initialized = false;

  constructor(config: ClaudeSDKConfig, fetchFn?: typeof fetch) {
    this.config = config;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  /** Available if an API key is configured. */
  public async isAvailable(): Promise<boolean> {
    return this.config.apiKey.length > 0;
  }

  /** No model loading needed for API provider. */
  public async initialize(): Promise<void> {
    this.initialized = true;
  }

  /** Generate a complete response via the Claude API. */
  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const response = await this.callAPI(prompt, opts);
    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text ?? '';
  }

  /** Simulate streaming by sending the complete response in chunks. */
  public async stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void> {
    const fullText = await this.generate(prompt, options);
    // Simulate word-by-word streaming
    const words = fullText.split(' ');
    for (const word of words) {
      handler(word + ' ');
    }
  }

  /** No resources to release for API provider. */
  public dispose(): void {
    this.initialized = false;
  }

  /** Make the actual API call. */
  private async callAPI(prompt: string, opts: Required<GenerateOptions>): Promise<ClaudeAPIResponse> {
    const response = await this.fetchFn(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: opts.maxNewTokens,
        temperature: opts.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new ProviderError(
        `API request failed with status ${response.status}`,
        this.name,
      );
    }

    return response.json() as Promise<ClaudeAPIResponse>;
  }
}

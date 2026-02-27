import { ProviderError } from '@/core/errors';
import type { GenerateOptions, LLMProvider, StreamHandler } from '@/core/interfaces/LLMProvider';

/** Configuration for Claude SDK provider. */
export interface ClaudeSDKConfig {
  /** Claude model identifier. */
  readonly model: string;
  /** API key for Claude endpoint. */
  readonly apiKey: string;
  /** Optional API endpoint override. */
  readonly endpoint?: string;
}

/** Runtime dependency overrides for testing. */
export interface ClaudeDependencies {
  /** Fetch implementation override. */
  readonly fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

interface ClaudeTextBlock {
  readonly type: 'text';
  readonly text: string;
}

interface ClaudeResponsePayload {
  readonly content?: ClaudeTextBlock[];
}

/**
 * LLM provider backed by a Claude-compatible HTTP endpoint.
 */
export class ClaudeSDKProvider implements LLMProvider {
  /** @inheritdoc */
  public readonly name = 'Claude SDK';

  private readonly config: ClaudeSDKConfig;
  private readonly dependencies: ClaudeDependencies;
  private initialized = false;

  /**
   * @param config Provider configuration.
   * @param dependencies Optional runtime dependency overrides.
   */
  constructor(config: ClaudeSDKConfig, dependencies?: ClaudeDependencies) {
    this.config = config;
    this.dependencies = dependencies ?? {};
  }

  /** @inheritdoc */
  public async initialize(): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new ProviderError('Claude API key is required.');
    }

    this.initialized = true;
  }

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    return this.config.apiKey.trim().length > 0;
  }

  /** @inheritdoc */
  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    await this.ensureInitialized();

    const endpoint = this.config.endpoint ?? 'https://api.anthropic.com/v1/messages';
    const fetcher = this.dependencies.fetcher ?? fetch;

    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'x-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: options?.maxNewTokens ?? 512,
        temperature: options?.temperature ?? 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new ProviderError(`Claude request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as ClaudeResponsePayload;
    const text = payload.content?.find((block) => block.type === 'text')?.text;

    if (!text) {
      throw new ProviderError('Claude response did not contain text content.');
    }

    return text;
  }

  /** @inheritdoc */
  public async stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void> {
    const text = await this.generate(prompt, options);
    for (const word of text.split(/\s+/u)) {
      if (word.length === 0) {
        continue;
      }

      handler(`${word} `);
    }
  }

  /** @inheritdoc */
  public dispose(): void {
    this.initialized = false;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

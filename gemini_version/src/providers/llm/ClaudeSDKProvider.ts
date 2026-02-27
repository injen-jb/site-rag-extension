import { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';
import { ProviderError } from '@/core/errors';

export interface ClaudeConfig {
  readonly model: string;
  readonly apiKey: string;
}

export class ClaudeSDKProvider implements LLMProvider {
  public readonly name = 'Claude API';
  private readonly config: ClaudeConfig;

  constructor(config: ClaudeConfig) {
    this.config = config;
  }

  public async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  public async initialize(): Promise<void> {
    // No model downloading required for API
    if (!this.config.apiKey) {
      throw new ProviderError('API key is missing.');
    }
  }

  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: options?.maxNewTokens || 1024,
        temperature: options?.temperature || 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new ProviderError(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  public async stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: options?.maxNewTokens || 1024,
        temperature: options?.temperature || 0.3,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    });

    if (!response.ok) {
      throw new ProviderError(`Claude API stream error: ${response.statusText}`);
    }

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                handler(data.delta.text);
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }
    }
  }

  public dispose(): void {
    // Nothing to dispose
  }
}
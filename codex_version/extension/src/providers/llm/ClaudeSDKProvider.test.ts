import { describe, expect, it } from 'vitest';
import { ProviderError } from '@/core/errors';
import { ClaudeSDKProvider } from '@/providers/llm/ClaudeSDKProvider';
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';

function createMockProvider(): ClaudeSDKProvider {
  return new ClaudeSDKProvider(
    {
      model: 'claude-haiku-4-5',
      apiKey: 'test-key',
      endpoint: 'https://api.example.com/v1/messages',
    },
    {
      fetcher: async () =>
        new Response(JSON.stringify({ content: [{ type: 'text', text: 'hello from claude' }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    },
  );
}

runLLMProviderContractTests(() => createMockProvider());

describe('ClaudeSDKProvider', () => {
  it('passes api key in Authorization header', async () => {
    let authorizationHeader = '';

    const provider = new ClaudeSDKProvider(
      {
        model: 'claude-haiku-4-5',
        apiKey: 'abc123',
        endpoint: 'https://api.example.com/v1/messages',
      },
      {
        fetcher: async (_url, init) => {
          const headers = init?.headers as Record<string, string>;
          authorizationHeader = headers.Authorization ?? '';
          return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        },
      },
    );

    await provider.initialize();
    await provider.generate('hello');

    expect(authorizationHeader).toContain('abc123');
  });

  it('throws ProviderError on unauthorized response', async () => {
    const provider = new ClaudeSDKProvider(
      {
        model: 'claude-haiku-4-5',
        apiKey: 'bad-key',
        endpoint: 'https://api.example.com/v1/messages',
      },
      {
        fetcher: async () => new Response('Unauthorized', { status: 401 }),
      },
    );

    await provider.initialize();
    await expect(provider.generate('hello')).rejects.toBeInstanceOf(ProviderError);
  });
});

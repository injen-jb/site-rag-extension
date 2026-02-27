import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeSDKProvider } from './ClaudeSDKProvider';
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';

// Mock fetch for Claude API calls
const mockFetch = vi.fn();

// Run contract tests — provider is always "available" since it's API-based
runLLMProviderContractTests(() => {
  mockFetch.mockResolvedValue(
    new Response(
      JSON.stringify({
        content: [{ type: 'text', text: 'Hello from Claude!' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  );
  return new ClaudeSDKProvider(
    { model: 'claude-haiku-4-5-20251001', apiKey: 'test-key' },
    mockFetch
  );
});

describe('ClaudeSDKProvider (unit)', () => {
  let provider: ClaudeSDKProvider;

  beforeEach(() => {
    mockFetch.mockReset();
    provider = new ClaudeSDKProvider(
      { model: 'claude-haiku-4-5-20251001', apiKey: 'test-key' },
      mockFetch
    );
  });

  it('has a descriptive name', () => {
    expect(provider.name).toBe('Claude API');
  });

  it('isAvailable() returns true when apiKey is set', async () => {
    expect(await provider.isAvailable()).toBe(true);
  });

  it('isAvailable() returns false when apiKey is empty', async () => {
    const noKeyProvider = new ClaudeSDKProvider({ model: 'claude-haiku-4-5-20251001', apiKey: '' });
    expect(await noKeyProvider.isAvailable()).toBe(false);
  });

  it('passes apiKey in x-api-key header', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ content: [{ type: 'text', text: 'Response' }] }),
        { status: 200 }
      )
    );

    await provider.initialize();
    await provider.generate('Hello');

    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = callArgs[1].headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('test-key');
  });

  it('throws ProviderError on 401 response', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), {
        status: 401,
      })
    );

    await provider.initialize();
    await expect(provider.generate('Hello')).rejects.toThrow('API request failed');
  });

  it('sends correct model in request body', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ content: [{ type: 'text', text: 'Response' }] }),
        { status: 200 }
      )
    );

    await provider.initialize();
    await provider.generate('Hello');

    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(callArgs[1].body as string) as { model: string };
    expect(body.model).toBe('claude-haiku-4-5-20251001');
  });

  it('stream() calls handler with response text', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ content: [{ type: 'text', text: 'Streamed response text' }] }),
        { status: 200 }
      )
    );

    await provider.initialize();
    const tokens: string[] = [];
    await provider.stream('Hello', (token) => tokens.push(token));
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join('')).toContain('Streamed response text');
  });
});

import { describe, it, vi, beforeAll, afterAll, expect } from 'vitest';
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';
import { ClaudeSDKProvider } from '@/providers/llm/ClaudeSDKProvider';

beforeAll(() => {
  global.fetch = vi.fn().mockImplementation((_url: string | URL | Request, init?: RequestInit) => {
    const bodyStr = init?.body ? String(init.body) : '';
    if (bodyStr.includes('"stream":true')) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Mock Stream"}}\\n\\n'));
          controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
          controller.close();
        }
      });
      return Promise.resolve(new Response(stream));
    } else {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: 'Mock response' }] })
      });
    }
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

runLLMProviderContractTests(() =>
  new ClaudeSDKProvider({ model: 'claude-3-haiku-20240307', apiKey: 'test-key' })
);

describe('ClaudeSDKProvider specific tests', () => {
  it('instantiates correctly', () => {
    const provider = new ClaudeSDKProvider({ model: 'test', apiKey: 'test' });
    expect(provider).toBeDefined();
  });
});
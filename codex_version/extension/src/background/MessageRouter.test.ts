import { describe, expect, it } from 'vitest';
import { MessageRouter, type PortMessage, type RuntimePort } from '@/background/MessageRouter';
import { MockLLMProvider } from '@/test/mocks/MockLLMProvider';

class FakePort implements RuntimePort {
  public readonly name = 'llm-stream';
  public readonly outboundMessages: PortMessage[] = [];
  private listener: ((message: PortMessage) => void) | null = null;

  public addMessageListener(listener: (message: PortMessage) => void): void {
    this.listener = listener;
  }

  public postMessage(message: PortMessage): void {
    this.outboundMessages.push(message);
  }

  public emit(message: PortMessage): void {
    this.listener?.(message);
  }
}

describe('MessageRouter', () => {
  it('streams token messages then done for query messages', async () => {
    const provider = new MockLLMProvider();
    provider.mockResponse = 'token one token two';

    const router = new MessageRouter(provider);
    const port = new FakePort();

    router.attachPort(port);
    port.emit({ type: 'query', question: 'test?', mode: 'page', prompt: 'prompt text' });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const tokenMessages = port.outboundMessages.filter((message) => message.type === 'token');
    expect(tokenMessages.length).toBeGreaterThan(0);
    expect(port.outboundMessages.some((message) => message.type === 'done')).toBe(true);
  });

  it('sends error message when llm stream throws', async () => {
    const provider = new MockLLMProvider();
    provider.stream = async () => {
      throw new Error('stream fail');
    };

    const router = new MessageRouter(provider);
    const port = new FakePort();

    router.attachPort(port);
    port.emit({ type: 'query', question: 'test?', mode: 'page' });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const errorMessage = port.outboundMessages.find((message) => message.type === 'error');
    expect(errorMessage?.type).toBe('error');
  });
});

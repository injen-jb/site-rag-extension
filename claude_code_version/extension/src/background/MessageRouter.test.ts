import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageRouter, type MessageHandler, type TypedMessage } from './MessageRouter';

describe('MessageRouter', () => {
  let router: MessageRouter;

  beforeEach(() => {
    router = new MessageRouter();
  });

  it('registers and invokes a handler for a message type', async () => {
    const handler = vi.fn().mockResolvedValue({ result: 'ok' });
    router.on('test-type', handler);

    const response = await router.dispatch({ type: 'test-type', payload: { data: 123 } });
    expect(handler).toHaveBeenCalledOnce();
    expect(response).toEqual({ result: 'ok' });
  });

  it('throws when dispatching an unregistered message type', async () => {
    await expect(
      router.dispatch({ type: 'unknown', payload: {} })
    ).rejects.toThrow('No handler registered');
  });

  it('overwrites handler when re-registering for same type', async () => {
    const handler1 = vi.fn().mockResolvedValue('first');
    const handler2 = vi.fn().mockResolvedValue('second');
    router.on('test', handler1);
    router.on('test', handler2);

    const response = await router.dispatch({ type: 'test', payload: {} });
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
    expect(response).toBe('second');
  });

  it('off() removes a handler', async () => {
    const handler = vi.fn().mockResolvedValue('ok');
    router.on('test', handler);
    router.off('test');

    await expect(
      router.dispatch({ type: 'test', payload: {} })
    ).rejects.toThrow('No handler registered');
  });

  it('passes payload to handler', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    router.on('greet', handler);

    const msg: TypedMessage = { type: 'greet', payload: { name: 'Alice' } };
    await router.dispatch(msg);
    expect(handler).toHaveBeenCalledWith(msg);
  });

  it('has() returns true for registered types', () => {
    router.on('exists', vi.fn());
    expect(router.has('exists')).toBe(true);
    expect(router.has('nope')).toBe(false);
  });
});

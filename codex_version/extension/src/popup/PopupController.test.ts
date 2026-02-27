import { describe, expect, it } from 'vitest';
import { PopupController } from '@/popup/PopupController';

describe('PopupController', () => {
  it('starts streaming on query and appends streamed tokens', () => {
    const sentMessages: unknown[] = [];
    const controller = new PopupController({
      postMessage: (message) => {
        sentMessages.push(message);
      },
    });

    controller.setQuestion('What is this page about?');
    controller.ask();

    controller.handleIncoming({ type: 'token', token: 'Hello ' });
    controller.handleIncoming({ type: 'token', token: 'world' });
    controller.handleIncoming({ type: 'done' });

    expect(sentMessages.length).toBe(1);
    expect(controller.response).toBe('Hello world');
    expect(controller.streaming).toBe(false);
  });

  it('switches between page and site mode', () => {
    const controller = new PopupController({ postMessage: () => undefined });

    expect(controller.mode).toBe('page');
    controller.setMode('site');
    expect(controller.mode).toBe('site');
  });

  it('tracks status progress updates from background', () => {
    const controller = new PopupController({ postMessage: () => undefined });

    controller.handleIncoming({ type: 'status', label: 'Indexing', progress: 40 });

    expect(controller.statusLabel).toBe('Indexing');
    expect(controller.progress).toBe(40);
  });
});

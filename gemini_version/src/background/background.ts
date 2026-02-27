import { MessageRouter, AnyMessage } from './MessageRouter';

const router = new MessageRouter();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'llm-stream') {
    port.onMessage.addListener(async (msg: AnyMessage) => {
      try {
        router.route(msg, port);
      } catch (err) {
        port.postMessage({ type: 'error', message: String(err) });
      }
    });
  }
});
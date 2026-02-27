import { MessageRouter } from './MessageRouter';

/** Service worker entry point. Wires providers and registers message ports. */

const router = new MessageRouter();

/** Handle long-lived port connections for streaming. */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'llm-stream') {
    port.onMessage.addListener(async (msg: { type: string; question?: string; mode?: string; pageContent?: string }) => {
      if (msg.type === 'query' && msg.question) {
        try {
          // Dispatch to registered handler
          if (router.has('query')) {
            await router.dispatch({
              type: 'query',
              payload: { question: msg.question, mode: msg.mode, pageContent: msg.pageContent, port },
            });
          } else {
            // Placeholder: echo back the question when no LLM is loaded
            port.postMessage({ type: 'token', token: `[No model loaded] You asked: "${msg.question}"` });
            port.postMessage({ type: 'done' });
          }
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          port.postMessage({ type: 'error', error: errorMsg });
          port.postMessage({ type: 'done' });
        }
      }
    });
  }
});

/** Handle one-shot messages for non-streaming operations. */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'extract-content') {
    // Forward to content script via tabs API
    sendResponse({ status: 'ok' });
    return true;
  }

  if (router.has(message.type)) {
    router.dispatch(message).then(sendResponse).catch((error: unknown) => {
      const errorMsg = error instanceof Error ? error.message : String(error);
      sendResponse({ error: errorMsg });
    });
    return true; // Keep message channel open for async response
  }

  return false;
});

/** Expose router for worker registration. */
export { router };

console.log('[Converse With This Site] Background service worker started.');

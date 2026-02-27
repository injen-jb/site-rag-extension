import { providers } from '@/config/providers.config';

const embedder = providers.embedding;

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'init') {
    try {
      await embedder.initialize();
      self.postMessage({ type: 'ready' });
    } catch (e) {
      self.postMessage({ type: 'error', error: String(e) });
    }
  }

  if (type === 'embed') {
    try {
      const { text } = payload;
      const result = await embedder.embed(text);
      self.postMessage({ type: 'result', result });
    } catch (e) {
      self.postMessage({ type: 'error', error: String(e) });
    }
  }

  if (type === 'embedBatch') {
    try {
      const { texts } = payload;
      const result = await embedder.embedBatch(texts);
      self.postMessage({ type: 'result', result });
    } catch (e) {
      self.postMessage({ type: 'error', error: String(e) });
    }
  }
};
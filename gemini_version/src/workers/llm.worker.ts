import { providers } from '@/config/providers.config';

// Thin worker shell: instantiates LFM2WebGPUProvider
const llmProvider = providers.llm;

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'init') {
    try {
      await llmProvider.initialize();
      self.postMessage({ type: 'ready' });
    } catch (e) {
      self.postMessage({ type: 'error', error: String(e) });
    }
  }

  if (type === 'generate') {
    try {
      const { prompt, options } = payload;
      const result = await llmProvider.generate(prompt, options);
      self.postMessage({ type: 'result', result });
    } catch (e) {
      self.postMessage({ type: 'error', error: String(e) });
    }
  }

  if (type === 'stream') {
    try {
      const { prompt, options } = payload;
      await llmProvider.stream(prompt, (token: string) => {
        self.postMessage({ type: 'token', token });
      }, options);
      self.postMessage({ type: 'done' });
    } catch (e) {
      self.postMessage({ type: 'error', error: String(e) });
    }
  }
};
import { providers } from '@/config/providers.config';

const crawler = providers.crawler;

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'crawl') {
    try {
      const { startUrl, options } = payload;
      const result = await crawler.crawl(startUrl, options);
      self.postMessage({ type: 'result', result });
    } catch (e) {
      self.postMessage({ type: 'error', error: String(e) });
    }
  }
};
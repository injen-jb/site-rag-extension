/**
 * Crawler worker shell.
 * Instantiates SitemapCrawler and handles crawl requests.
 */

import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';

/** Message types accepted by the crawler worker. */
interface CrawlerWorkerMessage {
  readonly type: 'crawl' | 'abort';
  readonly id?: string;
  readonly baseUrl?: string;
  readonly options?: {
    readonly maxPages?: number;
    readonly maxDepth?: number;
  };
}

let crawler: SitemapCrawler | null = null;

self.addEventListener('message', async (event: MessageEvent<CrawlerWorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'crawl': {
      if (!msg.baseUrl) {
        self.postMessage({ type: 'error', id: msg.id, error: 'No base URL provided' });
        break;
      }

      try {
        crawler = new SitemapCrawler(msg.options);

        for await (const result of crawler.crawl(msg.baseUrl, msg.options)) {
          self.postMessage({
            type: 'page',
            id: msg.id,
            url: result.url,
            title: result.title,
            markdown: result.markdown,
            crawledAt: result.crawledAt,
          });
        }

        self.postMessage({ type: 'done', id: msg.id });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
      }
      break;
    }

    case 'abort': {
      crawler?.abort();
      self.postMessage({ type: 'aborted', id: msg.id });
      break;
    }
  }
});

self.postMessage({ type: 'ready' });

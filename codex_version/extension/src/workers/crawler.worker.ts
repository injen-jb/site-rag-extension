import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';

interface CrawlMessage {
  readonly type: 'crawl';
  readonly rootUrl: string;
  readonly options?: {
    readonly maxPages?: number;
    readonly maxDepth?: number;
  };
}

const crawler = new SitemapCrawler({
  maxPages: 50,
  maxDepth: 3,
});

self.onmessage = async (event: MessageEvent<CrawlMessage>): Promise<void> => {
  if (event.data.type !== 'crawl') {
    return;
  }

  const result = await crawler.crawl(event.data.rootUrl, event.data.options);
  postMessage({ type: 'crawl-result', result });
};

import { Crawler, CrawlOptions, CrawlResult } from '@/core/interfaces/Crawler';

export class MockCrawler implements Crawler {
  public readonly name = 'Mock Crawler';
  public lastStartUrl: string | null = null;
  public mockResult: CrawlResult = { pages: [] };

  public async crawl(startUrl: string, _options?: CrawlOptions): Promise<CrawlResult> {
    this.lastStartUrl = startUrl;
    return this.mockResult;
  }
}
import type { Crawler, CrawlOptions, CrawlResult } from '@/core/interfaces/Crawler';

/** Deterministic mock Crawler for unit testing. */
export class MockCrawler implements Crawler {
  public readonly name = 'Mock Crawler';
  public mockResults: readonly CrawlResult[] = [];
  private aborted = false;

  public async *crawl(_baseUrl: string, _options?: CrawlOptions): AsyncGenerator<CrawlResult> {
    this.aborted = false;
    for (const result of this.mockResults) {
      if (this.aborted) {
        return;
      }
      yield result;
    }
  }

  public abort(): void {
    this.aborted = true;
  }
}

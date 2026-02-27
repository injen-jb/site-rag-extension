import type { Crawler, CrawlOptions, CrawlResult } from '@/core/interfaces/Crawler';

/** Deterministic crawler mock returning fixed pages for tests. */
export class MockCrawler implements Crawler {
  /** Provider display name. */
  public readonly name = 'Mock Crawler';

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    return true;
  }

  /** @inheritdoc */
  public async crawl(rootUrl: string, _options?: Partial<CrawlOptions>): Promise<CrawlResult> {
    return {
      pages: [
        {
          url: rootUrl,
          title: 'Home',
          markdown: '# Home\n\nWelcome.',
        },
        {
          url: `${rootUrl}/about`,
          title: 'About',
          markdown: '# About\n\nAbout content.',
        },
      ],
      sitemapLastModified: '2026-01-01',
    };
  }
}

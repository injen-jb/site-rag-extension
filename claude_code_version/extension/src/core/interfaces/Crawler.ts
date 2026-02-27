/** Options controlling a crawl operation. */
export interface CrawlOptions {
  readonly maxPages?: number;
  readonly maxDepth?: number;
  readonly respectRobots?: boolean;
}

/** Result of crawling a single page. */
export interface CrawlResult {
  readonly url: string;
  readonly title: string;
  readonly markdown: string;
  readonly crawledAt: number;
}

/** Contract for site crawling backends. */
export interface Crawler {
  /** Human-readable crawler name. */
  readonly name: string;

  /** Crawl a site starting from the given base URL. */
  crawl(baseUrl: string, options?: CrawlOptions): AsyncGenerator<CrawlResult>;

  /** Abort any in-progress crawl operation. */
  abort(): void;
}

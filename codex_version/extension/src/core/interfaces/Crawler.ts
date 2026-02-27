/** Crawl options controlling sitemap and traversal behavior. */
export interface CrawlOptions {
  /** Maximum number of pages to crawl. */
  readonly maxPages: number;
  /** Maximum BFS depth from discovered roots. */
  readonly maxDepth: number;
}

/** One crawled page payload. */
export interface CrawledPage {
  /** Page URL. */
  readonly url: string;
  /** Page title when available. */
  readonly title: string;
  /** Clean markdown content extracted from the page. */
  readonly markdown: string;
  /** Last-modified timestamp string when available. */
  readonly lastModified?: string;
}

/** Crawl operation result. */
export interface CrawlResult {
  /** Crawled pages in traversal order. */
  readonly pages: CrawledPage[];
  /** Sitemap lastmod marker used for cache validation. */
  readonly sitemapLastModified?: string;
}

/** Contract for domain/site crawlers. */
export interface Crawler {
  /** Human-readable provider name. */
  readonly name: string;
  /** Returns true when crawling can run in this environment. */
  isAvailable(): Promise<boolean>;
  /** Crawl a site root URL using the given options. */
  crawl(rootUrl: string, options?: Partial<CrawlOptions>): Promise<CrawlResult>;
}

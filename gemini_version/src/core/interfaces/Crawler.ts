export interface CrawlOptions {
  readonly maxPages: number;
  readonly maxDepth: number;
}

export interface CrawledPage {
  readonly url: string;
  readonly title: string;
  readonly html: string;
}

export interface CrawlResult {
  readonly pages: CrawledPage[];
}

export interface Crawler {
  readonly name: string;
  crawl(startUrl: string, options?: CrawlOptions): Promise<CrawlResult>;
}
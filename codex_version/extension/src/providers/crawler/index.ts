import type { Crawler } from '@/core/interfaces/Crawler';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';

/** LLM provider selection options. */
export interface CrawlerFactoryConfig {
  /** Default maximum number of pages. */
  readonly maxPages: number;
  /** Default maximum crawl depth. */
  readonly maxDepth: number;
}

/**
 * Creates crawler provider instances.
 */
export function createCrawler(config: CrawlerFactoryConfig): Crawler {
  return new SitemapCrawler({
    maxPages: config.maxPages,
    maxDepth: config.maxDepth,
  });
}

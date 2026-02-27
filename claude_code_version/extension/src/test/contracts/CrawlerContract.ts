import { describe, it, expect } from 'vitest';
import type { Crawler } from '@/core/interfaces/Crawler';

/**
 * Shared contract test suite for Crawler implementations.
 *
 * @param createCrawler - Factory returning a fresh crawler instance
 * @param testUrl - A URL the crawler can crawl (may be mocked)
 */
export function runCrawlerContractTests(
  createCrawler: () => Crawler,
  testUrl: string = 'https://example.com'
): void {
  describe('Crawler contract', () => {
    it('exposes a non-empty name', () => {
      const crawler = createCrawler();
      expect(crawler.name).toBeTruthy();
      expect(typeof crawler.name).toBe('string');
    });

    it('crawl() returns an async generator', () => {
      const crawler = createCrawler();
      const gen = crawler.crawl(testUrl);
      expect(gen[Symbol.asyncIterator]).toBeDefined();
    });

    it('crawl() yields CrawlResult objects with required fields', async () => {
      const crawler = createCrawler();
      const results = [];
      for await (const result of crawler.crawl(testUrl, { maxPages: 2 })) {
        results.push(result);
        expect(result.url).toBeTruthy();
        expect(typeof result.url).toBe('string');
        expect(typeof result.title).toBe('string');
        expect(typeof result.markdown).toBe('string');
        expect(typeof result.crawledAt).toBe('number');
      }
    });

    it('abort() can be called without throwing', () => {
      const crawler = createCrawler();
      expect(() => crawler.abort()).not.toThrow();
    });
  });
}

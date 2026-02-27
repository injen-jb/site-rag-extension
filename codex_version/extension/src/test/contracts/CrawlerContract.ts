import { describe, expect, it } from 'vitest';
import type { Crawler } from '@/core/interfaces/Crawler';

/**
 * Shared contract tests for crawler implementations.
 * @param createCrawler Factory returning a fresh crawler instance.
 */
export function runCrawlerContractTests(createCrawler: () => Crawler): void {
  describe('Crawler contract', () => {
    it('exposes a non-empty name', () => {
      const crawler = createCrawler();
      expect(crawler.name).toBeTruthy();
    });

    it('reports availability as boolean', async () => {
      const crawler = createCrawler();
      const available = await crawler.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('crawl() returns pages array', async () => {
      const crawler = createCrawler();
      const result = await crawler.crawl('https://example.com');
      expect(Array.isArray(result.pages)).toBe(true);
    });
  });
}

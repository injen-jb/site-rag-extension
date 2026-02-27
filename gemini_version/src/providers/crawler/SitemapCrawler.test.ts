import { describe, it, expect } from 'vitest';
import { Crawler } from '@/core/interfaces/Crawler';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';

describe('SitemapCrawler', () => {
  it('instantiates and implements Crawler interface', () => {
    const crawler: Crawler = new SitemapCrawler({ maxPages: 5, maxDepth: 1 });
    expect(crawler).toBeDefined();
  });
});
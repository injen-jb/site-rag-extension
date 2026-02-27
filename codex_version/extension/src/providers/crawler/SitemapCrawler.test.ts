import { describe, expect, it } from 'vitest';
import { runCrawlerContractTests } from '@/test/contracts/CrawlerContract';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';

function buildCrawler(): SitemapCrawler {
  return new SitemapCrawler(
    {
      maxPages: 2,
      maxDepth: 2,
    },
    {
      fetcher: async (url) => {
        if (url.endsWith('/sitemap.xml')) {
          return new Response(
            `<?xml version="1.0"?>
            <urlset>
              <url><loc>https://example.com/</loc><lastmod>2026-01-01</lastmod></url>
              <url><loc>https://example.com/about</loc></url>
            </urlset>`,
            { status: 200 },
          );
        }

        if (url === 'https://example.com/' || url === 'https://example.com') {
          return new Response('<main><h1>Home</h1><p>Welcome</p></main>', { status: 200 });
        }

        if (url === 'https://example.com/about') {
          return new Response('<main><h1>About</h1><p>About page</p></main>', { status: 200 });
        }

        return new Response('', { status: 404 });
      },
    },
  );
}

runCrawlerContractTests(() => buildCrawler());

describe('SitemapCrawler', () => {
  it('respects maxPages limit', async () => {
    const crawler = buildCrawler();
    const result = await crawler.crawl('https://example.com');

    expect(result.pages.length).toBeLessThanOrEqual(2);
  });

  it('extracts sitemap lastmod marker when present', async () => {
    const crawler = buildCrawler();
    const result = await crawler.crawl('https://example.com');

    expect(result.sitemapLastModified).toBe('2026-01-01');
  });
});

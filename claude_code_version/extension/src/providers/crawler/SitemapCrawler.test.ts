import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SitemapCrawler } from './SitemapCrawler';
import { runCrawlerContractTests } from '@/test/contracts/CrawlerContract';

// Mock fetch for tests
const mockFetch = vi.fn();

// Run contract tests with mock
runCrawlerContractTests(() => {
  const crawler = new SitemapCrawler({ maxPages: 5, maxDepth: 2 }, mockFetch);
  // Set up mock to return a simple sitemap and page
  mockFetch.mockImplementation(async (url: string) => {
    if (url.includes('sitemap.xml')) {
      return new Response(
        `<?xml version="1.0"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page1</loc></url>
        </urlset>`,
        { status: 200, headers: { 'Content-Type': 'application/xml' } }
      );
    }
    return new Response(
      '<html><head><title>Test Page</title></head><body><main><p>Test content here.</p></main></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  });
  return crawler;
});

describe('SitemapCrawler (unit)', () => {
  let crawler: SitemapCrawler;

  beforeEach(() => {
    mockFetch.mockReset();
    crawler = new SitemapCrawler({ maxPages: 5, maxDepth: 2 }, mockFetch);
  });

  it('has a descriptive name', () => {
    expect(crawler.name).toBe('Sitemap Crawler');
  });

  it('parses sitemap XML and fetches pages', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('sitemap.xml')) {
        return new Response(
          `<?xml version="1.0"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/page1</loc></url>
            <url><loc>https://example.com/page2</loc></url>
          </urlset>`,
          { status: 200, headers: { 'Content-Type': 'application/xml' } }
        );
      }
      return new Response(
        `<html><head><title>Page</title></head><body><main><p>Content for ${url}</p></main></body></html>`,
        { status: 200 }
      );
    });

    const results = [];
    for await (const result of crawler.crawl('https://example.com')) {
      results.push(result);
    }
    expect(results.length).toBe(2);
    expect(results[0]!.url).toBe('https://example.com/page1');
    expect(results[0]!.title).toBe('Page');
    expect(results[0]!.markdown).toBeTruthy();
  });

  it('respects maxPages limit', async () => {
    const limitCrawler = new SitemapCrawler({ maxPages: 1, maxDepth: 1 }, mockFetch);

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('sitemap.xml')) {
        return new Response(
          `<?xml version="1.0"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/page1</loc></url>
            <url><loc>https://example.com/page2</loc></url>
            <url><loc>https://example.com/page3</loc></url>
          </urlset>`,
          { status: 200 }
        );
      }
      return new Response(
        '<html><head><title>P</title></head><body><p>C</p></body></html>',
        { status: 200 }
      );
    });

    const results = [];
    for await (const result of limitCrawler.crawl('https://example.com')) {
      results.push(result);
    }
    expect(results.length).toBe(1);
  });

  it('handles missing sitemap gracefully', async () => {
    mockFetch.mockImplementation(async () => {
      return new Response('', { status: 404 });
    });

    const results = [];
    for await (const result of crawler.crawl('https://example.com')) {
      results.push(result);
    }
    // Should still try to crawl the base URL
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('abort() stops the crawl', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('sitemap.xml')) {
        return new Response(
          `<?xml version="1.0"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/page1</loc></url>
            <url><loc>https://example.com/page2</loc></url>
            <url><loc>https://example.com/page3</loc></url>
          </urlset>`,
          { status: 200 }
        );
      }
      return new Response(
        '<html><head><title>P</title></head><body><p>C</p></body></html>',
        { status: 200 }
      );
    });

    const results = [];
    for await (const result of crawler.crawl('https://example.com')) {
      results.push(result);
      crawler.abort(); // Stop after first result
    }
    expect(results.length).toBe(1);
  });
});

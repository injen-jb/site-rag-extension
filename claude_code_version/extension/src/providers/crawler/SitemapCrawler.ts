import type { Crawler, CrawlOptions, CrawlResult } from '@/core/interfaces/Crawler';
import { DOMExtractor } from '@/core/extraction/DOMExtractor';
import { HTMLToMarkdown } from '@/core/extraction/HTMLToMarkdown';

/** Configuration for the SitemapCrawler. */
export interface SitemapCrawlerConfig {
  readonly maxPages?: number;
  readonly maxDepth?: number;
}

/** Default crawl limits. */
const DEFAULT_MAX_PAGES = 50;
const DEFAULT_MAX_DEPTH = 3;

/**
 * Crawls a site by parsing its sitemap.xml, then fetching each page.
 * Falls back to crawling just the base URL if no sitemap is found.
 */
export class SitemapCrawler implements Crawler {
  public readonly name = 'Sitemap Crawler';
  private readonly config: Required<SitemapCrawlerConfig>;
  private readonly fetchFn: typeof fetch;
  private readonly extractor: DOMExtractor;
  private readonly markdownConverter: HTMLToMarkdown;
  private aborted = false;

  constructor(config?: SitemapCrawlerConfig, fetchFn?: typeof fetch) {
    this.config = {
      maxPages: config?.maxPages ?? DEFAULT_MAX_PAGES,
      maxDepth: config?.maxDepth ?? DEFAULT_MAX_DEPTH,
    };
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
    this.extractor = new DOMExtractor();
    this.markdownConverter = new HTMLToMarkdown();
  }

  /** Crawl a site starting from the given base URL. */
  public async *crawl(baseUrl: string, options?: CrawlOptions): AsyncGenerator<CrawlResult> {
    this.aborted = false;
    const maxPages = options?.maxPages ?? this.config.maxPages;

    // Try to find sitemap
    const urls = await this.fetchSitemapUrls(baseUrl);

    // If no sitemap URLs found, fall back to base URL
    if (urls.length === 0) {
      urls.push(baseUrl);
    }

    let fetched = 0;
    for (const url of urls) {
      if (this.aborted || fetched >= maxPages) {
        return;
      }

      const result = await this.fetchPage(url);
      if (result) {
        fetched++;
        yield result;
      }
    }
  }

  /** Abort any in-progress crawl. */
  public abort(): void {
    this.aborted = true;
  }

  /** Try to fetch and parse sitemap.xml from common locations. */
  private async fetchSitemapUrls(baseUrl: string): Promise<string[]> {
    const sitemapLocations = [
      `${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
      `${baseUrl.replace(/\/$/, '')}/sitemap_index.xml`,
    ];

    for (const sitemapUrl of sitemapLocations) {
      try {
        const response = await this.fetchFn(sitemapUrl);
        if (response.ok) {
          const text = await response.text();
          return this.parseSitemap(text);
        }
      } catch {
        /* try next location */
      }
    }

    return [];
  }

  /** Parse a sitemap XML string and extract URLs. */
  private parseSitemap(xml: string): string[] {
    const urls: string[] = [];

    // Match <loc> tags in sitemap
    const locPattern = /<loc>\s*(.*?)\s*<\/loc>/gi;
    let match: RegExpExecArray | null;
    while ((match = locPattern.exec(xml)) !== null) {
      const url = match[1];
      if (url) {
        urls.push(url.trim());
      }
    }

    return urls;
  }

  /** Fetch a single page and convert to a CrawlResult. */
  private async fetchPage(url: string): Promise<CrawlResult | null> {
    try {
      const response = await this.fetchFn(url);
      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      const cleanedText = this.extractor.extract(html);
      const markdown = this.markdownConverter.convert(cleanedText);

      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch?.[1]?.trim() ?? '';

      return {
        url,
        title,
        markdown,
        crawledAt: Date.now(),
      };
    } catch {
      return null;
    }
  }
}

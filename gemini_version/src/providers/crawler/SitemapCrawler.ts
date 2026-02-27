import { Crawler, CrawlOptions, CrawlResult, CrawledPage } from '@/core/interfaces/Crawler';
import { CrawlError } from '@/core/errors';

export interface SitemapCrawlerConfig {
  readonly maxPages: number;
  readonly maxDepth: number;
}

export class SitemapCrawler implements Crawler {
  public readonly name = 'Sitemap Crawler';
  private readonly config: SitemapCrawlerConfig;

  constructor(config: SitemapCrawlerConfig) {
    this.config = config;
  }

  public async crawl(startUrl: string, options?: CrawlOptions): Promise<CrawlResult> {
    const maxPages = options?.maxPages ?? this.config.maxPages;
    const maxDepth = options?.maxDepth ?? this.config.maxDepth;

    const pages: CrawledPage[] = [];
    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

    try {
      // First try to find a sitemap
      const urlObj = new URL(startUrl);
      const sitemapUrl = `${urlObj.origin}/sitemap.xml`;
      
      try {
        const sitemapRes = await fetch(sitemapUrl);
        if (sitemapRes.ok) {
          const sitemapText = await sitemapRes.text();
          // Extract URLs from sitemap XML using basic regex
          const locRegex = /<loc>(.*?)<\/loc>/g;
          let match;
          while ((match = locRegex.exec(sitemapText)) !== null) {
            const loc = match[1];
            if (loc && !visited.has(loc)) {
              queue.push({ url: loc, depth: 1 });
              visited.add(loc);
            }
            if (queue.length > maxPages * 2) break;
          }
        }
      } catch (e) {
        // Sitemap might not exist, fallback to single page or basic BFS
      }

      while (queue.length > 0 && pages.length < maxPages) {
        const current = queue.shift();
        if (!current) continue;

        if (current.depth > maxDepth) continue;

        try {
          const res = await fetch(current.url);
          if (!res.ok) continue;
          
          const html = await res.text();
          // Basic title extraction
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch && titleMatch[1] ? titleMatch[1] : current.url;

          pages.push({
            url: current.url,
            title,
            html
          });

        } catch (e) {
          // ignore fetch error for this page and continue
        }
      }

      return { pages };
    } catch (err: unknown) {
      throw new CrawlError(`Crawl failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
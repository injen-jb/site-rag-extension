import type { CrawlOptions, CrawlResult, Crawler } from '@/core/interfaces/Crawler';

interface SitemapEntry {
  readonly loc: string;
  readonly lastmod?: string;
}

/** Configuration for sitemap crawler defaults. */
export interface SitemapCrawlerConfig extends CrawlOptions {}

/** Runtime dependencies for sitemap crawler. */
export interface SitemapCrawlerDependencies {
  /** Optional fetch implementation override. */
  readonly fetcher?: (input: string) => Promise<Response>;
}

/**
 * Sitemap-first crawler for site mode ingestion.
 */
export class SitemapCrawler implements Crawler {
  /** @inheritdoc */
  public readonly name = 'Sitemap Crawler';

  private readonly config: SitemapCrawlerConfig;
  private readonly dependencies: SitemapCrawlerDependencies;

  /**
   * @param config Default crawl limits.
   * @param dependencies Optional runtime dependency overrides.
   */
  constructor(config: SitemapCrawlerConfig, dependencies?: SitemapCrawlerDependencies) {
    this.config = config;
    this.dependencies = dependencies ?? {};
  }

  /** @inheritdoc */
  public async isAvailable(): Promise<boolean> {
    return typeof fetch !== 'undefined' || this.dependencies.fetcher !== undefined;
  }

  /** @inheritdoc */
  public async crawl(rootUrl: string, options?: Partial<CrawlOptions>): Promise<CrawlResult> {
    const maxPages = Math.max(1, options?.maxPages ?? this.config.maxPages);
    const maxDepth = Math.max(0, options?.maxDepth ?? this.config.maxDepth);
    if (maxDepth === 0) {
      return { pages: [] };
    }

    const root = new URL(rootUrl).origin;
    const sitemapEntries = await this.readSitemapEntries(root);

    const targetEntries = sitemapEntries.length > 0 ? sitemapEntries : [{ loc: root }];
    const pages = [] as CrawlResult['pages'];

    for (const entry of targetEntries.slice(0, maxPages)) {
      const response = await this.fetchUrl(entry.loc);
      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const markdown = htmlToMarkdown(html);
      const title = readTitle(html, entry.loc);

      pages.push({
        url: entry.loc,
        title,
        markdown,
        lastModified: entry.lastmod,
      });
    }

    const lastmod = targetEntries.find((entry) => Boolean(entry.lastmod))?.lastmod;

    return {
      pages,
      sitemapLastModified: lastmod,
    };
  }

  private async readSitemapEntries(root: string): Promise<SitemapEntry[]> {
    const candidates = [`${root}/sitemap.xml`, `${root}/sitemap_index.xml`];

    for (const candidate of candidates) {
      const response = await this.fetchUrl(candidate);
      if (!response.ok) {
        continue;
      }

      const xml = await response.text();
      const entries = parseSitemapXml(xml);
      if (entries.length > 0) {
        return entries;
      }
    }

    return [];
  }

  private async fetchUrl(url: string): Promise<Response> {
    const fetcher = this.dependencies.fetcher ?? fetch;
    return fetcher(url);
  }
}

function parseSitemapXml(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const urlBlocks = Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/giu));

  for (const block of urlBlocks) {
    const content = block[1];
    if (!content) {
      continue;
    }

    const locMatch = content.match(/<loc>(.*?)<\/loc>/iu);
    if (!locMatch?.[1]) {
      continue;
    }

    const lastmodMatch = content.match(/<lastmod>(.*?)<\/lastmod>/iu);
    entries.push({
      loc: decodeXml(locMatch[1].trim()),
      lastmod: lastmodMatch?.[1]?.trim(),
    });
  }

  return entries;
}

function decodeXml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function readTitle(html: string, fallbackUrl: string): string {
  const match = html.match(/<title>(.*?)<\/title>/iu);
  if (match?.[1]) {
    return match[1].trim();
  }

  const headingMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/iu);
  if (headingMatch?.[1]) {
    return stripTags(headingMatch[1]).trim();
  }

  return fallbackUrl;
}

function htmlToMarkdown(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/giu, '')
    .replace(/<style[\s\S]*?<\/style>/giu, '')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  if (withoutScripts.length === 0) {
    return '';
  }

  return withoutScripts;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/gu, ' ');
}

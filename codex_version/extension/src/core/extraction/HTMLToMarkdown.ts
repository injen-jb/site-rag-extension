import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const NOISE_SELECTORS = 'nav,footer,header,script,style,aside,noscript';

/**
 * Configuration for HTML to Markdown conversion.
 */
export interface HTMLToMarkdownConfig {
  /** Heading style used by Turndown conversion. */
  readonly headingStyle?: 'setext' | 'atx';
}

/**
 * Converts HTML fragments into clean markdown.
 */
export class HTMLToMarkdown {
  private readonly turndownService: TurndownService;

  /**
   * @param config Optional markdown conversion configuration.
   */
  constructor(config?: HTMLToMarkdownConfig) {
    this.turndownService = new TurndownService({
      headingStyle: config?.headingStyle ?? 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });
    this.turndownService.use(gfm);
  }

  /**
   * Convert HTML into markdown after stripping noisy nodes.
   * @param html Raw HTML input string.
   * @returns Markdown text.
   */
  public convert(html: string): string {
    const parser = new DOMParser();
    const documentObject = parser.parseFromString(html, 'text/html');

    for (const noisyNode of documentObject.querySelectorAll(NOISE_SELECTORS)) {
      noisyNode.remove();
    }

    const rootHtml = documentObject.body.innerHTML;
    return this.turndownService.turndown(rootHtml).trim();
  }
}

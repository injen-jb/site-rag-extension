import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Converts HTML to clean Markdown using Turndown with GFM support.
 * Wraps Turndown for consistent configuration across the extension.
 */
export class HTMLToMarkdown {
  private readonly turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '_',
      bulletListMarker: '*',
    });

    // Enable GFM (tables, strikethrough, task lists)
    this.turndown.use(gfm);

    // Remove unwanted elements
    this.turndown.remove(['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript']);
  }

  /** Convert an HTML string to Markdown. */
  public convert(html: string): string {
    if (!html.trim()) {
      return '';
    }

    return this.turndown.turndown(html).trim();
  }
}

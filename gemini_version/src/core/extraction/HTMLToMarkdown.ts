import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

/**
 * Converts HTML strings into clean Markdown.
 */
export class HTMLToMarkdown {
  private readonly turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    this.turndownService.use(gfm);
  }

  /**
   * Converts HTML content to Markdown.
   * @param html HTML string to convert
   * @returns Converted Markdown string
   */
  public convert(html: string): string {
    return this.turndownService.turndown(html);
  }
}
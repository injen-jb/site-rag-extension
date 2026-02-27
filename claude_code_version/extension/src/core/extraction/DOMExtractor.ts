/** Tags that should be completely removed from the HTML before extraction. */
const REMOVE_TAGS = ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript', 'iframe'] as const;

/** Regex patterns for stripping specific elements. */
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

/**
 * Extracts clean text content from raw HTML by stripping noise elements.
 * Pure function — no DOM API dependency, works in Node and browser.
 */
export class DOMExtractor {
  /**
   * Extract clean text from HTML string.
   * Strips scripts, styles, nav, footer, header, aside, and comments.
   * Prefers content within <main> or <article> when present.
   */
  public extract(html: string): string {
    if (!html.trim()) {
      return '';
    }

    let cleaned = html;

    // Remove HTML comments
    cleaned = cleaned.replace(COMMENT_PATTERN, '');

    // Remove unwanted tags and their content
    for (const tag of REMOVE_TAGS) {
      const tagPattern = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi');
      cleaned = cleaned.replace(tagPattern);
      // Also remove self-closing versions
      const selfClosingPattern = new RegExp(`<${tag}[^>]*/?>`, 'gi');
      cleaned = cleaned.replace(selfClosingPattern, '');
    }

    // Try to extract content from <main> or <article> if present
    const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

    if (mainMatch?.[1]) {
      cleaned = mainMatch[1];
    } else if (articleMatch?.[1]) {
      cleaned = articleMatch[1];
    }

    // Strip remaining HTML tags to get plain text
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');

    // Collapse whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned.trim();
  }
}

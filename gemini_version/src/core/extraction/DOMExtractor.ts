/**
 * Extracts the main content from a DOM document, stripping away navigation,
 * headers, footers, scripts, styles, and other noise.
 */
export class DOMExtractor {
  /**
   * Extracts clean HTML content from the given document.
   * @param doc The Document to extract from
   * @returns Cleaned HTML string of the main content
   */
  public extract(doc: Document): string {
    // Clone to avoid modifying the original document if it's the live DOM
    const clone = doc.cloneNode(true) as Document;

    // Elements to strip out completely
    const noiseSelectors = [
      'script', 'style', 'noscript', 'iframe', 'svg',
      'nav', 'header', 'footer', 'aside', '.ad', '.ads', '#cookie-banner'
    ];

    for (const selector of noiseSelectors) {
      const elements = clone.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
    }

    // Prefer <main> or <article> over the whole body
    const mainContent = clone.querySelector('main') || clone.querySelector('article');
    if (mainContent) {
      return mainContent.innerHTML;
    }

    // Fall back to body
    return clone.body ? clone.body.innerHTML : '';
  }
}
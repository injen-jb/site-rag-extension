const NOISE_SELECTORS = 'nav,footer,header,script,style,aside,noscript';

/**
 * Extracts the primary readable HTML region from a page.
 */
export class DOMExtractor {
  /**
   * Extract clean HTML by preferring `main`, then `article`, then `body`.
   * @param documentObject Browser document to extract from.
   * @returns Sanitized HTML string with noisy nodes removed.
   */
  public extract(documentObject: Document): string {
    const rootElement = this.selectRoot(documentObject);
    const clone = rootElement.cloneNode(true);
    if (!(clone instanceof Element)) {
      return '';
    }

    for (const noisyNode of clone.querySelectorAll(NOISE_SELECTORS)) {
      noisyNode.remove();
    }

    return clone.innerHTML.trim();
  }

  private selectRoot(documentObject: Document): Element {
    const mainElement = documentObject.querySelector('main');
    if (mainElement) {
      return mainElement;
    }

    const articleElement = documentObject.querySelector('article');
    if (articleElement) {
      return articleElement;
    }

    return documentObject.body;
  }
}

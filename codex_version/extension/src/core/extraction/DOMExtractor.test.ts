import { describe, expect, it } from 'vitest';
import { DOMExtractor } from '@/core/extraction/DOMExtractor';

describe('DOMExtractor', () => {
  it('prefers main element content when available', () => {
    document.body.innerHTML = `
      <header>Header should be removed</header>
      <main><h1>Main title</h1><p>Main paragraph</p></main>
      <article><p>Article fallback</p></article>
    `;

    const extractor = new DOMExtractor();
    const html = extractor.extract(document);

    expect(html).toContain('Main title');
    expect(html).toContain('Main paragraph');
    expect(html).not.toContain('Header should be removed');
    expect(html).not.toContain('Article fallback');
  });

  it('strips known noisy tags from extracted HTML', () => {
    document.body.innerHTML = `
      <article>
        <nav>Nav</nav>
        <p>Keep me</p>
        <aside>Aside</aside>
        <script>console.log('drop')</script>
        <style>p { color: red; }</style>
        <footer>Footer</footer>
      </article>
    `;

    const extractor = new DOMExtractor();
    const html = extractor.extract(document);

    expect(html).toContain('Keep me');
    expect(html).not.toContain('Nav');
    expect(html).not.toContain('Aside');
    expect(html).not.toContain('Footer');
    expect(html).not.toContain('console.log');
    expect(html).not.toContain('color: red');
  });
});

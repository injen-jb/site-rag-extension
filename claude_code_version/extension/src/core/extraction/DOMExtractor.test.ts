import { describe, it, expect } from 'vitest';
import { DOMExtractor } from './DOMExtractor';

describe('DOMExtractor', () => {
  const extractor = new DOMExtractor();

  it('removes script tags from HTML', () => {
    const html = '<div><p>Hello</p><script>alert("xss")</script></div>';
    const result = extractor.extract(html);
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
  });

  it('removes style tags from HTML', () => {
    const html = '<div><p>Hello</p><style>.foo { color: red; }</style></div>';
    const result = extractor.extract(html);
    expect(result).not.toContain('style');
    expect(result).not.toContain('color');
    expect(result).toContain('Hello');
  });

  it('removes nav elements', () => {
    const html = '<div><nav><a href="/">Home</a></nav><main><p>Content</p></main></div>';
    const result = extractor.extract(html);
    expect(result).not.toContain('Home');
    expect(result).toContain('Content');
  });

  it('removes footer elements', () => {
    const html = '<div><main><p>Content</p></main><footer>Copyright 2024</footer></div>';
    const result = extractor.extract(html);
    expect(result).not.toContain('Copyright');
    expect(result).toContain('Content');
  });

  it('removes header elements', () => {
    const html = '<div><header><h1>Logo</h1></header><main><p>Content</p></main></div>';
    const result = extractor.extract(html);
    expect(result).not.toContain('Logo');
    expect(result).toContain('Content');
  });

  it('removes aside elements', () => {
    const html = '<div><aside>Sidebar</aside><main><p>Content</p></main></div>';
    const result = extractor.extract(html);
    expect(result).not.toContain('Sidebar');
    expect(result).toContain('Content');
  });

  it('prefers main/article content when present', () => {
    const html = '<div><p>Outer</p><main><p>Main Content</p></main></div>';
    const result = extractor.extract(html);
    expect(result).toContain('Main Content');
  });

  it('returns trimmed output', () => {
    const html = '<div><p>  Hello World  </p></div>';
    const result = extractor.extract(html);
    expect(result).toBe(result.trim());
  });

  it('handles empty input', () => {
    const result = extractor.extract('');
    expect(result).toBe('');
  });

  it('strips HTML comments', () => {
    const html = '<div><!-- comment --><p>Visible</p></div>';
    const result = extractor.extract(html);
    expect(result).not.toContain('comment');
    expect(result).toContain('Visible');
  });
});

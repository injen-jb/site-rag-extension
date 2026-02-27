import { describe, it, expect } from 'vitest';
import { HTMLToMarkdown } from './HTMLToMarkdown';

describe('HTMLToMarkdown', () => {
  const converter = new HTMLToMarkdown();

  it('converts headings to markdown', () => {
    const html = '<h1>Title</h1><h2>Subtitle</h2>';
    const md = converter.convert(html);
    expect(md).toContain('# Title');
    expect(md).toContain('## Subtitle');
  });

  it('converts paragraphs', () => {
    const html = '<p>Hello World</p>';
    const md = converter.convert(html);
    expect(md).toContain('Hello World');
  });

  it('converts links', () => {
    const html = '<a href="https://example.com">Link</a>';
    const md = converter.convert(html);
    expect(md).toContain('[Link](https://example.com)');
  });

  it('converts bold text', () => {
    const html = '<strong>Bold</strong>';
    const md = converter.convert(html);
    expect(md).toContain('**Bold**');
  });

  it('converts italic text', () => {
    const html = '<em>Italic</em>';
    const md = converter.convert(html);
    expect(md).toContain('_Italic_');
  });

  it('converts unordered lists', () => {
    const html = '<ul><li>One</li><li>Two</li></ul>';
    const md = converter.convert(html);
    expect(md).toContain('*   One');
    expect(md).toContain('*   Two');
  });

  it('converts ordered lists', () => {
    const html = '<ol><li>First</li><li>Second</li></ol>';
    const md = converter.convert(html);
    expect(md).toContain('1.  First');
    expect(md).toContain('2.  Second');
  });

  it('converts code blocks', () => {
    const html = '<pre><code>const x = 1;</code></pre>';
    const md = converter.convert(html);
    expect(md).toContain('const x = 1;');
  });

  it('converts inline code', () => {
    const html = '<p>Use <code>npm install</code> to install</p>';
    const md = converter.convert(html);
    expect(md).toContain('`npm install`');
  });

  it('handles empty input', () => {
    const md = converter.convert('');
    expect(md).toBe('');
  });

  it('converts tables (GFM)', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const md = converter.convert(html);
    expect(md).toContain('A');
    expect(md).toContain('B');
    expect(md).toContain('1');
    expect(md).toContain('2');
  });
});

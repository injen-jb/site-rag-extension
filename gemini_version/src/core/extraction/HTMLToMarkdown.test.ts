import { describe, it, expect } from 'vitest';
import { HTMLToMarkdown } from '@/core/extraction/HTMLToMarkdown';

describe('HTMLToMarkdown', () => {
  it('converts basic HTML to markdown', () => {
    const converter = new HTMLToMarkdown();
    const html = '<h1>Title</h1><p>Some text</p>';
    const result = converter.convert(html);
    expect(result).toBe(`# Title\n\nSome text`);
  });

  it('handles links', () => {
    const converter = new HTMLToMarkdown();
    const html = '<a href="https://example.com">Link</a>';
    const result = converter.convert(html);
    expect(result).toBe('[Link](https://example.com)');
  });
});
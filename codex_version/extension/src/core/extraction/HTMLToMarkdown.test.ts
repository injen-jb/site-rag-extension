import { describe, expect, it } from 'vitest';
import { HTMLToMarkdown } from '@/core/extraction/HTMLToMarkdown';

describe('HTMLToMarkdown', () => {
  it('converts common HTML structures into markdown', () => {
    const converter = new HTMLToMarkdown();
    const markdown = converter.convert(`
      <main>
        <h1>Title</h1>
        <p>Hello <strong>world</strong>.</p>
        <ul><li>One</li><li>Two</li></ul>
      </main>
    `);

    expect(markdown).toContain('# Title');
    expect(markdown).toContain('Hello **world**.');
    expect(markdown).toContain('-   One');
    expect(markdown).toContain('-   Two');
  });

  it('removes noisy nodes before conversion', () => {
    const converter = new HTMLToMarkdown();
    const markdown = converter.convert(`
      <article>
        <p>Useful</p>
        <script>alert('ignore')</script>
        <style>p { color: red; }</style>
      </article>
    `);

    expect(markdown).toContain('Useful');
    expect(markdown).not.toContain('alert');
    expect(markdown).not.toContain('color: red');
  });
});

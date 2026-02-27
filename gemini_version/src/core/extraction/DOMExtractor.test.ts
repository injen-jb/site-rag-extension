import { describe, it, expect } from 'vitest';
import { DOMExtractor } from '@/core/extraction/DOMExtractor';

describe('DOMExtractor', () => {
  it('extracts content from main or article tags', () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body>
          <header>Header noise</header>
          <nav>Nav noise</nav>
          <main>
            <h1>Main Content</h1>
            <p>This is the important part.</p>
          </main>
          <aside>Aside noise</aside>
          <footer>Footer noise</footer>
        </body>
      </html>
    `;
    const document = new DOMParser().parseFromString(html, 'text/html');
    const extractor = new DOMExtractor();
    const result = extractor.extract(document);
    
    expect(result).toContain('Main Content');
    expect(result).toContain('This is the important part.');
    expect(result).not.toContain('Header noise');
    expect(result).not.toContain('Nav noise');
    expect(result).not.toContain('Aside noise');
    expect(result).not.toContain('Footer noise');
  });

  it('falls back to body if no main or article tag', () => {
    const html = `
      <html>
        <body>
          <h1>Just Body</h1>
          <p>Some text</p>
        </body>
      </html>
    `;
    const document = new DOMParser().parseFromString(html, 'text/html');
    const extractor = new DOMExtractor();
    const result = extractor.extract(document);
    
    expect(result).toContain('Just Body');
    expect(result).toContain('Some text');
  });

  it('removes scripts and styles', () => {
    const html = `
      <html>
        <body>
          <main>
            <p>Content</p>
            <script>alert("noise")</script>
            <style>body { color: red; }</style>
          </main>
        </body>
      </html>
    `;
    const document = new DOMParser().parseFromString(html, 'text/html');
    const extractor = new DOMExtractor();
    const result = extractor.extract(document);
    
    expect(result).toContain('Content');
    expect(result).not.toContain('alert');
    expect(result).not.toContain('color: red');
  });
});
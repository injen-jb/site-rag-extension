import { describe, expect, it } from 'vitest';
import { MockEmbeddingProvider } from '@/test/mocks/MockEmbeddingProvider';
import { MockLLMProvider } from '@/test/mocks/MockLLMProvider';
import { MockVectorStore } from '@/test/mocks/MockVectorStore';
import { MockCrawler } from '@/test/mocks/MockCrawler';

describe('test mocks', () => {
  it('streams deterministic tokens from mock llm', async () => {
    const provider = new MockLLMProvider();
    await provider.initialize();
    const tokens: string[] = [];
    await provider.stream('hello', (token) => {
      tokens.push(token);
    });

    expect(provider.initializeCalled).toBe(true);
    expect(tokens.join('')).toContain('mock response');
  });

  it('returns deterministic embeddings', async () => {
    const provider = new MockEmbeddingProvider();
    const result = await provider.embed('abc');
    expect(result.dimensions).toBe(4);
    expect(Array.from(result.vector)).toEqual([3, 1.5, 1, 0.75]);
  });

  it('stores and ranks vector records', async () => {
    const store = new MockVectorStore();
    await store.upsert({
      id: '1',
      text: 'chunk one',
      embedding: new Float32Array([1, 0]),
      url: 'https://example.com/1',
      title: 'One',
      crawledAt: Date.now(),
    });
    await store.upsert({
      id: '2',
      text: 'chunk two',
      embedding: new Float32Array([0, 1]),
      url: 'https://example.com/2',
      title: 'Two',
      crawledAt: Date.now(),
    });

    const results = await store.search(new Float32Array([1, 0]), 1);
    expect(results).toHaveLength(1);
    expect(results[0]?.chunk.id).toBe('1');
  });

  it('returns pages from mock crawler', async () => {
    const crawler = new MockCrawler();
    const result = await crawler.crawl('https://example.com');
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]?.url).toBe('https://example.com');
  });
});

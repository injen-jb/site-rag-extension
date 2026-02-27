import { describe, it, expect } from 'vitest';
import { Chunker } from './Chunker';

describe('Chunker', () => {
  it('splits text into chunks within the specified token limit', () => {
    const chunker = new Chunker({ maxTokens: 10, overlapTokens: 2 });
    const text = 'word '.repeat(50).trim();
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      // Each chunk's word count should be <= maxTokens
      const wordCount = chunk.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeLessThanOrEqual(10);
    }
  });

  it('returns a single chunk for short text', () => {
    const chunker = new Chunker({ maxTokens: 100, overlapTokens: 10 });
    const text = 'Hello world this is short';
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(text);
  });

  it('creates overlapping chunks', () => {
    const chunker = new Chunker({ maxTokens: 5, overlapTokens: 2 });
    const text = 'one two three four five six seven eight nine ten';
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
    // Check overlap: last N words of chunk i should appear at start of chunk i+1
    if (chunks.length >= 2) {
      const firstChunkWords = chunks[0]!.split(/\s+/);
      const secondChunkWords = chunks[1]!.split(/\s+/);
      const overlapFromFirst = firstChunkWords.slice(-2);
      const overlapInSecond = secondChunkWords.slice(0, 2);
      expect(overlapFromFirst).toEqual(overlapInSecond);
    }
  });

  it('handles empty text', () => {
    const chunker = new Chunker({ maxTokens: 100, overlapTokens: 10 });
    const chunks = chunker.chunk('');
    expect(chunks.length).toBe(0);
  });

  it('uses default configuration when none provided', () => {
    const chunker = new Chunker();
    const text = 'word '.repeat(1000).trim();
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('preserves all words across chunks (minus overlaps)', () => {
    const chunker = new Chunker({ maxTokens: 5, overlapTokens: 0 });
    const words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const text = words.join(' ');
    const chunks = chunker.chunk(text);
    const allChunkWords = chunks.flatMap(c => c.split(/\s+/));
    expect(allChunkWords).toEqual(words);
  });
});

import { describe, expect, it } from 'vitest';
import { Chunker } from '@/core/rag/Chunker';

describe('Chunker', () => {
  it('splits text into chunks with token limit', () => {
    const chunker = new Chunker({ chunkSize: 5, overlap: 2 });
    const text = 'one two three four five six seven eight nine ten';

    const chunks = chunker.chunk(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      const tokenCount = chunk.split(/\s+/u).filter(Boolean).length;
      expect(tokenCount).toBeLessThanOrEqual(5);
    }
  });

  it('applies overlap between consecutive chunks', () => {
    const chunker = new Chunker({ chunkSize: 5, overlap: 2 });
    const text = 'one two three four five six seven eight nine ten';

    const chunks = chunker.chunk(text);

    expect(chunks[0]).toBe('one two three four five');
    expect(chunks[1]).toContain('four five');
  });
});

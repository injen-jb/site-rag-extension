import { describe, it, expect } from 'vitest';
import { Chunker } from '@/core/rag/Chunker';

describe('Chunker', () => {
  it('chunks text by approximate token count with overlap', () => {
    const chunker = new Chunker(10, 2);
    // Rough tokenization is usually words. 
    // "One two three four five six seven eight nine ten eleven twelve thirteen" (13 words)
    const text = 'One two three four five six seven eight nine ten eleven twelve thirteen';
    const chunks = chunker.chunk(text);
    
    expect(chunks.length).toBeGreaterThan(1);
    // First chunk should have ~10 words
    expect(chunks[0]?.split(' ').length).toBeLessThanOrEqual(10);
    // There should be some overlap
    expect(chunks[1]).toContain('nine'); // or 'ten' depending on overlap
  });

  it('handles text smaller than chunk size', () => {
    const chunker = new Chunker(100, 10);
    const text = 'Small text.';
    const chunks = chunker.chunk(text);
    
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(text);
  });
});
import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '@/core/rag/PromptBuilder';
import { SearchResult } from '@/core/interfaces/VectorStore';

describe('PromptBuilder', () => {
  it('builds a prompt with provided context', () => {
    const builder = new PromptBuilder();
    const results: SearchResult[] = [
      {
        chunk: {
          id: '1',
          text: 'The sky is blue.',
          embedding: new Float32Array(),
          url: 'https://example.com',
          title: 'Sky',
          crawledAt: 0
        },
        score: 0.9
      }
    ];

    const prompt = builder.buildPrompt('What color is the sky?', results);
    
    expect(prompt).toContain('The sky is blue.');
    expect(prompt).toContain('What color is the sky?');
    expect(prompt).toContain('Context:');
  });

  it('handles empty context', () => {
    const builder = new PromptBuilder();
    const prompt = builder.buildPrompt('Say hello', []);
    expect(prompt).toContain('Say hello');
    expect(prompt).not.toContain('Context:');
  });
});
import { describe, expect, it } from 'vitest';
import { PromptBuilder } from '@/core/rag/PromptBuilder';
import type { SearchResult } from '@/core/interfaces/VectorStore';

describe('PromptBuilder', () => {
  it('builds current-page prompt with markdown and question', () => {
    const builder = new PromptBuilder();
    const prompt = builder.buildPagePrompt('# Heading\n\nBody text', 'What is this page about?');

    expect(prompt).toContain('What is this page about?');
    expect(prompt).toContain('# Heading');
    expect(prompt).toContain('Use only the supplied context');
  });

  it('builds rag prompt with numbered citations', () => {
    const builder = new PromptBuilder();
    const results: SearchResult[] = [
      {
        chunk: {
          id: '1',
          text: 'Chunk one text',
          embedding: new Float32Array([1, 0]),
          url: 'https://example.com/one',
          title: 'One',
          crawledAt: 1,
        },
        score: 0.9,
      },
      {
        chunk: {
          id: '2',
          text: 'Chunk two text',
          embedding: new Float32Array([0, 1]),
          url: 'https://example.com/two',
          title: 'Two',
          crawledAt: 2,
        },
        score: 0.8,
      },
    ];

    const prompt = builder.buildRAGPrompt(results, 'Summarize both chunks.');

    expect(prompt).toContain('Summarize both chunks.');
    expect(prompt).toContain('[1] https://example.com/one');
    expect(prompt).toContain('Chunk one text');
    expect(prompt).toContain('[2] https://example.com/two');
    expect(prompt).toContain('Cite sources inline');
  });
});

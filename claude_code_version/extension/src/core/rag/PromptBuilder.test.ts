import { describe, it, expect } from 'vitest';
import { PromptBuilder } from './PromptBuilder';

describe('PromptBuilder', () => {
  const builder = new PromptBuilder();

  it('builds a prompt containing the user question', () => {
    const prompt = builder.buildPagePrompt('What is this about?', 'Some page content here.');
    expect(prompt).toContain('What is this about?');
  });

  it('builds a prompt containing the page content', () => {
    const prompt = builder.buildPagePrompt('Question?', 'The page has important info.');
    expect(prompt).toContain('The page has important info.');
  });

  it('builds a RAG prompt with context chunks and sources', () => {
    const chunks = [
      { text: 'Chunk one text', url: 'https://example.com/a', score: 0.95 },
      { text: 'Chunk two text', url: 'https://example.com/b', score: 0.87 },
    ];
    const prompt = builder.buildRAGPrompt('What is X?', chunks);
    expect(prompt).toContain('Chunk one text');
    expect(prompt).toContain('Chunk two text');
    expect(prompt).toContain('What is X?');
    expect(prompt).toContain('https://example.com/a');
  });

  it('RAG prompt instructs model to cite sources', () => {
    const chunks = [
      { text: 'Info here', url: 'https://example.com/a', score: 0.9 },
    ];
    const prompt = builder.buildRAGPrompt('Tell me about it', chunks);
    expect(prompt.toLowerCase()).toContain('cite');
  });

  it('handles empty context gracefully', () => {
    const prompt = builder.buildRAGPrompt('Question?', []);
    expect(prompt).toContain('Question?');
  });

  it('page prompt includes system instruction', () => {
    const prompt = builder.buildPagePrompt('Q?', 'Content');
    // Should have some system-level instruction
    expect(prompt.length).toBeGreaterThan('Q?Content'.length);
  });
});

import type { SearchResult } from '@/core/interfaces/VectorStore';

/**
 * Builds prompts for page-level and site-level RAG conversations.
 */
export class PromptBuilder {
  /**
   * Build a prompt for Q&A over a single page markdown snapshot.
   * @param markdown Extracted page markdown.
   * @param question User question.
   * @returns Prompt string suitable for an instruction-following LLM.
   */
  public buildPagePrompt(markdown: string, question: string): string {
    return [
      'You are a precise assistant answering questions about the current web page.',
      'Use only the supplied context. If the answer is missing, say you do not know.',
      '',
      'Context:',
      markdown,
      '',
      'Question:',
      question,
      '',
      'Answer:',
    ].join('\n');
  }

  /**
   * Build a RAG prompt with retrieved chunks and source references.
   * @param results Top retrieval results.
   * @param question User question.
   * @returns Prompt string with numbered context citations.
   */
  public buildRAGPrompt(results: SearchResult[], question: string): string {
    const contextLines: string[] = [];

    results.forEach((result, index) => {
      const sourceNumber = index + 1;
      contextLines.push(`[${sourceNumber}] ${result.chunk.url}`);
      contextLines.push(result.chunk.text);
      contextLines.push('');
    });

    return [
      'You are a retrieval-augmented assistant for website Q&A.',
      'Answer using only the provided context snippets.',
      'Cite sources inline using [n] markers that map to the source list.',
      'If uncertain, say you do not know.',
      '',
      'Retrieved context:',
      ...contextLines,
      'Question:',
      question,
      '',
      'Answer:',
      'Cite sources inline.',
    ].join('\n');
  }
}

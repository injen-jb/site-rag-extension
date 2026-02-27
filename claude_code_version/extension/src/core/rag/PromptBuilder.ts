/** A context chunk with its source URL and relevance score. */
export interface ContextChunk {
  readonly text: string;
  readonly url: string;
  readonly score: number;
}

/**
 * Builds structured prompts for LLM inference.
 * Handles both direct page Q&A and RAG-based prompts with citations.
 */
export class PromptBuilder {
  /**
   * Build a prompt for answering a question about a single page's content.
   */
  public buildPagePrompt(question: string, pageContent: string): string {
    return [
      'You are a helpful assistant that answers questions based on the provided page content.',
      'Answer the question concisely and accurately based only on the content below.',
      '',
      '--- PAGE CONTENT ---',
      pageContent,
      '--- END CONTENT ---',
      '',
      `Question: ${question}`,
      '',
      'Answer:',
    ].join('\n');
  }

  /**
   * Build a RAG prompt with retrieved context chunks and source citations.
   * Instructs the model to cite sources in its answer.
   */
  public buildRAGPrompt(question: string, chunks: readonly ContextChunk[]): string {
    const contextSection = chunks.length > 0
      ? chunks
          .map((chunk, i) => `[Source ${i + 1}: ${chunk.url}]\n${chunk.text}`)
          .join('\n\n')
      : 'No relevant context found.';

    return [
      'You are a helpful assistant that answers questions based on the provided context.',
      'Use the context below to answer the question. Cite your sources using [Source N] notation.',
      'If the context does not contain enough information, say so honestly.',
      '',
      '--- CONTEXT ---',
      contextSection,
      '--- END CONTEXT ---',
      '',
      `Question: ${question}`,
      '',
      'Answer (cite sources):',
    ].join('\n');
  }
}

import { SearchResult } from '@/core/interfaces/VectorStore';

/**
 * Formats context and questions into an LLM-friendly prompt.
 */
export class PromptBuilder {
  /**
   * Builds a prompt for the LLM.
   * @param question The user's question
   * @param context Array of retrieved chunks
   * @returns Formatted prompt string
   */
  public buildPrompt(question: string, context: SearchResult[]): string {
    if (context.length === 0) {
      return `User: ${question}
Assistant:`;
    }

    let contextText = 'Context:\\n';
    for (const result of context) {
      contextText += `[Source: ${result.chunk.url}]
${result.chunk.text}

`;
    }

    return `System: Answer the question based on the provided context. If the answer is not in the context, say so.

${contextText.trim()}

User: ${question}
Assistant:`;
  }
}
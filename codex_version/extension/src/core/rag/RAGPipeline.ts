import { EmbeddingError } from '@/core/errors';
import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import type { SearchResult, VectorStore } from '@/core/interfaces/VectorStore';
import { PromptBuilder } from '@/core/rag/PromptBuilder';

/**
 * Retrieval options controlling search size.
 */
export interface RetrieveOptions {
  /** Number of top chunks to return. */
  readonly topK?: number;
}

/**
 * Coordinates embedding generation, vector search, and prompt assembly.
 */
export class RAGPipeline {
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly vectorStore: VectorStore;
  private readonly promptBuilder: PromptBuilder;

  /**
   * @param embeddingProvider Injected embedding provider implementation.
   * @param vectorStore Injected vector store implementation.
   * @param promptBuilder Optional prompt builder for response prompts.
   */
  constructor(
    embeddingProvider: EmbeddingProvider,
    vectorStore: VectorStore,
    promptBuilder: PromptBuilder = new PromptBuilder(),
  ) {
    this.embeddingProvider = embeddingProvider;
    this.vectorStore = vectorStore;
    this.promptBuilder = promptBuilder;
  }

  /**
   * Retrieve top matching chunks for a user question.
   * @param question User question text.
   * @param options Optional retrieval parameters.
   * @returns Ranked search results.
   */
  public async retrieve(question: string, options?: RetrieveOptions): Promise<SearchResult[]> {
    const topK = options?.topK ?? 5;

    try {
      const embedding = await this.embeddingProvider.embed(question);
      return await this.vectorStore.search(embedding.vector, topK);
    } catch (error: unknown) {
      if (error instanceof EmbeddingError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to embed user question.';
      throw new EmbeddingError(message);
    }
  }

  /**
   * Build a RAG answer prompt using retrieved context.
   * @param question User question.
   * @param options Optional retrieval parameters.
   * @returns Formatted prompt string.
   */
  public async buildPrompt(question: string, options?: RetrieveOptions): Promise<string> {
    const results = await this.retrieve(question, options);
    return this.promptBuilder.buildRAGPrompt(results, question);
  }
}

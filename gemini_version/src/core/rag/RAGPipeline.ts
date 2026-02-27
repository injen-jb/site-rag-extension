import { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import { VectorStore, SearchResult, ChunkRecord } from '@/core/interfaces/VectorStore';
import { CrawledPage } from '@/core/interfaces/Crawler';
import { HTMLToMarkdown } from '@/core/extraction/HTMLToMarkdown';
import { DOMExtractor } from '@/core/extraction/DOMExtractor';
import { Chunker } from '@/core/rag/Chunker';
import { PromptBuilder } from '@/core/rag/PromptBuilder';
import { EmbeddingError } from '@/core/errors';

/**
 * Orchestrates the full RAG pipeline: ingestion, retrieval, and prompt formatting.
 */
export class RAGPipeline {
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly vectorStore: VectorStore;
  
  private readonly htmlToMd = new HTMLToMarkdown();
  private readonly extractor = new DOMExtractor();
  private readonly chunker = new Chunker();
  private readonly promptBuilder = new PromptBuilder();

  constructor(embeddingProvider: EmbeddingProvider, vectorStore: VectorStore) {
    this.embeddingProvider = embeddingProvider;
    this.vectorStore = vectorStore;
  }

  /**
   * Processes a crawled page: extracts content, converts to markdown,
   * chunks, embeds, and stores in the vector store.
   */
  public async ingest(page: CrawledPage): Promise<void> {
    const doc = new DOMParser().parseFromString(page.html, 'text/html');
    const cleanHtml = this.extractor.extract(doc);
    const markdown = this.htmlToMd.convert(cleanHtml);
    const chunks = this.chunker.chunk(markdown);

    if (chunks.length === 0) return;

    let embeddings;
    try {
      embeddings = await this.embeddingProvider.embedBatch(chunks);
    } catch (err: unknown) {
      throw new EmbeddingError(err instanceof Error ? err.message : 'Embedding failed');
    }

    const records: ChunkRecord[] = chunks.map((text, i) => {
      // Use crypto.randomUUID if available, else fallback
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      return {
        id,
        text,
        embedding: embeddings[i]?.vector || new Float32Array(),
        url: page.url,
        title: page.title,
        crawledAt: Date.now()
      };
    });

    await this.vectorStore.upsertBatch(records);
  }

  /**
   * Retrieves the most relevant chunks for a given query.
   */
  public async retrieve(query: string, topK: number = 5): Promise<SearchResult[]> {
    let embeddingResult;
    try {
      embeddingResult = await this.embeddingProvider.embed(query);
    } catch (err: unknown) {
      throw new EmbeddingError(err instanceof Error ? err.message : 'Embedding query failed');
    }

    return await this.vectorStore.search(embeddingResult.vector, topK);
  }

  /**
   * Builds an LLM prompt containing context retrieved for the question.
   */
  public async buildPrompt(question: string, topK: number = 5): Promise<string> {
    const context = await this.retrieve(question, topK);
    return this.promptBuilder.buildPrompt(question, context);
  }
}
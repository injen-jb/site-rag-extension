import { Chunker } from '@/core/rag/Chunker';
import { PromptBuilder } from '@/core/rag/PromptBuilder';
import { RAGPipeline } from '@/core/rag/RAGPipeline';
import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import type { VectorStore } from '@/core/interfaces/VectorStore';
import type { Crawler } from '@/core/interfaces/Crawler';

/**
 * Coordinates full-site crawl, indexing, and prompt assembly.
 */
export class SiteRAGService {
  private readonly crawler: Crawler;
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly vectorStore: VectorStore;
  private readonly chunker: Chunker;
  private readonly promptBuilder: PromptBuilder;
  private readonly indexedHosts = new Set<string>();

  /**
   * @param crawler Crawler implementation.
   * @param embeddingProvider Embedding implementation.
   * @param vectorStore Vector storage implementation.
   * @param chunker Chunking strategy.
   * @param promptBuilder Prompt formatting strategy.
   */
  constructor(
    crawler: Crawler,
    embeddingProvider: EmbeddingProvider,
    vectorStore: VectorStore,
    chunker: Chunker,
    promptBuilder: PromptBuilder,
  ) {
    this.crawler = crawler;
    this.embeddingProvider = embeddingProvider;
    this.vectorStore = vectorStore;
    this.chunker = chunker;
    this.promptBuilder = promptBuilder;
  }

  /**
   * Build a retrieval-augmented prompt for site mode.
   * @param question User question.
   * @param activeUrl Active tab URL.
   * @returns Prompt with context and citations.
   */
  public async buildPrompt(question: string, activeUrl: string): Promise<string> {
    const hostname = new URL(activeUrl).hostname;
    const rootUrl = new URL(activeUrl).origin;

    if (!this.indexedHosts.has(hostname)) {
      await this.indexHost(rootUrl, hostname);
      this.indexedHosts.add(hostname);
    }

    const pipeline = new RAGPipeline(this.embeddingProvider, this.vectorStore, this.promptBuilder);
    return pipeline.buildPrompt(question, { topK: 5 });
  }

  /**
   * Clear indexed vectors and reset host indexing state.
   */
  public async clearCache(): Promise<void> {
    await this.vectorStore.clear();
    this.indexedHosts.clear();
  }

  private async indexHost(rootUrl: string, hostname: string): Promise<void> {
    await this.embeddingProvider.initialize();
    await this.vectorStore.deleteByDomain(hostname);

    const crawlResult = await this.crawler.crawl(rootUrl);

    let chunkIndex = 0;
    for (const page of crawlResult.pages) {
      const chunks = this.chunker.chunk(page.markdown);
      for (const chunkText of chunks) {
        const embedding = await this.embeddingProvider.embed(chunkText);
        await this.vectorStore.upsert({
          id: `${hostname}:${chunkIndex}`,
          text: chunkText,
          embedding: embedding.vector,
          url: page.url,
          title: page.title,
          crawledAt: Date.now(),
        });
        chunkIndex += 1;
      }
    }
  }
}

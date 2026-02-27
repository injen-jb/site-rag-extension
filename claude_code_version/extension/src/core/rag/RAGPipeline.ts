import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import type { VectorStore, ChunkRecord, SearchResult } from '@/core/interfaces/VectorStore';
import { Chunker } from './Chunker';

/**
 * Orchestrates the RAG flow: ingest documents (chunk → embed → store)
 * and retrieve relevant chunks for a given query.
 *
 * All dependencies are injected — no concrete implementations imported.
 */
export class RAGPipeline {
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly vectorStore: VectorStore;
  private readonly chunker: Chunker;
  private nextId = 0;

  constructor(
    embeddingProvider: EmbeddingProvider,
    vectorStore: VectorStore,
    chunker?: Chunker,
  ) {
    this.embeddingProvider = embeddingProvider;
    this.vectorStore = vectorStore;
    this.chunker = chunker ?? new Chunker();
  }

  /**
   * Ingest a document: chunk the text, embed each chunk, and store in the vector store.
   */
  public async ingest(text: string, url: string, title: string): Promise<void> {
    const chunks = this.chunker.chunk(text);
    if (chunks.length === 0) {
      return;
    }

    const embeddings = await this.embeddingProvider.embedBatch(chunks);
    const now = Date.now();

    const records: ChunkRecord[] = chunks.map((chunkText, i) => ({
      id: `chunk-${this.nextId++}`,
      text: chunkText,
      embedding: embeddings[i]!.vector,
      url,
      title,
      crawledAt: now,
    }));

    await this.vectorStore.upsertBatch(records);
  }

  /**
   * Retrieve the top-k most relevant chunks for a query.
   */
  public async retrieve(query: string, topK: number): Promise<SearchResult[]> {
    const count = await this.vectorStore.count();
    if (count === 0) {
      return [];
    }

    const queryEmbedding = await this.embeddingProvider.embed(query);
    return this.vectorStore.search(queryEmbedding.vector, topK);
  }

  /** Delete all stored data for a given domain. */
  public async clearDomain(hostname: string): Promise<void> {
    await this.vectorStore.deleteByDomain(hostname);
  }
}

import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';
import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';
import { LLMProvider, EmbeddingProvider, VectorStore, Crawler } from '@/core/interfaces';

export interface ProviderConfig {
  readonly llm: LLMProvider;
  readonly embedding: EmbeddingProvider;
  readonly vectorStore: VectorStore;
  readonly crawler: Crawler;
}

/** Active provider configuration. Swap implementations here. */
export const providers: ProviderConfig = {
  llm: new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' }),
  embedding: new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' }),
  vectorStore: new IndexedDBVectorStore({ dbName: 'converse-with-site' }),
  crawler: new SitemapCrawler({ maxPages: 50, maxDepth: 3 }),
};
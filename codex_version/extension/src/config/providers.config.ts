import type { Crawler } from '@/core/interfaces/Crawler';
import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import type { LLMProvider } from '@/core/interfaces/LLMProvider';
import type { VectorStore } from '@/core/interfaces/VectorStore';
import { FallbackEmbeddingProvider } from '@/providers/embedding/FallbackEmbeddingProvider';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';
import { ClaudeSDKProvider } from '@/providers/llm/ClaudeSDKProvider';
import { FallbackLLMProvider } from '@/providers/llm/FallbackLLMProvider';
import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';
import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';

/** Provider container used by background wiring. */
export interface ProviderConfig {
  /** Active LLM provider. */
  readonly llm: LLMProvider;
  /** Active embedding provider. */
  readonly embedding: EmbeddingProvider;
  /** Active vector store provider. */
  readonly vectorStore: VectorStore;
  /** Active crawler provider. */
  readonly crawler: Crawler;
}

/**
 * Default provider configuration; swap implementations here.
 */
export const providers: ProviderConfig = {
  llm: new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' }),
  embedding: new TransformersEmbeddingProvider({
    modelId: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
    dtype: 'q8',
  }),
  vectorStore: new IndexedDBVectorStore({ dbName: 'converse-with-site', storeName: 'chunks' }),
  crawler: new SitemapCrawler({ maxPages: 50, maxDepth: 3 }),
};

export const fallbackProviders = {
  llm: new FallbackLLMProvider(),
  embedding: new FallbackEmbeddingProvider(),
  claude: new ClaudeSDKProvider({ model: 'claude-haiku-4-5', apiKey: '' }),
};

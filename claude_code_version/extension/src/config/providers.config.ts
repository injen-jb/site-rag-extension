/**
 * Provider configuration — THE ONE FILE TO EDIT when swapping implementations.
 *
 * This file is the single point of configuration for all provider implementations.
 * Swap any provider by commenting/uncommenting lines below.
 */

import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';
// import { ClaudeSDKProvider } from '@/providers/llm/ClaudeSDKProvider';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';
import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';
import type { LLMProvider } from '@/core/interfaces/LLMProvider';
import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import type { VectorStore } from '@/core/interfaces/VectorStore';
import type { Crawler } from '@/core/interfaces/Crawler';

/** Active provider configuration. */
export interface ProviderConfig {
  readonly llm: LLMProvider;
  readonly embedding: EmbeddingProvider;
  readonly vectorStore: VectorStore;
  readonly crawler: Crawler;
}

/** Active provider instances. Swap implementations here. */
export const providers: ProviderConfig = {
  llm: new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' }),
  // llm: new ClaudeSDKProvider({ model: 'claude-sonnet-4-5', apiKey: '' }),  // ← one line swap
  embedding: new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' }),
  vectorStore: new IndexedDBVectorStore({ dbName: 'converse-with-site' }),
  crawler: new SitemapCrawler({ maxPages: 50, maxDepth: 3 }),
};

import type { EmbeddingProvider } from '@/core/interfaces/EmbeddingProvider';
import { FallbackEmbeddingProvider } from '@/providers/embedding/FallbackEmbeddingProvider';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';

/** Embedding provider selector values. */
export type EmbeddingProviderKind = 'transformers' | 'fallback';

/** Embedding provider factory config. */
export interface EmbeddingFactoryConfig {
  /** Provider kind. */
  readonly kind: EmbeddingProviderKind;
  /** Model id for transformers backend. */
  readonly modelId?: string;
  /** Embedding dimensions for transformers backend. */
  readonly dimensions?: number;
}

/**
 * Creates embedding provider instances.
 */
export function createEmbeddingProvider(config: EmbeddingFactoryConfig): EmbeddingProvider {
  if (config.kind === 'fallback') {
    return new FallbackEmbeddingProvider();
  }

  return new TransformersEmbeddingProvider({
    modelId: config.modelId ?? 'Xenova/all-MiniLM-L6-v2',
    dimensions: config.dimensions ?? 384,
    dtype: 'q8',
  });
}

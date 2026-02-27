import type { VectorStore } from '@/core/interfaces/VectorStore';
import { InMemoryVectorStore } from '@/providers/vectorstore/InMemoryVectorStore';
import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';

/** Vector store selector values. */
export type VectorStoreKind = 'indexeddb' | 'memory';

/** Vector store factory config. */
export interface VectorStoreFactoryConfig {
  /** Provider kind. */
  readonly kind: VectorStoreKind;
  /** Optional db name for indexeddb implementation. */
  readonly dbName?: string;
}

/**
 * Creates vector store instances.
 */
export function createVectorStore(config: VectorStoreFactoryConfig): VectorStore {
  if (config.kind === 'memory') {
    return new InMemoryVectorStore();
  }

  return new IndexedDBVectorStore({
    dbName: config.dbName ?? 'converse-with-site',
    storeName: 'chunks',
  });
}

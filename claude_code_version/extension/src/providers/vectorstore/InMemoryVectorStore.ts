import type { VectorStore, ChunkRecord, SearchResult } from '@/core/interfaces/VectorStore';

/**
 * Ephemeral in-memory vector store. Data is lost on page/worker reload.
 * Suitable for single-session use or testing.
 */
export class InMemoryVectorStore implements VectorStore {
  private readonly records: Map<string, ChunkRecord> = new Map();

  /** Insert or update a single record. */
  public async upsert(record: ChunkRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  /** Insert or update a batch of records. */
  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    for (const record of records) {
      this.records.set(record.id, record);
    }
  }

  /** Find the top-k most similar chunks via cosine similarity. */
  public async search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const chunk of this.records.values()) {
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({ chunk, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /** Delete all records matching the given hostname. */
  public async deleteByDomain(hostname: string): Promise<void> {
    for (const [id, record] of this.records) {
      try {
        const url = new URL(record.url);
        if (url.hostname === hostname) {
          this.records.delete(id);
        }
      } catch {
        /* skip invalid URLs */
      }
    }
  }

  /** Return the total number of stored records. */
  public async count(): Promise<number> {
    return this.records.size;
  }

  /** Remove all records. */
  public async clear(): Promise<void> {
    this.records.clear();
  }

  /** Cosine similarity between two vectors. */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}

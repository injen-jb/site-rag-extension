import type { VectorStore, ChunkRecord, SearchResult } from '@/core/interfaces/VectorStore';

/** In-memory mock VectorStore for unit testing. */
export class MockVectorStore implements VectorStore {
  private readonly records: Map<string, ChunkRecord> = new Map();

  public async upsert(record: ChunkRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    for (const record of records) {
      this.records.set(record.id, record);
    }
  }

  public async search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    for (const chunk of this.records.values()) {
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({ chunk, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

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

  public async count(): Promise<number> {
    return this.records.size;
  }

  public async clear(): Promise<void> {
    this.records.clear();
  }

  /** Cosine similarity between two vectors. */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}

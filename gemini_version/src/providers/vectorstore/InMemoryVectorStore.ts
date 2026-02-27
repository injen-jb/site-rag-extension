import { VectorStore, ChunkRecord, SearchResult } from '@/core/interfaces/VectorStore';

export class InMemoryVectorStore implements VectorStore {
  private chunks: Map<string, ChunkRecord> = new Map();

  public async upsert(record: ChunkRecord): Promise<void> {
    this.chunks.set(record.id, record);
  }

  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    for (const record of records) {
      this.chunks.set(record.id, record);
    }
  }

  public async search(queryEmbedding: Float32Array, topK: number = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const chunk of this.chunks.values()) {
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({ chunk, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  public async deleteByDomain(hostname: string): Promise<void> {
    for (const [id, chunk] of this.chunks.entries()) {
      try {
        const url = new URL(chunk.url);
        if (url.hostname === hostname) {
          this.chunks.delete(id);
        }
      } catch (e) {
        // invalid URL, skip
      }
    }
  }

  public async count(): Promise<number> {
    return this.chunks.size;
  }

  public async clear(): Promise<void> {
    this.chunks.clear();
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
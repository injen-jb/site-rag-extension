import { VectorStore, ChunkRecord, SearchResult } from '@/core/interfaces/VectorStore';

export class MockVectorStore implements VectorStore {
  public chunks: ChunkRecord[] = [];

  public async upsert(record: ChunkRecord): Promise<void> {
    const existingIndex = this.chunks.findIndex(c => c.id === record.id);
    if (existingIndex !== -1) {
      this.chunks[existingIndex] = record;
    } else {
      this.chunks.push(record);
    }
  }

  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    for (const record of records) {
      await this.upsert(record);
    }
  }

  public async search(_queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]> {
    // Just return the first topK chunks for mocking
    return this.chunks.slice(0, topK).map(chunk => ({
      chunk,
      score: 0.9
    }));
  }

  public async deleteByDomain(hostname: string): Promise<void> {
    this.chunks = this.chunks.filter(c => {
      try {
        const url = new URL(c.url);
        return url.hostname !== hostname;
      } catch {
        return true;
      }
    });
  }

  public async count(): Promise<number> {
    return this.chunks.length;
  }

  public async clear(): Promise<void> {
    this.chunks = [];
  }
}
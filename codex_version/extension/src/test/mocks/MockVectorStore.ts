import type { ChunkRecord, SearchResult, VectorStore } from '@/core/interfaces/VectorStore';

/** In-memory deterministic vector store mock for unit tests. */
export class MockVectorStore implements VectorStore {
  private readonly records = new Map<string, ChunkRecord>();

  /** @inheritdoc */
  public async upsert(record: ChunkRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  /** @inheritdoc */
  public async upsertBatch(records: ChunkRecord[]): Promise<void> {
    for (const record of records) {
      this.records.set(record.id, record);
    }
  }

  /** @inheritdoc */
  public async search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    for (const record of this.records.values()) {
      results.push({
        chunk: record,
        score: cosineSimilarity(queryEmbedding, record.embedding),
      });
    }
    return results.sort((left, right) => right.score - left.score).slice(0, topK);
  }

  /** @inheritdoc */
  public async deleteByDomain(hostname: string): Promise<void> {
    for (const [recordId, record] of this.records.entries()) {
      const url = new URL(record.url);
      if (url.hostname === hostname) {
        this.records.delete(recordId);
      }
    }
  }

  /** @inheritdoc */
  public async count(): Promise<number> {
    return this.records.size;
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    this.records.clear();
  }
}

function cosineSimilarity(left: Float32Array, right: Float32Array): number {
  if (left.length !== right.length) {
    return -1;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (leftValue === undefined || rightValue === undefined) {
      return -1;
    }

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

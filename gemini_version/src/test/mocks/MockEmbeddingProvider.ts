import { EmbeddingProvider, EmbeddingResult } from '@/core/interfaces/EmbeddingProvider';

export class MockEmbeddingProvider implements EmbeddingProvider {
  public readonly name = 'Mock Embedding';
  public readonly dimensions = 384;
  public initializeCalled = false;
  public lastTexts: string[] = [];

  public async isAvailable(): Promise<boolean> { return true; }
  public async initialize(): Promise<void> { this.initializeCalled = true; }

  public async embed(text: string): Promise<EmbeddingResult> {
    this.lastTexts.push(text);
    return {
      vector: new Float32Array(this.dimensions).fill(0.1),
      dimensions: this.dimensions
    };
  }

  public async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    this.lastTexts.push(...texts);
    return texts.map(() => ({
      vector: new Float32Array(this.dimensions).fill(0.1),
      dimensions: this.dimensions
    }));
  }

  public dispose(): void {}
}
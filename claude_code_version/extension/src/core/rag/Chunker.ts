/** Default chunk size in approximate tokens (words). */
const DEFAULT_MAX_TOKENS = 512;

/** Default overlap in approximate tokens (words). */
const DEFAULT_OVERLAP_TOKENS = 64;

/** Configuration for the Chunker. */
export interface ChunkerConfig {
  readonly maxTokens?: number;
  readonly overlapTokens?: number;
}

/**
 * Token-aware text chunker with configurable overlap.
 * Uses word count as a proxy for token count (close enough for most models).
 */
export class Chunker {
  private readonly maxTokens: number;
  private readonly overlapTokens: number;

  constructor(config?: ChunkerConfig) {
    this.maxTokens = config?.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.overlapTokens = config?.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;
  }

  /**
   * Split text into chunks with optional overlap.
   * Each chunk contains at most `maxTokens` words.
   * Consecutive chunks share `overlapTokens` words.
   */
  public chunk(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }

    const words = trimmed.split(/\s+/).filter(Boolean);

    if (words.length <= this.maxTokens) {
      return [words.join(' ')];
    }

    const chunks: string[] = [];
    const step = this.maxTokens - this.overlapTokens;
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + this.maxTokens, words.length);
      chunks.push(words.slice(start, end).join(' '));

      if (end >= words.length) {
        break;
      }

      start += step;
    }

    return chunks;
  }
}

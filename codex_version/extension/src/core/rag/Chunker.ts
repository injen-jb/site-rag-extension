/** Default chunk size in approximate tokens. */
export const DEFAULT_CHUNK_SIZE = 512;
/** Default overlap in approximate tokens. */
export const DEFAULT_CHUNK_OVERLAP = 64;

/**
 * Options controlling token-aware chunking behavior.
 */
export interface ChunkerConfig {
  /** Approximate token count per chunk. */
  readonly chunkSize?: number;
  /** Overlapping tokens between adjacent chunks. */
  readonly overlap?: number;
}

/**
 * Splits text into overlapping token chunks for embedding and retrieval.
 */
export class Chunker {
  private readonly chunkSize: number;
  private readonly overlap: number;

  /**
   * @param config Optional chunk size and overlap configuration.
   */
  constructor(config?: ChunkerConfig) {
    this.chunkSize = Math.max(1, config?.chunkSize ?? DEFAULT_CHUNK_SIZE);
    this.overlap = Math.max(0, Math.min(this.chunkSize - 1, config?.overlap ?? DEFAULT_CHUNK_OVERLAP));
  }

  /**
   * Split input text into overlapping chunks.
   * @param text Plain text input.
   * @returns Ordered list of chunk strings.
   */
  public chunk(text: string): string[] {
    const tokens = tokenize(text);
    if (tokens.length === 0) {
      return [];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < tokens.length) {
      const endIndex = Math.min(startIndex + this.chunkSize, tokens.length);
      chunks.push(tokens.slice(startIndex, endIndex).join(' '));

      if (endIndex >= tokens.length) {
        break;
      }

      startIndex = Math.max(0, endIndex - this.overlap);
    }

    return chunks;
  }
}

function tokenize(text: string): string[] {
  return text
    .trim()
    .split(/\s+/u)
    .filter((token) => token.length > 0);
}

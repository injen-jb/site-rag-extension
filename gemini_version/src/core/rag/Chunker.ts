/**
 * Splits text into overlapping chunks based on approximate token counts.
 * Uses a word-based approximation for speed in the browser.
 */
export class Chunker {
  private readonly chunkSize: number;
  private readonly overlap: number;

  /**
   * @param chunkSize Maximum number of "tokens" (words) per chunk
   * @param overlap Number of tokens to overlap between chunks
   */
  constructor(chunkSize: number = 512, overlap: number = 64) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  /**
   * Splits a long text string into an array of chunks.
   * @param text The markdown or plain text to split
   * @returns Array of chunk strings
   */
  public chunk(text: string): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    if (words.length === 0 || text.trim() === '') {
      return [];
    }

    let i = 0;
    while (i < words.length) {
      const end = Math.min(i + this.chunkSize, words.length);
      const chunkWords = words.slice(i, end);
      chunks.push(chunkWords.join(' '));
      
      if (end === words.length) {
        break;
      }
      
      i += (this.chunkSize - this.overlap);
    }

    return chunks;
  }
}
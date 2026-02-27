/** Base error class for all Converse extension errors. */
export abstract class ExtensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a model fails to load or initialize. */
export class ModelLoadError extends ExtensionError {}

/** Thrown when crawling a website fails. */
export class CrawlError extends ExtensionError {}

/** Thrown when embedding generation fails. */
export class EmbeddingError extends ExtensionError {}

/** Thrown for generic provider errors (e.g., API issues, WebGPU errors). */
export class ProviderError extends ExtensionError {}
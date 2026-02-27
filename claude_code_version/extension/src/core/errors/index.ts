/** Base error class for all extension errors. */
export class ExtensionError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/** Thrown when a model fails to load into memory. */
export class ModelLoadError extends ExtensionError {
  constructor(message: string) {
    super(message, 'MODEL_LOAD_ERROR');
  }
}

/** Thrown when page crawling fails. */
export class CrawlError extends ExtensionError {
  public readonly url: string;

  constructor(message: string, url: string) {
    super(message, 'CRAWL_ERROR');
    this.url = url;
  }
}

/** Thrown when embedding generation fails. */
export class EmbeddingError extends ExtensionError {
  constructor(message: string) {
    super(message, 'EMBEDDING_ERROR');
  }
}

/** Thrown when a provider encounters a generic operational error. */
export class ProviderError extends ExtensionError {
  public readonly provider: string;

  constructor(message: string, provider: string) {
    super(message, 'PROVIDER_ERROR');
    this.provider = provider;
  }
}

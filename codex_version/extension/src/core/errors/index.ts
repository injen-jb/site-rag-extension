/** Base class for all domain-specific extension errors. */
abstract class BaseDomainError extends Error {
  /**
   * @param name Error type name.
   * @param message Human-readable error message.
   */
  protected constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}

/** Error thrown when a model cannot be loaded. */
export class ModelLoadError extends BaseDomainError {
  /** @param message Human-readable failure reason. */
  constructor(message: string) {
    super('ModelLoadError', message);
  }
}

/** Error thrown when crawling fails. */
export class CrawlError extends BaseDomainError {
  /** @param message Human-readable failure reason. */
  constructor(message: string) {
    super('CrawlError', message);
  }
}

/** Error thrown when embedding generation fails. */
export class EmbeddingError extends BaseDomainError {
  /** @param message Human-readable failure reason. */
  constructor(message: string) {
    super('EmbeddingError', message);
  }
}

/** Error thrown for generic provider failures. */
export class ProviderError extends BaseDomainError {
  /** @param message Human-readable failure reason. */
  constructor(message: string) {
    super('ProviderError', message);
  }
}

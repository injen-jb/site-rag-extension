/**
 * User-configurable options persisted in extension storage.
 */
export interface UserProviderSettings {
  /** Selected LLM backend. */
  readonly llmProvider: 'lfm2' | 'claude';
  /** Selected embedding backend. */
  readonly embeddingProvider: 'transformers' | 'fallback';
}

/** Storage adapter abstraction for options persistence. */
export interface OptionsStorage {
  /** Read persisted settings object. */
  get(): Promise<Partial<UserProviderSettings>>;
  /** Persist settings object. */
  set(value: UserProviderSettings): Promise<void>;
}

/**
 * State container for options page interactions.
 */
export class OptionsController {
  /** In-memory copy of current settings. */
  public settings: UserProviderSettings = {
    llmProvider: 'lfm2',
    embeddingProvider: 'transformers',
  };

  private readonly storage: OptionsStorage;
  private readonly clearCacheHandler: () => Promise<void>;

  /**
   * @param storage Storage adapter.
   * @param clearCacheHandler Callback for clearing cached vectors.
   */
  constructor(storage: OptionsStorage, clearCacheHandler: () => Promise<void>) {
    this.storage = storage;
    this.clearCacheHandler = clearCacheHandler;
  }

  /** Load settings from storage and merge defaults. */
  public async load(): Promise<void> {
    const stored = await this.storage.get();
    this.settings = {
      llmProvider: stored.llmProvider ?? 'lfm2',
      embeddingProvider: stored.embeddingProvider ?? 'transformers',
    };
  }

  /**
   * Update in-memory settings.
   * @param partial Partial settings update.
   */
  public update(partial: Partial<UserProviderSettings>): void {
    this.settings = {
      ...this.settings,
      ...partial,
    };
  }

  /** Persist current settings to storage. */
  public async save(): Promise<void> {
    await this.storage.set(this.settings);
  }

  /** Clears vector cache through injected callback. */
  public async clearCache(): Promise<void> {
    await this.clearCacheHandler();
  }
}

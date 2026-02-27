/** Options controlling text generation behavior. */
export interface GenerateOptions {
  readonly maxNewTokens?: number;
  readonly temperature?: number;
  readonly doSample?: boolean;
}

/** Callback invoked for each streamed token during generation. */
export type StreamHandler = (token: string) => void;

/** Contract that every LLM backend must satisfy. */
export interface LLMProvider {
  /** Human-readable provider name for logging and UI display. */
  readonly name: string;

  /** Load model into memory. Must be called before generate(). */
  initialize(): Promise<void>;

  /** Returns true if this provider can run in the current environment. */
  isAvailable(): Promise<boolean>;

  /** Generate a full response (non-streaming). */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /** Stream tokens to handler as they are produced. */
  stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void>;

  /** Release GPU/memory resources. */
  dispose(): void;
}

/**
 * Options controlling text generation behavior.
 */
export interface GenerateOptions {
  /** Maximum number of new tokens to generate. */
  readonly maxNewTokens?: number;
  /** Sampling temperature used by stochastic decoding. */
  readonly temperature?: number;
  /** When true, generation uses probabilistic sampling. */
  readonly doSample?: boolean;
}

/** Callback invoked for each streamed token during generation. */
export type StreamHandler = (token: string) => void;

/** Contract that every LLM backend must satisfy. */
export interface LLMProvider {
  /** Human-readable provider name for logging and UI display. */
  readonly name: string;

  /** Load model into memory before generation requests. */
  initialize(): Promise<void>;

  /** Returns true when this provider can run in the current environment. */
  isAvailable(): Promise<boolean>;

  /** Generate a full response in non-streaming mode. */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /** Stream tokens to the provided handler as they are produced. */
  stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void>;

  /** Release model and related resources. */
  dispose(): void;
}

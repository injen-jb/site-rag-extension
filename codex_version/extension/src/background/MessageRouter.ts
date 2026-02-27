import { ProviderError } from '@/core/errors';
import type { LLMProvider } from '@/core/interfaces/LLMProvider';

/** Supported chat mode values from the popup. */
export type ChatMode = 'page' | 'site';

/** Query request sent from popup to background stream port. */
export interface QueryMessage {
  /** Discriminator for query messages. */
  readonly type: 'query';
  /** User question text. */
  readonly question: string;
  /** Active chat mode. */
  readonly mode: ChatMode;
  /** Optional pre-built prompt passed directly to LLM. */
  readonly prompt?: string;
}

/** Streamed token payload pushed back to popup. */
export interface TokenMessage {
  /** Discriminator for token updates. */
  readonly type: 'token';
  /** Token fragment content. */
  readonly token: string;
}

/** Done signal indicating streaming completion. */
export interface DoneMessage {
  /** Discriminator for done updates. */
  readonly type: 'done';
}

/** Error payload for failed requests. */
export interface ErrorMessage {
  /** Discriminator for error updates. */
  readonly type: 'error';
  /** Human-readable error message. */
  readonly message: string;
}

/** Progress payload indicating current processing phase. */
export interface StatusMessage {
  /** Discriminator for status updates. */
  readonly type: 'status';
  /** Human-readable progress label. */
  readonly label: string;
  /** Percent progress value from 0 to 100. */
  readonly progress: number;
}

/** Union of all runtime port messages used by the chat stream. */
export type PortMessage = QueryMessage | TokenMessage | DoneMessage | ErrorMessage | StatusMessage;

/**
 * Browser-port abstraction used for typed unit tests.
 */
export interface RuntimePort {
  /** Chrome runtime port name. */
  readonly name: string;
  /** Register callback for incoming messages from popup. */
  addMessageListener(listener: (message: PortMessage) => void): void;
  /** Send message to popup listener. */
  postMessage(message: PortMessage): void;
}

/** Optional router hooks for query processing. */
export interface MessageRouterOptions {
  /** Resolve final prompt text from an incoming query message. */
  readonly resolvePrompt?: (query: QueryMessage) => Promise<string>;
}

/**
 * Routes popup query messages to LLM provider streaming responses.
 */
export class MessageRouter {
  private readonly llmProvider: LLMProvider;
  private readonly options: MessageRouterOptions;

  /**
   * @param llmProvider Injected LLM implementation used for response generation.
   */
  constructor(llmProvider: LLMProvider, options?: MessageRouterOptions) {
    this.llmProvider = llmProvider;
    this.options = options ?? {};
  }

  /**
   * Attach handler logic to a runtime stream port.
   * @param port Runtime port abstraction.
   */
  public attachPort(port: RuntimePort): void {
    port.addMessageListener((message) => {
      void this.handleIncomingMessage(port, message);
    });
  }

  private async handleIncomingMessage(port: RuntimePort, message: PortMessage): Promise<void> {
    if (message.type !== 'query') {
      return;
    }

    try {
      port.postMessage({ type: 'status', label: 'Preparing prompt', progress: 10 });
      await this.llmProvider.initialize();
      const prompt = this.options.resolvePrompt
        ? await this.options.resolvePrompt(message)
        : (message.prompt ?? message.question);
      port.postMessage({ type: 'status', label: 'Generating answer', progress: 60 });
      await this.llmProvider.stream(prompt, (token) => {
        port.postMessage({ type: 'token', token });
      });
      port.postMessage({ type: 'status', label: 'Complete', progress: 100 });
      port.postMessage({ type: 'done' });
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : 'Unknown stream error.';
      const providerError = new ProviderError(messageText);
      port.postMessage({ type: 'error', message: providerError.message });
    }
  }
}

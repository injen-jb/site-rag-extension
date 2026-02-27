import type { PortMessage, QueryMessage } from '@/background/MessageRouter';

/**
 * Mode selection used by popup chat UI.
 */
export type PopupMode = 'page' | 'site';

/** Outgoing query channel abstraction used by the popup controller. */
export interface PopupMessageChannel {
  /** Send a query message to background. */
  postMessage(message: QueryMessage): void;
}

/**
 * Stateful popup controller that manages mode, query, and streamed response text.
 */
export class PopupController {
  /** Active mode for question answering. */
  public mode: PopupMode = 'page';
  /** Current user question text. */
  public question = '';
  /** Streamed response text. */
  public response = '';
  /** Indicates whether response streaming is active. */
  public streaming = false;
  /** Latest error message, if present. */
  public errorMessage = '';
  /** Latest status label for progress display. */
  public statusLabel = '';
  /** Latest progress percentage. */
  public progress = 0;

  private readonly channel: PopupMessageChannel;

  /**
   * @param channel Message transport used to send query messages.
   */
  constructor(channel: PopupMessageChannel) {
    this.channel = channel;
  }

  /**
   * Set user question.
   * @param question Latest question input.
   */
  public setQuestion(question: string): void {
    this.question = question;
  }

  /**
   * Set active chat mode.
   * @param mode Target mode.
   */
  public setMode(mode: PopupMode): void {
    this.mode = mode;
  }

  /**
   * Send the current question to background and reset streaming state.
   */
  public ask(): void {
    if (this.question.trim().length === 0) {
      return;
    }

    this.response = '';
    this.errorMessage = '';
    this.statusLabel = 'Queued';
    this.progress = 0;
    this.streaming = true;

    this.channel.postMessage({
      type: 'query',
      question: this.question,
      mode: this.mode,
    });
  }

  /**
   * Process incoming streaming updates from background.
   * @param message Incoming stream message.
   */
  public handleIncoming(message: PortMessage): void {
    if (message.type === 'token') {
      this.response += message.token;
      return;
    }

    if (message.type === 'done') {
      this.streaming = false;
      this.statusLabel = 'Complete';
      this.progress = 100;
      return;
    }

    if (message.type === 'status') {
      this.statusLabel = message.label;
      this.progress = message.progress;
      return;
    }

    if (message.type === 'error') {
      this.streaming = false;
      this.errorMessage = message.message;
    }
  }
}

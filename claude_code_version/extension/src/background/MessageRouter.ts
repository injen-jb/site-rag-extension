/** A typed message with a discriminating type field. */
export interface TypedMessage {
  readonly type: string;
  readonly payload: unknown;
}

/** Handler function for a specific message type. */
export type MessageHandler = (message: TypedMessage) => Promise<unknown>;

/**
 * Typed message bus for routing messages between popup, background, and workers.
 * Supports registering/unregistering handlers by message type.
 */
export class MessageRouter {
  private readonly handlers: Map<string, MessageHandler> = new Map();

  /** Register a handler for a given message type. Overwrites any existing handler. */
  public on(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  /** Unregister the handler for a given message type. */
  public off(type: string): void {
    this.handlers.delete(type);
  }

  /** Check if a handler is registered for the given type. */
  public has(type: string): boolean {
    return this.handlers.has(type);
  }

  /**
   * Dispatch a message to its registered handler.
   * @throws {Error} if no handler is registered for the message type.
   */
  public async dispatch(message: TypedMessage): Promise<unknown> {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      throw new Error(`No handler registered for message type: ${message.type}`);
    }
    return handler(message);
  }
}

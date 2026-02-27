export type MessageType = 'query' | 'token' | 'done' | 'error' | 'crawl' | 'progress';

export interface BaseMessage {
  readonly type: MessageType;
}

export interface QueryMessage extends BaseMessage {
  readonly type: 'query';
  readonly question: string;
  readonly mode: 'page' | 'site';
  readonly contextHtml?: string;
  readonly contextUrl?: string;
}

export interface TokenMessage extends BaseMessage {
  readonly type: 'token';
  readonly token: string;
}

export interface DoneMessage extends BaseMessage {
  readonly type: 'done';
}

export interface ErrorMessage extends BaseMessage {
  readonly type: 'error';
  readonly message: string;
}

export type AnyMessage = QueryMessage | TokenMessage | DoneMessage | ErrorMessage;

export class MessageRouter {
  public route(message: AnyMessage, port: chrome.runtime.Port): void {
    if (message.type === 'query') {
      this.handleQuery(message as QueryMessage, port);
    }
  }

  private handleQuery(msg: QueryMessage, port: chrome.runtime.Port): void {
    if (msg.mode === 'page') {
      const prompt = `Context:\n${msg.contextHtml}\n\nQuestion: ${msg.question}`;
      this.streamLLM(prompt, port);
    } else {
      // Site mode - placeholder for later
      this.streamLLM(`Site mode not implemented yet. Question: ${msg.question}`, port);
    }
  }

  private streamLLM(prompt: string, port: chrome.runtime.Port): void {
    // Check if worker URL works in Manifest V3 (usually needs to be compiled JS, so dist/workers/llm.worker.js)
    // For dev mode with vite-plugin-web-extension, it maps to the ts file if configured right, or js.
    // Let's use standard Web Worker.
    let worker: Worker;
    try {
      worker = new Worker(chrome.runtime.getURL('src/workers/llm.worker.js'), { type: 'module' });
    } catch (e) {
      // Fallback for dev mode
      worker = new Worker(chrome.runtime.getURL('src/workers/llm.worker.ts'), { type: 'module' });
    }

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'ready') {
        worker.postMessage({ type: 'stream', payload: { prompt } });
      } else if (data.type === 'token') {
        port.postMessage({ type: 'token', token: data.token });
      } else if (data.type === 'done') {
        port.postMessage({ type: 'done' });
        worker.terminate();
      } else if (data.type === 'error') {
        port.postMessage({ type: 'error', message: data.error });
        worker.terminate();
      }
    };

    worker.postMessage({ type: 'init' });
  }
}
/**
 * LLM worker shell.
 * Instantiates the LFM2WebGPUProvider and handles messages from the background script.
 * Runs in a dedicated Web Worker for non-blocking inference.
 */

import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';
import type { GenerateOptions } from '@/core/interfaces/LLMProvider';

/** Message types accepted by the LLM worker. */
interface LLMWorkerMessage {
  readonly type: 'initialize' | 'generate' | 'stream' | 'dispose';
  readonly id?: string;
  readonly prompt?: string;
  readonly options?: GenerateOptions;
  readonly config?: {
    readonly modelId: string;
    readonly dtype: 'fp32' | 'fp16' | 'q8' | 'q4';
  };
}

let provider: LFM2WebGPUProvider | null = null;

self.addEventListener('message', async (event: MessageEvent<LLMWorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'initialize': {
      try {
        const config = msg.config ?? { modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' as const };
        provider = new LFM2WebGPUProvider(config);
        await provider.initialize();
        self.postMessage({ type: 'initialized', id: msg.id });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
      }
      break;
    }

    case 'generate': {
      if (!provider || !msg.prompt) {
        self.postMessage({ type: 'error', id: msg.id, error: 'Provider not initialized or no prompt' });
        break;
      }
      try {
        const result = await provider.generate(msg.prompt, msg.options);
        self.postMessage({ type: 'result', id: msg.id, text: result });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
      }
      break;
    }

    case 'stream': {
      if (!provider || !msg.prompt) {
        self.postMessage({ type: 'error', id: msg.id, error: 'Provider not initialized or no prompt' });
        break;
      }
      try {
        await provider.stream(msg.prompt, (token) => {
          self.postMessage({ type: 'token', id: msg.id, token });
        }, msg.options);
        self.postMessage({ type: 'done', id: msg.id });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
      }
      break;
    }

    case 'dispose': {
      provider?.dispose();
      provider = null;
      self.postMessage({ type: 'disposed', id: msg.id });
      break;
    }
  }
});

self.postMessage({ type: 'ready' });

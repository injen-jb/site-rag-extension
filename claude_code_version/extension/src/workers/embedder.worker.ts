/**
 * Embedding worker shell.
 * Instantiates TransformersEmbeddingProvider and handles batch embedding requests.
 */

import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';

/** Message types accepted by the embedder worker. */
interface EmbedderWorkerMessage {
  readonly type: 'initialize' | 'embed' | 'embedBatch' | 'dispose';
  readonly id?: string;
  readonly text?: string;
  readonly texts?: string[];
  readonly config?: {
    readonly modelId: string;
    readonly dtype?: 'fp32' | 'fp16' | 'q8';
  };
}

let provider: TransformersEmbeddingProvider | null = null;

self.addEventListener('message', async (event: MessageEvent<EmbedderWorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'initialize': {
      try {
        const config = msg.config ?? { modelId: 'Xenova/all-MiniLM-L6-v2' };
        provider = new TransformersEmbeddingProvider(config);
        await provider.initialize();
        self.postMessage({ type: 'initialized', id: msg.id, dimensions: provider.dimensions });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
      }
      break;
    }

    case 'embed': {
      if (!provider || !msg.text) {
        self.postMessage({ type: 'error', id: msg.id, error: 'Provider not initialized or no text' });
        break;
      }
      try {
        const result = await provider.embed(msg.text);
        self.postMessage({ type: 'result', id: msg.id, vector: Array.from(result.vector), dimensions: result.dimensions });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
      }
      break;
    }

    case 'embedBatch': {
      if (!provider || !msg.texts) {
        self.postMessage({ type: 'error', id: msg.id, error: 'Provider not initialized or no texts' });
        break;
      }
      try {
        const results = await provider.embedBatch(msg.texts);
        const serialized = results.map(r => ({
          vector: Array.from(r.vector),
          dimensions: r.dimensions,
        }));
        self.postMessage({ type: 'results', id: msg.id, embeddings: serialized });
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

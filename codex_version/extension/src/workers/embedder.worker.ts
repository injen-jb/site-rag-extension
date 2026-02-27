import { FallbackEmbeddingProvider } from '@/providers/embedding/FallbackEmbeddingProvider';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';

interface EmbedRequest {
  readonly type: 'embed';
  readonly texts: string[];
}

const provider = await createEmbedder();

self.onmessage = async (event: MessageEvent<EmbedRequest>): Promise<void> => {
  if (event.data.type !== 'embed') {
    return;
  }

  await provider.initialize();
  const embeddings = await provider.embedBatch(event.data.texts);
  postMessage({ type: 'embed-result', embeddings });
};

async function createEmbedder(): Promise<TransformersEmbeddingProvider | FallbackEmbeddingProvider> {
  const transformerProvider = new TransformersEmbeddingProvider({
    modelId: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
    dtype: 'q8',
  });

  const available = await transformerProvider.isAvailable();
  if (available) {
    return transformerProvider;
  }

  return new FallbackEmbeddingProvider();
}

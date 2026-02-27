import { runEmbeddingProviderContractTests } from '@/test/contracts/EmbeddingProviderContract';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';

runEmbeddingProviderContractTests(() =>
  new TransformersEmbeddingProvider(
    {
      modelId: 'Xenova/all-MiniLM-L6-v2',
      dimensions: 4,
      dtype: 'q8',
    },
    {
      hasWebGPU: () => true,
      pipelineFactory: async () => {
        return async (text: string | string[]) => {
          const makeEmbedding = (value: string) => {
            const length = value.length;
            return [length, length / 2, length / 3, length / 4];
          };

          if (Array.isArray(text)) {
            return text.map((item) => makeEmbedding(item));
          }

          return makeEmbedding(text);
        };
      },
    },
  ),
);

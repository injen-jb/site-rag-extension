import { runEmbeddingProviderContractTests } from '@/test/contracts/EmbeddingProviderContract';
import { MockEmbeddingProvider } from './MockEmbeddingProvider';

runEmbeddingProviderContractTests(() => new MockEmbeddingProvider());

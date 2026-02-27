import { runVectorStoreContractTests } from '@/test/contracts/VectorStoreContract';
import { InMemoryVectorStore } from './InMemoryVectorStore';

runVectorStoreContractTests(() => new InMemoryVectorStore());

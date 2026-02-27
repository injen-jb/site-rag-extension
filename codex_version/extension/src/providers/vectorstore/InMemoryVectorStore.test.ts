import { InMemoryVectorStore } from '@/providers/vectorstore/InMemoryVectorStore';
import { runVectorStoreContractTests } from '@/test/contracts/VectorStoreContract';

runVectorStoreContractTests(() => new InMemoryVectorStore());

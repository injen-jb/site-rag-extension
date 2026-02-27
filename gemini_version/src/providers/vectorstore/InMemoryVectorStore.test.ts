import { runVectorStoreContractTests } from '@/test/contracts/VectorStoreContract';
import { InMemoryVectorStore } from '@/providers/vectorstore/InMemoryVectorStore';

runVectorStoreContractTests(() => new InMemoryVectorStore());
import { runVectorStoreContractTests } from '@/test/contracts/VectorStoreContract';
import { MockVectorStore } from './MockVectorStore';

runVectorStoreContractTests(() => new MockVectorStore());

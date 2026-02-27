import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';
import { runVectorStoreContractTests } from '@/test/contracts/VectorStoreContract';

runVectorStoreContractTests(() =>
  new IndexedDBVectorStore({
    dbName: 'test-converse-with-site',
    storeName: 'chunks',
  }),
);

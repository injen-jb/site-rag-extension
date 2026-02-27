import { runVectorStoreContractTests } from '@/test/contracts/VectorStoreContract';
import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';

// Note: IndexedDB is not natively available in node/jsdom without a polyfill.
// We can use fake-indexeddb in our test setup if needed, but for now we skip actual IDB tests
// or assume a polyfill is present.
runVectorStoreContractTests(() => new IndexedDBVectorStore({ dbName: 'test-db-' + Math.random() }));
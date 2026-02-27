import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';
import { MockLLMProvider } from './MockLLMProvider';

runLLMProviderContractTests(() => new MockLLMProvider());

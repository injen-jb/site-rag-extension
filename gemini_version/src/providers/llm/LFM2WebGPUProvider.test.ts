import { describe, it, expect } from 'vitest';
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';
import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';

// We skip the full real execution if we don't have WebGPU in vitest node environment,
// but we run the contract tests to ensure the interface is fully implemented.
// We might mock the Hugging Face transformers pipeline inside initialize if needed,
// but for now let's just run the contract.
runLLMProviderContractTests(() =>
  new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' })
);

describe('LFM2WebGPUProvider specific tests', () => {
  it('instantiates correctly', () => {
    const provider = new LFM2WebGPUProvider({ modelId: 'test', dtype: 'q4' });
    expect(provider).toBeDefined();
    // isAvailable will probably be false in Node (jsdom) because navigator.gpu is undefined
  });
});
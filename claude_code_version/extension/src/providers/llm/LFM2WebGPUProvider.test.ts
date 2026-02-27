import { describe, it, expect, vi } from 'vitest';
import { LFM2WebGPUProvider } from './LFM2WebGPUProvider';
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';

// Run the shared contract (isAvailable will be false in Node → skips init-dependent tests)
runLLMProviderContractTests(() =>
  new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' })
);

describe('LFM2WebGPUProvider (unit)', () => {
  it('has a descriptive name', () => {
    const provider = new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' });
    expect(provider.name).toBe('LFM2 (WebGPU)');
  });

  it('isAvailable() returns false when navigator.gpu is absent', async () => {
    const provider = new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' });
    // In Node, navigator.gpu doesn't exist
    const result = await provider.isAvailable();
    expect(result).toBe(false);
  });

  it('initialize() throws ModelLoadError when WebGPU is unavailable', async () => {
    const provider = new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' });
    await expect(provider.initialize()).rejects.toThrow('WebGPU is not available');
  });

  it('dispose() can be called safely before initialization', () => {
    const provider = new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' });
    expect(() => provider.dispose()).not.toThrow();
  });
});

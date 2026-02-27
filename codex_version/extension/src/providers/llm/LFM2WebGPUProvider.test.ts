import { describe, expect, it } from 'vitest';
import { ModelLoadError } from '@/core/errors';
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';
import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';

function createStubProvider(): LFM2WebGPUProvider {
  return new LFM2WebGPUProvider(
    { modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' },
    {
      hasWebGPU: () => true,
      pipelineFactory: async () => {
        return async (_prompt, options) => {
          const streamer = options?.streamer;
          if (typeof streamer === 'function') {
            streamer('hello ');
            streamer('world');
          }

          return [{ generated_text: 'hello world' }];
        };
      },
    },
  );
}

runLLMProviderContractTests(() => createStubProvider());

describe('LFM2WebGPUProvider', () => {
  it('throws ModelLoadError when WebGPU is unavailable', async () => {
    const provider = new LFM2WebGPUProvider(
      { modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' },
      {
        hasWebGPU: () => false,
        pipelineFactory: async () => {
          return async () => [{ generated_text: 'unreachable' }];
        },
      },
    );

    await expect(provider.initialize()).rejects.toBeInstanceOf(ModelLoadError);
  });

  it('streams tokens through handler', async () => {
    const provider = createStubProvider();
    await provider.initialize();

    const tokens: string[] = [];
    await provider.stream('hi', (token) => tokens.push(token));

    expect(tokens.join('')).toContain('hello world');
  });
});

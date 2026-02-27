import type { LLMProvider } from '@/core/interfaces/LLMProvider';
import { ClaudeSDKProvider } from '@/providers/llm/ClaudeSDKProvider';
import { FallbackLLMProvider } from '@/providers/llm/FallbackLLMProvider';
import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';

/** LLM provider selector values. */
export type LLMProviderKind = 'lfm2' | 'claude' | 'fallback';

/** LLM provider factory config. */
export interface LLMFactoryConfig {
  /** Provider kind. */
  readonly kind: LLMProviderKind;
  /** Optional claude model name. */
  readonly model?: string;
  /** Optional claude api key. */
  readonly apiKey?: string;
}

/**
 * Creates llm provider instances.
 */
export function createLLMProvider(config: LLMFactoryConfig): LLMProvider {
  if (config.kind === 'claude') {
    return new ClaudeSDKProvider({
      model: config.model ?? 'claude-haiku-4-5',
      apiKey: config.apiKey ?? '',
    });
  }

  if (config.kind === 'fallback') {
    return new FallbackLLMProvider();
  }

  return new LFM2WebGPUProvider({
    modelId: 'LiquidAI/LFM2-1.2B',
    dtype: 'q4',
  });
}

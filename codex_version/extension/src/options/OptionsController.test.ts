import { describe, expect, it } from 'vitest';
import { OptionsController } from '@/options/OptionsController';

describe('OptionsController', () => {
  it('loads and saves provider settings', async () => {
    let persisted: Record<string, unknown> = {};

    const controller = new OptionsController(
      {
        get: async () => ({ llmProvider: 'lfm2', embeddingProvider: 'transformers' }),
        set: async (value) => {
          persisted = value;
        },
      },
      async () => undefined,
    );

    await controller.load();
    expect(controller.settings.llmProvider).toBe('lfm2');

    controller.update({ llmProvider: 'claude' });
    await controller.save();

    expect(persisted.llmProvider).toBe('claude');
  });

  it('clears cache through injected callback', async () => {
    let cleared = false;

    const controller = new OptionsController(
      {
        get: async () => ({}),
        set: async () => undefined,
      },
      async () => {
        cleared = true;
      },
    );

    await controller.clearCache();
    expect(cleared).toBe(true);
  });
});

import { OptionsController, type UserProviderSettings } from './OptionsController';

interface RuntimeMessage {
  readonly type: 'clear-cache';
}

const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('Options root element was not found.');
}

const controller = new OptionsController(
  {
    get: async () => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        return {};
      }

      const value = await chrome.storage.local.get(['llmProvider', 'embeddingProvider']);
      return {
        llmProvider: value.llmProvider,
        embeddingProvider: value.embeddingProvider,
      } as Partial<UserProviderSettings>;
    },
    set: async (value) => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        return;
      }

      await chrome.storage.local.set(value);
    },
  },
  async () => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      return;
    }

    await chrome.runtime.sendMessage({ type: 'clear-cache' } satisfies RuntimeMessage);
  },
);

void initialize();

async function initialize(): Promise<void> {
  await controller.load();

  appElement.innerHTML = `
    <main class="options-shell">
      <h1>Extension Options</h1>
      <label for="llm-provider">LLM provider</label>
      <select id="llm-provider">
        <option value="lfm2">LFM2 (WebGPU)</option>
        <option value="claude">Claude SDK</option>
      </select>

      <label for="embedding-provider">Embedding provider</label>
      <select id="embedding-provider">
        <option value="transformers">Transformers (WebGPU)</option>
        <option value="fallback">Fallback deterministic</option>
      </select>

      <div class="actions">
        <button id="save-settings" type="button">Save settings</button>
        <button id="clear-cache" type="button">Clear cache</button>
      </div>
      <p id="status"></p>
    </main>
  `;

  const llmSelect = getElement<HTMLSelectElement>('llm-provider');
  const embeddingSelect = getElement<HTMLSelectElement>('embedding-provider');
  const saveButton = getElement<HTMLButtonElement>('save-settings');
  const clearButton = getElement<HTMLButtonElement>('clear-cache');
  const statusElement = getElement<HTMLParagraphElement>('status');

  llmSelect.value = controller.settings.llmProvider;
  embeddingSelect.value = controller.settings.embeddingProvider;

  llmSelect.addEventListener('change', () => {
    controller.update({ llmProvider: llmSelect.value as UserProviderSettings['llmProvider'] });
  });

  embeddingSelect.addEventListener('change', () => {
    controller.update({
      embeddingProvider: embeddingSelect.value as UserProviderSettings['embeddingProvider'],
    });
  });

  saveButton.addEventListener('click', async () => {
    await controller.save();
    statusElement.textContent = 'Saved provider settings.';
  });

  clearButton.addEventListener('click', async () => {
    await controller.clearCache();
    statusElement.textContent = 'Cleared embedding cache.';
  });
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Expected element with id "${id}".`);
  }

  return element as T;
}

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';

  /** Provider type selection. */
  type LLMProviderType = 'lfm2' | 'claude';

  let llmProvider: LLMProviderType = $state('lfm2');
  let claudeApiKey = $state('');
  let maxPages = $state(50);
  let maxDepth = $state(3);
  let cacheStatus = $state('Unknown');
  let cacheSize = $state(0);
  let clearingCache = $state(false);
  let saveStatus = $state('');

  /** Load saved settings from chrome.storage. */
  async function loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([
        'llmProvider',
        'claudeApiKey',
        'maxPages',
        'maxDepth',
      ]);
      if (result['llmProvider']) llmProvider = result['llmProvider'] as LLMProviderType;
      if (result['claudeApiKey']) claudeApiKey = result['claudeApiKey'] as string;
      if (result['maxPages']) maxPages = result['maxPages'] as number;
      if (result['maxDepth']) maxDepth = result['maxDepth'] as number;
    } catch {
      /* chrome.storage may not be available in dev */
    }
  }

  /** Save settings to chrome.storage. */
  async function saveSettings(): Promise<void> {
    try {
      await chrome.storage.local.set({
        llmProvider,
        claudeApiKey,
        maxPages,
        maxDepth,
      });
      saveStatus = 'Settings saved!';
      setTimeout(() => { saveStatus = ''; }, 2000);
    } catch {
      saveStatus = 'Error saving settings.';
    }
  }

  /** Clear the IndexedDB embedding cache. */
  async function clearCache(): Promise<void> {
    clearingCache = true;
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name === 'converse-with-site') {
          indexedDB.deleteDatabase(db.name);
        }
      }
      cacheSize = 0;
      cacheStatus = 'Cache cleared';
    } catch {
      cacheStatus = 'Error clearing cache';
    }
    clearingCache = false;
  }

  /** Estimate cache size. */
  async function estimateCacheSize(): Promise<void> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        cacheSize = Math.round((estimate.usage ?? 0) / 1024 / 1024);
        cacheStatus = `~${cacheSize} MB used`;
      } else {
        cacheStatus = 'Storage API not available';
      }
    } catch {
      cacheStatus = 'Unable to estimate';
    }
  }

  // Load settings on mount
  $effect(() => {
    loadSettings();
    estimateCacheSize();
  });
</script>

<main class="max-w-2xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">Converse With This Site — Settings</h1>

  <!-- LLM Provider Section -->
  <Card class="mb-4">
    <CardContent class="p-4">
      <h2 class="text-lg font-semibold mb-3">LLM Provider</h2>

      <div class="space-y-3">
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="llmProvider"
            value="lfm2"
            bind:group={llmProvider}
            class="mt-1"
          />
          <div>
            <p class="font-medium">LFM2 (In-Browser, WebGPU)</p>
            <p class="text-sm text-muted-foreground">
              ~600MB download on first use. Runs 100% locally, no API key needed. Requires WebGPU support.
            </p>
          </div>
        </label>

        <label class="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="llmProvider"
            value="claude"
            bind:group={llmProvider}
            class="mt-1"
          />
          <div>
            <p class="font-medium">Claude API</p>
            <p class="text-sm text-muted-foreground">
              Uses Anthropic's Claude API. Requires an API key. Responses are sent to Anthropic's servers.
            </p>
          </div>
        </label>

        {#if llmProvider === 'claude'}
          <div class="ml-6">
            <label class="block text-sm font-medium mb-1" for="api-key">API Key</label>
            <input
              id="api-key"
              type="password"
              bind:value={claudeApiKey}
              placeholder="sk-ant-..."
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Crawl Settings -->
  <Card class="mb-4">
    <CardContent class="p-4">
      <h2 class="text-lg font-semibold mb-3">Crawl Settings</h2>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1" for="max-pages">Max Pages per Site</label>
          <input
            id="max-pages"
            type="number"
            bind:value={maxPages}
            min="1"
            max="200"
            class="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="max-depth">Max Crawl Depth</label>
          <input
            id="max-depth"
            type="number"
            bind:value={maxDepth}
            min="1"
            max="10"
            class="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Cache Management -->
  <Card class="mb-4">
    <CardContent class="p-4">
      <h2 class="text-lg font-semibold mb-3">Cache Management</h2>

      <p class="text-sm text-muted-foreground mb-2">
        Embeddings and crawled content are cached in your browser's IndexedDB.
      </p>

      <div class="flex items-center gap-4">
        <p class="text-sm">Status: {cacheStatus}</p>
        <Button variant="destructive" size="sm" onclick={clearCache} disabled={clearingCache}>
          {#snippet children()}
            {#if clearingCache}Clearing...{:else}Clear Cache{/if}
          {/snippet}
        </Button>
      </div>
    </CardContent>
  </Card>

  <!-- Save -->
  <div class="flex items-center gap-3">
    <Button onclick={saveSettings}>
      {#snippet children()}Save Settings{/snippet}
    </Button>
    {#if saveStatus}
      <span class="text-sm text-muted-foreground">{saveStatus}</span>
    {/if}
  </div>
</main>

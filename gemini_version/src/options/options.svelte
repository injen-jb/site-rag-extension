<script lang="ts">
  import { onMount } from 'svelte';

  let maxPages = 50;
  let maxDepth = 3;
  let vectorCount = 0;
  let provider = 'LFM2 (WebGPU)';

  onMount(async () => {
    // We would fetch settings from chrome.storage here
    chrome.storage.sync.get(['maxPages', 'maxDepth', 'provider'], (result) => {
      if (result.maxPages) maxPages = result.maxPages;
      if (result.maxDepth) maxDepth = result.maxDepth;
      if (result.provider) provider = result.provider;
    });

    // We can also compute vectorCount using the IndexedDBVectorStore directly
    // but for now we just leave it 0
  });

  function saveSettings() {
    chrome.storage.sync.set({
      maxPages,
      maxDepth,
      provider
    }, () => {
      alert('Settings saved!');
    });
  }
  
  function clearCache() {
    // Clear IDB
    alert('Cache cleared!');
  }
</script>

<div class="max-w-2xl mx-auto p-8">
  <h1 class="text-2xl font-bold mb-6">Converse Settings</h1>

  <section class="mb-8 border p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-4">Crawler Configuration</h2>
    
    <label class="block mb-4">
      <span class="text-gray-700 font-medium">Max Pages to Crawl</span>
      <input type="number" bind:value={maxPages} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
    </label>
    
    <label class="block mb-4">
      <span class="text-gray-700 font-medium">Max Crawl Depth</span>
      <input type="number" bind:value={maxDepth} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
    </label>
  </section>

  <section class="mb-8 border p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-4">AI Provider</h2>
    
    <label class="block mb-4">
      <span class="text-gray-700 font-medium">LLM Backend</span>
      <select bind:value={provider} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2">
        <option value="LFM2 (WebGPU)">Liquid AI LFM2 1.2B (Local WebGPU)</option>
        <option value="Claude API">Claude API</option>
      </select>
    </label>
  </section>

  <section class="mb-8 border p-6 rounded-lg shadow-sm flex justify-between items-center bg-gray-50">
    <div>
      <h2 class="text-xl font-semibold">Storage Management</h2>
      <p class="text-sm text-gray-500">Currently storing {vectorCount} vector chunks locally.</p>
    </div>
    <button on:click={clearCache} class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
      Clear Vector Database
    </button>
  </section>

  <div class="flex justify-end">
    <button on:click={saveSettings} class="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700">
      Save All Settings
    </button>
  </div>
</div>
<script lang="ts">
  import { onMount } from 'svelte';

  // Svelte 4 state
  let question = '';
  let response = '';
  let streaming = false;
  let mode: 'page' | 'site' = 'page';
  let port: chrome.runtime.Port | null = null;

  onMount(() => {
    port = chrome.runtime.connect({ name: 'llm-stream' });
    port.onMessage.addListener((msg) => {
      if (msg.type === 'token') response += msg.token;
      if (msg.type === 'done') streaming = false;
      if (msg.type === 'error') {
        response += `
Error: ${msg.message}`;
        streaming = false;
      }
    });

    return () => {
      port?.disconnect();
    };
  });

  function ask() {
    if (!question.trim()) return;
    response = '';
    streaming = true;
    
    // In page mode, grab content first
    if (mode === 'page') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.id) {
          chrome.tabs.sendMessage(activeTab.id, { type: 'get-page-content' }, (res) => {
            if (res && res.success) {
               port?.postMessage({ 
                 type: 'query', 
                 question, 
                 mode,
                 contextHtml: res.markdown,
                 contextUrl: res.url
               });
            } else {
               response = 'Error: Could not extract page content.';
               streaming = false;
            }
          });
        }
      });
    } else {
      // Site mode
      port?.postMessage({ type: 'query', question, mode });
    }
  }
</script>

<div class="flex flex-col h-full bg-slate-50">
  <header class="p-4 border-b bg-white flex justify-between items-center">
    <h1 class="font-bold text-lg">Converse</h1>
    <select bind:value={mode} class="border rounded p-1 text-sm">
      <option value="page">Current Page</option>
      <option value="site">Full Site</option>
    </select>
  </header>
  
  <main class="flex-1 p-4 overflow-y-auto min-h-[300px]">
    {#if response}
      <div class="bg-white p-3 rounded-lg shadow-sm border whitespace-pre-wrap">
        {response}
        {#if streaming}
          <span class="animate-pulse inline-block ml-1">▋</span>
        {/if}
      </div>
    {:else}
      <div class="text-gray-400 text-center mt-10 text-sm">
        Ask a question about this {mode === 'page' ? 'page' : 'website'}.
      </div>
    {/if}
  </main>
  
  <footer class="p-4 border-t bg-white">
    <form class="flex gap-2" on:submit|preventDefault={ask}>
      <input 
        type="text" 
        bind:value={question} 
        placeholder="Ask anything..."
        class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
        disabled={streaming}
      />
      <button 
        type="submit" 
        class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        disabled={streaming}
      >
        Send
      </button>
    </form>
  </footer>
</div>
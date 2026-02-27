<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Progress } from '$lib/components/ui/progress';
  import ChatMessage from './ChatMessage.svelte';

  /** Chat message type. */
  interface Message {
    readonly role: 'user' | 'assistant';
    content: string;
    readonly sources?: readonly { url: string; title: string }[];
  }

  /** Mode: 'page' for current page Q&A, 'site' for full site RAG. */
  type Mode = 'page' | 'site';

  let mode: Mode = $state('page');
  let question = $state('');
  let messages: Message[] = $state([]);
  let streaming = $state(false);
  let modelLoading = $state(false);
  let modelProgress = $state(0);
  let port: chrome.runtime.Port | null = $state(null);

  /** Initialize the streaming port. */
  function connectPort(): chrome.runtime.Port {
    if (port) return port;

    const newPort = chrome.runtime.connect({ name: 'llm-stream' });

    newPort.onMessage.addListener((msg: { type: string; token?: string; error?: string }) => {
      if (msg.type === 'token' && msg.token) {
        // Append token to the last assistant message
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content += msg.token;
        }
      }
      if (msg.type === 'done') {
        streaming = false;
      }
      if (msg.type === 'error') {
        streaming = false;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content += `\n[Error: ${msg.error}]`;
        }
      }
    });

    port = newPort;
    return newPort;
  }

  /** Send a question to the LLM. */
  async function ask(): Promise<void> {
    const trimmed = question.trim();
    if (!trimmed || streaming) return;

    // Add user message
    messages = [...messages, { role: 'user', content: trimmed }];

    // Add empty assistant message for streaming
    messages = [...messages, { role: 'assistant', content: '' }];

    question = '';
    streaming = true;

    const activePort = connectPort();

    if (mode === 'page') {
      // Request page content from content script, then send to LLM
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'extract-content' });
          activePort.postMessage({
            type: 'query',
            question: trimmed,
            mode: 'page',
            pageContent: response?.markdown ?? '',
          });
        }
      } catch {
        activePort.postMessage({
          type: 'query',
          question: trimmed,
          mode: 'page',
          pageContent: '',
        });
      }
    } else {
      activePort.postMessage({
        type: 'query',
        question: trimmed,
        mode: 'site',
      });
    }
  }

  /** Handle Enter key in input. */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ask();
    }
  }
</script>

<main class="flex flex-col h-[600px] w-[400px]">
  <!-- Header -->
  <div class="flex items-center justify-between p-3 border-b">
    <h1 class="text-sm font-bold">Converse With This Site</h1>
    <div class="flex gap-1">
      <Button
        variant={mode === 'page' ? 'default' : 'outline'}
        size="sm"
        onclick={() => mode = 'page'}
      >
        {#snippet children()}Page{/snippet}
      </Button>
      <Button
        variant={mode === 'site' ? 'default' : 'outline'}
        size="sm"
        onclick={() => mode = 'site'}
      >
        {#snippet children()}Site{/snippet}
      </Button>
    </div>
  </div>

  <!-- Model loading progress -->
  {#if modelLoading}
    <div class="px-3 py-2">
      <p class="text-xs text-muted-foreground mb-1">Loading model...</p>
      <Progress value={modelProgress} />
    </div>
  {/if}

  <!-- Chat messages -->
  <div class="flex-1 overflow-y-auto p-3">
    {#if messages.length === 0}
      <div class="flex items-center justify-center h-full text-muted-foreground text-sm">
        <p>Ask a question about this {mode === 'page' ? 'page' : 'site'}.</p>
      </div>
    {:else}
      {#each messages as message, i}
        <ChatMessage
          role={message.role}
          content={message.content}
          sources={message.sources}
          streaming={streaming && i === messages.length - 1 && message.role === 'assistant'}
        />
      {/each}
    {/if}
  </div>

  <!-- Input area -->
  <div class="border-t p-3">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={question}
        onkeydown={handleKeyDown}
        placeholder="Ask a question..."
        disabled={streaming}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Button onclick={ask} disabled={streaming || !question.trim()} size="sm">
        {#snippet children()}
          {#if streaming}...{:else}Send{/if}
        {/snippet}
      </Button>
    </div>
  </div>
</main>

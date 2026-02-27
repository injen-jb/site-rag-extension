<script lang="ts">
  import { onMount } from 'svelte';
  import { PopupController, type PopupMode } from './PopupController';
  import type { PortMessage } from '@/background/MessageRouter';

  type PortLike = {
    postMessage: (message: unknown) => void;
    onMessage: {
      addListener: (listener: (message: unknown) => void) => void;
    };
  };

  let mode: PopupMode = 'page';
  let question = '';
  let response = '';
  let streaming = false;
  let errorMessage = '';

  let controller: PopupController | null = null;

  function syncFromController(): void {
    if (!controller) {
      return;
    }

    mode = controller.mode;
    question = controller.question;
    response = controller.response;
    streaming = controller.streaming;
    errorMessage = controller.errorMessage;
  }

  function ask(): void {
    if (!controller) {
      return;
    }

    controller.setQuestion(question);
    controller.ask();
    syncFromController();
  }

  function setMode(nextMode: PopupMode): void {
    if (!controller) {
      return;
    }

    controller.setMode(nextMode);
    syncFromController();
  }

  onMount(() => {
    let port: PortLike | null = null;

    if (typeof chrome !== 'undefined' && chrome.runtime?.connect) {
      port = chrome.runtime.connect({ name: 'llm-stream' }) as unknown as PortLike;
    }

    if (!port) {
      return;
    }

    controller = new PopupController({
      postMessage: (message) => port?.postMessage(message),
    });

    port.onMessage.addListener((message: unknown) => {
      if (!controller || typeof message !== 'object' || message === null) {
        return;
      }

      controller.handleIncoming(message as PortMessage);
      syncFromController();
    });

    syncFromController();
  });
</script>

<main class="popup">
  <header class="hero">
    <h1>Converse With This Site</h1>
    <p>Private, local-first website Q&A.</p>
  </header>

  <section class="mode-row">
    <button class:active={mode === 'page'} on:click={() => setMode('page')} type="button">Page</button>
    <button class:active={mode === 'site'} on:click={() => setMode('site')} type="button">Site</button>
  </section>

  <section class="chat-card">
    <label for="question">Ask a question</label>
    <textarea
      id="question"
      bind:value={question}
      placeholder={mode === 'page' ? 'What is this page about?' : 'Ask about the full site index...'}
      rows="4"
    ></textarea>

    <button class="send" on:click={ask} type="button" disabled={streaming || question.trim().length === 0}>
      {streaming ? 'Streaming…' : 'Send'}
    </button>

    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}

    <div class="response">
      <div class="response-header">Response</div>
      <div class="response-body">{response}{#if streaming}<span class="cursor">▋</span>{/if}</div>
    </div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
    background: radial-gradient(circle at top, #f7f7ec, #efe9da 55%, #e7dfcf);
    color: #24211d;
  }

  .popup {
    width: 360px;
    min-height: 500px;
    padding: 16px;
    display: grid;
    gap: 14px;
  }

  .hero {
    padding: 12px;
    border: 1px solid #c8bda7;
    border-radius: 14px;
    background: linear-gradient(140deg, #fefcf6, #f4ecd9);
  }

  .hero h1 {
    margin: 0 0 4px;
    font-size: 1.15rem;
  }

  .hero p {
    margin: 0;
    font-size: 0.84rem;
    color: #4e4a40;
  }

  .mode-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .mode-row button {
    border: 1px solid #b5a98f;
    background: #f9f5ea;
    border-radius: 999px;
    padding: 8px 10px;
    font-weight: 600;
    cursor: pointer;
  }

  .mode-row button.active {
    background: #2f6a50;
    color: #f2f5ef;
    border-color: #2f6a50;
  }

  .chat-card {
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid #c9bea6;
    background: #fcf9f0;
  }

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #4f4a3f;
  }

  textarea {
    resize: vertical;
    min-height: 88px;
    border-radius: 10px;
    border: 1px solid #c7baa1;
    padding: 10px;
    font: inherit;
  }

  .send {
    border: none;
    border-radius: 10px;
    padding: 10px;
    background: #de8c41;
    color: #191611;
    font-weight: 700;
    cursor: pointer;
  }

  .send:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .error {
    margin: 0;
    color: #9e2e2e;
    font-size: 0.8rem;
  }

  .response {
    border: 1px solid #cfc3ab;
    border-radius: 10px;
    background: #fffdf8;
    min-height: 140px;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .response-header {
    border-bottom: 1px solid #dfd5c2;
    padding: 8px 10px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #5e5748;
  }

  .response-body {
    padding: 10px;
    font-size: 0.86rem;
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .cursor {
    animation: pulse 1s infinite;
    display: inline-block;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }
</style>

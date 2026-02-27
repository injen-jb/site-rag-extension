# Converse With This Site — Chrome Extension

## Project Specs & Architecture for Claude Code

---

## 🎯 Project Goal

Build a Chrome extension (Manifest V3) that lets users **chat with any website** — either the current page or the entire site — using **100% in-browser AI inference**. No API keys, no servers, no external dependencies after first model load.

---

## 🧠 Core Innovation

Everything runs locally in the browser:

- **LFM2 by Liquid AI** (1.2B, q4 quantized) via `@huggingface/transformers` + WebGPU for LLM inference
- **MiniLM or similar** small embedding model via `@huggingface/transformers` + WebGPU for RAG embeddings
- **IndexedDB** for persisting embeddings between sessions
- **Zero calls** to Anthropic, OpenAI, or any external LLM API

This has never been done cleanly in a Chrome extension before. The USP is the fully self-contained, offline-capable, private-by-default experience.

---

## 🗂️ Project Structure

```
extension/
├── manifest.json
├── src/
│   │
│   ├── core/                          # 🔒 Pure interfaces & business logic. Never import from providers/.
│   │   ├── interfaces/
│   │   │   ├── LLMProvider.ts         # interface LLMProvider, StreamHandler, GenerateOptions
│   │   │   ├── EmbeddingProvider.ts   # interface EmbeddingProvider, EmbeddingResult
│   │   │   ├── VectorStore.ts         # interface VectorStore, SearchResult, ChunkRecord
│   │   │   └── Crawler.ts             # interface Crawler, CrawlOptions, CrawlResult
│   │   ├── errors/
│   │   │   └── index.ts               # ModelLoadError, CrawlError, EmbeddingError, ProviderError
│   │   ├── rag/
│   │   │   ├── RAGPipeline.ts         # class RAGPipeline — injected EmbeddingProvider + VectorStore
│   │   │   ├── Chunker.ts             # class Chunker — token-aware splitting, overlap
│   │   │   └── PromptBuilder.ts       # class PromptBuilder — formats context + question for any LLM
│   │   └── extraction/
│   │       ├── DOMExtractor.ts        # class DOMExtractor — strips noise, extracts main content
│   │       └── HTMLToMarkdown.ts      # class HTMLToMarkdown — Turndown wrapper, configurable rules
│   │
│   ├── providers/                     # 🔌 Swappable implementations of core interfaces
│   │   ├── llm/
│   │   │   ├── LFM2WebGPUProvider.ts  # class LFM2WebGPUProvider implements LLMProvider
│   │   │   ├── ClaudeSDKProvider.ts   # class ClaudeSDKProvider implements LLMProvider
│   │   │   └── index.ts               # createLLMProvider(config) factory — selects implementation
│   │   ├── embedding/
│   │   │   ├── TransformersEmbeddingProvider.ts  # class ... implements EmbeddingProvider (WebGPU)
│   │   │   ├── OpenAIEmbeddingProvider.ts         # class ... implements EmbeddingProvider (API)
│   │   │   └── index.ts               # createEmbeddingProvider(config) factory
│   │   ├── vectorstore/
│   │   │   ├── InMemoryVectorStore.ts # class ... implements VectorStore (ephemeral)
│   │   │   ├── IndexedDBVectorStore.ts# class ... implements VectorStore (persistent)
│   │   │   └── index.ts               # createVectorStore(config) factory
│   │   └── crawler/
│   │       ├── SitemapCrawler.ts      # class SitemapCrawler implements Crawler
│   │       └── index.ts               # createCrawler(config) factory
│   │
│   ├── background/
│   │   ├── background.ts              # Service worker entry: wires providers, registers ports
│   │   └── MessageRouter.ts           # class MessageRouter — typed message bus (popup ↔ workers)
│   │
│   ├── content/
│   │   └── content.ts                 # Injected script: uses DOMExtractor, sends markdown to bg
│   │
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.svelte               # Chat UI: mode toggle, streaming, citations
│   │
│   ├── options/
│   │   ├── options.html
│   │   └── options.svelte             # Provider config, model selection, cache management
│   │
│   ├── workers/
│   │   ├── llm.worker.ts              # Thin worker shell: instantiates LFM2WebGPUProvider
│   │   ├── embedder.worker.ts         # Thin worker shell: instantiates TransformersEmbeddingProvider
│   │   └── crawler.worker.ts          # Thin worker shell: instantiates SitemapCrawler
│   │
│   └── config/
│       └── providers.config.ts        # ← THE ONE FILE TO EDIT when swapping providers
│
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 🔄 Mode 1 — Current Page Q&A

**Flow:**

```
User question in popup
  → content.ts: capture document.body (prefer <main>, <article>)
  → html2md.ts: strip nav/ads/scripts → clean Markdown
  → background.ts: build prompt (markdown + question)
  → llm.worker.ts: LFM2 inference via WebGPU → stream tokens
  → popup.tsx: render streamed response
```

**Key details:**

- Content script grabs DOM snapshot, strips `nav`, `footer`, `header`, `script`, `style`, `aside`
- Use `Turndown` + `turndown-plugin-gfm` for HTML → Markdown conversion
- Pass markdown + user question directly into LFM2 context window (fits for most pages)
- For very long pages, fall back to a quick embed + retrieve before passing to LFM2

---

## 🕸️ Mode 2 — Full Site RAG

**Flow:**

```
User switches to "Site" mode
  → background.ts: check for /sitemap.xml (or /sitemap_index.xml)
  → crawler.worker.ts:
      parse sitemap → extract URLs
      BFS crawl: max k=50 pages, depth d=3
      each page: fetch HTML → html2md.ts → Markdown
  → embedder.worker.ts:
      chunk each markdown (512 tokens, 64 overlap)
      embed each chunk → float32[] vector
      store: { chunk, embedding, url, title, timestamp }
  → vectorStore.ts: persist to IndexedDB keyed by domain
  
User asks a question:
  → embed question → cosine similarity search → top-5 chunks
  → rag.ts: build prompt with context + question + source URLs
  → llm.worker.ts: LFM2 inference → stream answer with citations
```

**Crawl parameters (user-configurable in options):**

- `k` = max pages (default: 50)
- `d` = max depth (default: 3)
- Respect `<changefreq>` and `<lastmod>` in sitemap for smart re-crawling
- Cache embeddings in IndexedDB, re-use on revisit (check if sitemap lastmod changed)

---

## 🤖 AI Stack

### LLM — Liquid AI LFM2

```typescript
import { pipeline } from '@huggingface/transformers';

const llm = await pipeline('text-generation', 'LiquidAI/LFM2-1.2B', {
  device: 'webgpu',
  dtype: 'q4',  // ~600MB download, cached after first use
});

// Streaming
const stream = await llm(messages, {
  max_new_tokens: 512,
  do_sample: true,
  temperature: 0.3,
  streamer: tokenCallback,  // stream tokens to popup via port
});
```

**Why LFM2:**

- Specifically designed for on-device / edge deployment
- 2x faster than Qwen3 at same size
- Official ONNX exports available: `LiquidAI/LFM2.5-1.2B-Thinking-ONNX`
- Already supported in `transformers.js`
- Has a **reasoning variant** (Thinking) for better RAG answers
- VLM variant available if screenshot/image analysis ever needed: `LFM2.5-VL-1.6B`

**Alternative if LFM2 not yet available as transformers.js pipeline:**

- Fall back to direct ONNX Runtime Web: `LiquidAI/LFM2.5-1.2B-Thinking-ONNX` (q4 recommended)
- Or use `Qwen2.5-0.5B-Instruct` as a fallback (already confirmed working in transformers.js + WebGPU)

### Embeddings

```typescript
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
  device: 'webgpu',
  dtype: 'q8',  // ~23MB
});
```

---

---

## 🏛️ Provider Abstraction Architecture

### The Golden Rule
>
> `src/core/` never imports from `src/providers/`. Dependencies always flow inward: providers depend on interfaces, never the reverse.

### Core Interfaces

```typescript
// src/core/interfaces/LLMProvider.ts

/** Options controlling text generation behavior. */
export interface GenerateOptions {
  readonly maxNewTokens?: number;
  readonly temperature?: number;
  readonly doSample?: boolean;
}

/** Callback invoked for each streamed token during generation. */
export type StreamHandler = (token: string) => void;

/** Contract that every LLM backend must satisfy. */
export interface LLMProvider {
  /** Human-readable provider name for logging and UI display. */
  readonly name: string;

  /** Load model into memory. Must be called before generate(). */
  initialize(): Promise<void>;

  /** Returns true if this provider can run in the current environment. */
  isAvailable(): Promise<boolean>;

  /** Generate a full response (non-streaming). */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /** Stream tokens to handler as they are produced. */
  stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void>;

  /** Release GPU/memory resources. */
  dispose(): void;
}
```

```typescript
// src/core/interfaces/EmbeddingProvider.ts

export interface EmbeddingResult {
  readonly vector: Float32Array;
  readonly dimensions: number;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  dispose(): void;
}
```

```typescript
// src/core/interfaces/VectorStore.ts

export interface ChunkRecord {
  readonly id: string;
  readonly text: string;
  readonly embedding: Float32Array;
  readonly url: string;
  readonly title: string;
  readonly crawledAt: number;
}

export interface SearchResult {
  readonly chunk: ChunkRecord;
  readonly score: number;
}

export interface VectorStore {
  upsert(record: ChunkRecord): Promise<void>;
  upsertBatch(records: ChunkRecord[]): Promise<void>;
  search(queryEmbedding: Float32Array, topK: number): Promise<SearchResult[]>;
  deleteByDomain(hostname: string): Promise<void>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
```

### Swapping Providers — One File

```typescript
// src/config/providers.config.ts
// ← The ONLY file that changes when switching inference backends.

import { LFM2WebGPUProvider } from '@/providers/llm/LFM2WebGPUProvider';
import { ClaudeSDKProvider } from '@/providers/llm/ClaudeSDKProvider';
import { TransformersEmbeddingProvider } from '@/providers/embedding/TransformersEmbeddingProvider';
import { IndexedDBVectorStore } from '@/providers/vectorstore/IndexedDBVectorStore';
import { SitemapCrawler } from '@/providers/crawler/SitemapCrawler';
import type { LLMProvider, EmbeddingProvider, VectorStore, Crawler } from '@/core/interfaces';

export interface ProviderConfig {
  readonly llm: LLMProvider;
  readonly embedding: EmbeddingProvider;
  readonly vectorStore: VectorStore;
  readonly crawler: Crawler;
}

/** Active provider configuration. Swap implementations here. */
export const providers: ProviderConfig = {
  llm: new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' }),
  // llm: new ClaudeSDKProvider({ model: 'claude-sonnet-4-5', apiKey: '' }),  // ← one line swap
  embedding: new TransformersEmbeddingProvider({ modelId: 'Xenova/all-MiniLM-L6-v2' }),
  vectorStore: new IndexedDBVectorStore({ dbName: 'converse-with-site' }),
  crawler: new SitemapCrawler({ maxPages: 50, maxDepth: 3 }),
};
```

### Concrete Implementation Example

```typescript
// src/providers/llm/LFM2WebGPUProvider.ts

import type { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';
import { ModelLoadError } from '@/core/errors';

interface LFM2Config {
  readonly modelId: string;
  readonly dtype: 'fp32' | 'fp16' | 'q8' | 'q4';
}

/**
 * In-browser LLM inference using Liquid AI's LFM2 model via WebGPU.
 * Requires `wasm-unsafe-eval` CSP and a WebGPU-capable browser.
 */
export class LFM2WebGPUProvider implements LLMProvider {
  public readonly name = 'LFM2 (WebGPU)';
  private pipeline: unknown = null;
  private readonly config: LFM2Config;

  constructor(config: LFM2Config) {
    this.config = config;
  }

  public async isAvailable(): Promise<boolean> {
    return 'gpu' in navigator;
  }

  public async initialize(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) throw new ModelLoadError('WebGPU is not available in this browser.');
    const { pipeline } = await import('@huggingface/transformers');
    this.pipeline = await pipeline('text-generation', this.config.modelId, {
      device: 'webgpu',
      dtype: this.config.dtype,
    });
  }

  public async stream(prompt: string, handler: StreamHandler, options?: GenerateOptions): Promise<void> {
    // ... streaming implementation
  }

  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    // ... full generation implementation
  }

  public dispose(): void {
    this.pipeline = null;
  }
}
```

---

## 🎯 Code Quality Standards

All code in this project must follow these standards without exception.

### TypeScript Configuration

```json
// tsconfig.json — strict mode, no escape hatches
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Rules

- **No `any`** — use `unknown` and narrow with type guards
- **`readonly` by default** — mutate only when intentional and documented
- **`private` by default** — expose only what consumers need
- **Interfaces for contracts** — `interface` for anything that could have multiple implementations
- **Abstract classes for shared behavior** — `abstract class BaseProvider` for common init/dispose logic
- **Named errors** — never `throw new Error('...')`, always a typed subclass from `src/core/errors/`
- **Full JSDoc on all public APIs** — every public method and interface property must have a `/** */` comment
- **No implicit returns** — every code path must explicitly return or throw
- **Pure functions in `core/`** — no side effects, no I/O, easily unit-testable
- **Dependency injection everywhere** — no `new ConcreteClass()` inside business logic; receive via constructor

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Interface | PascalCase, no `I` prefix | `LLMProvider` |
| Class | PascalCase | `LFM2WebGPUProvider` |
| Private field | camelCase with `private readonly` | `private readonly config` |
| Method | camelCase, verb-first | `embedBatch()`, `deleteByDomain()` |
| Type alias | PascalCase | `StreamHandler` |
| Constant | UPPER_SNAKE_CASE | `DEFAULT_CHUNK_SIZE` |
| File | PascalCase for classes, camelCase for utils | `LFM2WebGPUProvider.ts` |

---

## 🔌 Chrome Extension Specifics

### Manifest (key parts)

```json
{
  "manifest_version": 3,
  "permissions": ["activeTab", "storage", "scripting"],
  "host_permissions": ["<all_urls>"],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  },
  "background": { "service_worker": "dist/background.js" },
  "action": { "default_popup": "popup.html" },
  "web_accessible_resources": [{
    "resources": ["dist/workers/*.js"],
    "matches": ["<all_urls>"]
  }]
}
```

**Critical: `wasm-unsafe-eval` is required** for ONNX/WASM inference in MV3.

### Worker Communication (streaming)

Use `chrome.runtime.connect()` (long-lived port) for streaming, NOT `sendMessage` (one-shot):

```typescript
// popup.tsx — open port for streaming
const port = chrome.runtime.connect({ name: 'llm-stream' });
port.onMessage.addListener((msg) => {
  if (msg.type === 'token') appendToken(msg.token);
  if (msg.type === 'done') setStreaming(false);
});
port.postMessage({ type: 'query', question, mode });

// background.ts — relay tokens from worker to popup
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'llm-stream') {
    port.onMessage.addListener(async (msg) => {
      // spawn LLM worker, pipe tokens back through port
    });
  }
});
```

### Workers must be declared as web-accessible

Worker files need `chrome.runtime.getURL('dist/workers/llm.worker.js')` to load correctly from content scripts or the popup.

### IndexedDB for embedding persistence

Use `idb` library (tiny wrapper) to store embeddings per domain:

- Key: `embeddings:{hostname}`
- Value: `{ chunks: ChunkWithEmbedding[], crawledAt: timestamp, sitemapLastmod: string }`

---

## 📦 Tech Stack & Dependencies

| Package | Purpose |
|---|---|
| `@huggingface/transformers` | LFM2 + embeddings, WebGPU backend |
| `turndown` + `turndown-plugin-gfm` | HTML → Markdown |
| `idb` | IndexedDB wrapper for embedding persistence |
| `vite` + `vite-plugin-web-extension` | Build system, multi-entry, worker bundling |
| `svelte` + `@sveltejs/vite-plugin-svelte` | Popup & options UI — compiles to vanilla JS, zero runtime |
| `shadcn-svelte` | Design system — port of shadcn/ui for Svelte |
| `tailwindcss` | Required by shadcn-svelte for utility classes |
| `typescript` | Type safety |

**No LangChain, no Supabase, no OpenAI SDK** — fully self-contained.

---

## ⚠️ Key Challenges & Solutions

| Challenge | Solution |
|---|---|
| MV3 blocks WASM eval | Add `wasm-unsafe-eval` to CSP in manifest |
| WebGPU not available everywhere | Graceful fallback to WASM/CPU (slower but works) |
| Model first-load (~600MB) | Show progress bar, cache in browser after first download |
| Workers in MV3 | Use `chrome.runtime.getURL()` for worker paths; declare in `web_accessible_resources` |
| Streaming to popup | Use `chrome.runtime.connect()` long-lived ports, NOT `sendMessage` |
| CORS on crawled pages | Background service worker fetches (extensions bypass CORS with `host_permissions`) |
| Re-crawling stale content | Store `sitemapLastmod` in IndexedDB, compare on next visit |
| Very large pages (Mode 1) | If markdown > ~3000 tokens, chunk + quick embed + retrieve before LFM2 |

---

## 🎨 UI Stack — Svelte + shadcn-svelte

**Why Svelte:** Compiles to minimal vanilla JS at build time — zero runtime overhead, no virtual DOM, ships the smallest possible bundle. Ideal for a Chrome extension popup where every KB matters.

**Why shadcn-svelte:** Official Svelte port of shadcn/ui. Components are copied into your project (not installed as a black-box dependency), fully customizable, built on `bits-ui` primitives.

### Setup

```bash
npx sv create .   # Svelte + Vite + TypeScript
npx shadcn-svelte@latest init
npx shadcn-svelte@latest add button card input scroll-area separator badge progress
```

### Key shadcn-svelte components to use

| Component | Used for |
|---|---|
| `Card` | Chat message bubbles |
| `Input` | Question input field |
| `Button` | Send, mode toggle, crawl trigger |
| `ScrollArea` | Chat history scroll container |
| `Progress` | Model download + crawl progress |
| `Badge` | Source URL citations, mode indicator |
| `Separator` | UI dividers |
| `Tabs` | Page mode / Site mode switcher |

### Svelte streaming pattern

```svelte
<script lang="ts">
  let response = $state('');
  let streaming = $state(false);

  const port = chrome.runtime.connect({ name: 'llm-stream' });

  port.onMessage.addListener((msg) => {
    if (msg.type === 'token') response += msg.token;
    if (msg.type === 'done') streaming = false;
  });

  function ask() {
    response = '';
    streaming = true;
    port.postMessage({ type: 'query', question, mode });
  }
</script>

{#if streaming}
  <span class="animate-pulse">▋</span>
{/if}
```

---

## 🔬 Competitive Landscape (for context)

Existing similar extensions:

- **Site RAG** — closest match but requires Supabase + OpenAI key externally
- **Lumos** — RAG in browser but requires local Ollama server
- **PageChat** — page Q&A only, OpenAI API required

**Our unique position:** Fully self-contained, no external services, offline after first model load, 100% private.

---

## 🧪 Testing Strategy & TDD Mandate

### The Law
>
> **No implementation file may be written before its test file exists and fails.**
> Red → Green → Refactor. No exceptions.

### Test Stack

| Tool | Purpose |
|---|---|
| `vitest` | Unit + contract tests (runs in Node, no browser needed) |
| `@vitest/coverage-v8` | Coverage reporting |
| `playwright` + `@playwright/test` | Extension E2E tests in real Chromium |
| `vite-plugin-web-extension` test mode | Loads unpacked extension for Playwright |

```bash
pnpm test          # unit + contract (watch mode)
pnpm test:coverage # coverage report
pnpm test:e2e      # Playwright E2E (slow, runs in CI)
```

---

### Layer 1 — Unit Tests (`src/core/`)

Pure logic, zero browser APIs, zero Chrome APIs, instant feedback.
Every class in `src/core/` must have a corresponding `.test.ts` file.

```
src/core/rag/RAGPipeline.test.ts
src/core/rag/Chunker.test.ts
src/core/rag/PromptBuilder.test.ts
src/core/extraction/DOMExtractor.test.ts
src/core/extraction/HTMLToMarkdown.test.ts
```

Dependency injection makes this trivial — inject mocks, test pure behavior:

```typescript
// src/core/rag/RAGPipeline.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RAGPipeline } from './RAGPipeline';
import { MockEmbeddingProvider } from '@/test/mocks/MockEmbeddingProvider';
import { MockVectorStore } from '@/test/mocks/MockVectorStore';

describe('RAGPipeline', () => {
  let pipeline: RAGPipeline;

  beforeEach(() => {
    pipeline = new RAGPipeline(
      new MockEmbeddingProvider(),
      new MockVectorStore()
    );
  });

  it('retrieves top-k chunks ordered by similarity score', async () => {
    // arrange: seed MockVectorStore with known chunks + embeddings
    // act: pipeline.retrieve('what is X?', { topK: 3 })
    // assert: returns 3 results, ordered descending by score
  });

  it('builds prompt containing all retrieved chunk texts', async () => { ... });
  it('throws EmbeddingError when embedding provider fails', async () => { ... });
});
```

---

### Layer 2 — Provider Contract Tests

This is the **critical layer** that guarantees swappability.

A shared contract test suite defines the behavior that *every* `LLMProvider` implementation must satisfy. Run it against each concrete provider — they must all pass identically.

```typescript
// src/test/contracts/LLMProviderContract.ts

import { describe, it, expect } from 'vitest';
import type { LLMProvider } from '@/core/interfaces/LLMProvider';

/**
 * Shared contract test suite for LLMProvider implementations.
 * Import and call this in every provider's test file.
 *
 * @param createProvider - Factory returning a fresh provider instance
 */
export function runLLMProviderContractTests(
  createProvider: () => LLMProvider
): void {
  describe('LLMProvider contract', () => {
    it('exposes a non-empty name', () => {
      const provider = createProvider();
      expect(provider.name).toBeTruthy();
    });

    it('initialize() resolves without throwing when available', async () => {
      const provider = createProvider();
      await expect(provider.initialize()).resolves.not.toThrow();
    });

    it('generate() returns a non-empty string', async () => {
      const provider = createProvider();
      await provider.initialize();
      const result = await provider.generate('Say hello.');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('stream() calls handler at least once with token content', async () => {
      const provider = createProvider();
      await provider.initialize();
      const tokens: string[] = [];
      await provider.stream('Say hello.', (token) => tokens.push(token));
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('dispose() can be called without throwing', () => {
      const provider = createProvider();
      expect(() => provider.dispose()).not.toThrow();
    });
  });
}
```

Each provider test file simply runs the contract + its own specific tests:

```typescript
// src/providers/llm/ClaudeSDKProvider.test.ts
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';
import { ClaudeSDKProvider } from './ClaudeSDKProvider';

// Runs the full shared contract
runLLMProviderContractTests(() =>
  new ClaudeSDKProvider({ model: 'claude-haiku-4-5-20251001', apiKey: 'test-key' })
);

// Provider-specific tests
describe('ClaudeSDKProvider', () => {
  it('passes apiKey in Authorization header', async () => { ... });
  it('throws ProviderError on 401 response', async () => { ... });
});
```

```typescript
// src/providers/llm/LFM2WebGPUProvider.test.ts
import { runLLMProviderContractTests } from '@/test/contracts/LLMProviderContract';
import { LFM2WebGPUProvider } from './LFM2WebGPUProvider';

runLLMProviderContractTests(() =>
  new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' })
);
```

Same pattern applies to `EmbeddingProvider`, `VectorStore`, and `Crawler`.

---

### Layer 3 — E2E Tests (Playwright)

Full extension loaded in real Chromium. Slow, but provides ground truth.

```typescript
// e2e/mode1-page-qa.test.ts
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test('Mode 1: answers a question about the current page', async () => {
  const extensionPath = path.resolve('dist');
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // navigate to a test page, open popup, ask question, assert streamed response
});
```

---

### Shared Test Mocks

All mocks live in `src/test/mocks/` and implement the same interfaces:

```typescript
// src/test/mocks/MockLLMProvider.ts
import type { LLMProvider, GenerateOptions, StreamHandler } from '@/core/interfaces/LLMProvider';

/** Deterministic mock LLMProvider for unit testing. */
export class MockLLMProvider implements LLMProvider {
  public readonly name = 'Mock LLM';
  public initializeCalled = false;
  public lastPrompt: string | null = null;
  public mockResponse = 'mock response';

  public async isAvailable(): Promise<boolean> { return true; }
  public async initialize(): Promise<void> { this.initializeCalled = true; }

  public async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    this.lastPrompt = prompt;
    return this.mockResponse;
  }

  public async stream(prompt: string, handler: StreamHandler): Promise<void> {
    this.lastPrompt = prompt;
    for (const word of this.mockResponse.split(' ')) {
      handler(word + ' ');
    }
  }

  public dispose(): void {}
}
```

---

### The Build Loop (Mandatory)

For each component, Claude Code must follow this exact sequence:

```
1. Write/update interface in src/core/interfaces/
2. Write contract test (if new provider type) in src/test/contracts/
3. Write unit test → confirm it FAILS (red)
4. Write minimal implementation → confirm test PASSES (green)
5. Refactor if needed → tests still green
6. Move to next component
```

**Coverage targets:**

- `src/core/` → 90%+ line coverage (no excuses, it's pure logic)
- `src/providers/` → 70%+ (provider contract tests cover most of it)
- E2E → at least Mode 1 and Mode 2 happy paths covered

---

## 🚀 Build Order (TDD Loop)

Each step = write failing test first, then implement, then green.

1. **Scaffold** — Vite + vite-plugin-web-extension, TypeScript (strict), Svelte, shadcn-svelte, Vitest, manifest.json
2. **Core interfaces + mocks** — all interfaces in `src/core/interfaces/`, all mocks in `src/test/mocks/`
3. **Contract test suites** — `LLMProviderContract`, `EmbeddingProviderContract`, `VectorStoreContract` (no implementations yet — just the shared test suites)
4. **Core logic** — `DOMExtractor`, `HTMLToMarkdown`, `Chunker`, `PromptBuilder` — test → implement each
5. **RAGPipeline** — test with mocks → implement (proves DI works end to end)
6. **LFM2 provider** — run contract tests → implement `LFM2WebGPUProvider` → green
7. **LLM worker + background** — `MessageRouter`, port streaming
8. **Popup UI** — Svelte + shadcn-svelte chat interface, streaming display
9. **Mode 1 E2E** — Playwright test first → wire content → background → LLM worker → popup
10. **Embedding provider** — contract tests → implement `TransformersEmbeddingProvider`
11. **Vector stores** — contract tests → `InMemoryVectorStore` → `IndexedDBVectorStore`
12. **Crawler** — contract tests → implement `SitemapCrawler`
13. **Mode 2 E2E** — Playwright test first → full RAG conversation
14. **ClaudeSDKProvider** — run existing LLM contract tests → implement → green (proves swap)
15. **Options page** — provider config, model selection, cache management
16. **Polish** — WebGPU fallback, progress indicators, error boundaries

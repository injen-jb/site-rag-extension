# Agentic Coding Experiment - Comparative Report

---

**Challenge**: Build a Chrome Extension (MV3) that lets users chat with any website using 100% in-browser AI inference (WebGPU + transformers.js). No API keys, no servers, offline after first model load.

**Agents evaluated**: Claude Code CLI · Codex CLI · Gemini CLI
**Spec files**: `CLAUDE.md` (Claude) / `SPECIFICATIONS.md` (Codex, Gemini)
**Output directories**: `claude_code_version/` · `codex_version/` · `gemini_version/`

---

## 1. Executive Summary

All three agents produced implementations that share the same high-level architecture — the spec was detailed enough that it imposed a strong structural template.

The differences that matter lie in **completeness**, **specific design decisions**, and **where each agent chose to invest effort**.

No implementation is uniformly superior.

| Dimension | Claude | Codex | Gemini |
|---|---|---|---|
| UI framework | Svelte 5 (Runes) | **Vanilla TypeScript** | Svelte 4 |
| Mode 1 (Page Q&A) | ✅ Implemented | ✅ Implemented | ✅ Implemented |
| Mode 2 (Site RAG) | ✅ Implemented | ✅ Implemented | ❌ Stubbed |
| Worker architecture | ✅ All 3 integrated | ⚠️ Stubbed | ⚠️ LLM only |
| Claude streaming | ⚠️ Simulated | ⚠️ Simulated | ✅ Real SSE |
| Contract tests | ✅ 4 suites | ✅ 4 suites | ✅ 3 suites |
| Fallback providers | ❌ None | ✅ LLM + Embedding | ❌ None |
| IndexedDB in tests | ❌ | ❌ | ✅ (fake-indexeddb) |
| Unique extras | ProgressTracker, AsyncGenerator crawler, ErrorBoundary | FallbackProviders, SiteRAGService, MVC controllers, Coverage report | Real SSE, lucide icons |

---

## 2. Common Ground

Given the detailed spec, all three agents converged on a remarkably similar foundation. These choices were essentially universal:

### 2.1 Identical TypeScript strictness

Every implementation uses the exact same compiler flags from the spec:

```json
"strict": true, "noImplicitAny": true, "noImplicitReturns": true,
"noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true,
"noUnusedLocals": true, "noUnusedParameters": true
```

All use `moduleResolution: "bundler"` and a `@/*` path alias.

### 2.2 Near-identical core interfaces

`LLMProvider`, `EmbeddingProvider`, `VectorStore` are nearly copy-identical across all three — clear evidence that the spec interfaces were taken as authoritative.

The most notable divergence is in the `Crawler` interface (see §4.4).

### 2.3 Same tech stack for AI

- `@huggingface/transformers` for WebGPU inference
- `Xenova/all-MiniLM-L6-v2` (384 dims, q8) for embeddings
- `LiquidAI/LFM2-1.2B` (q4) as the primary LLM
- `idb` for IndexedDB persistence
- `turndown` + `turndown-plugin-gfm` for HTML→Markdown
- `vitest` + `@playwright/test` for testing

### 2.4 Shared provider pattern

All three implement the `core/` → `providers/` dependency flow the spec mandates, use factory/config files for provider wiring, and implement the same four provider categories (LLM, Embedding, VectorStore, Crawler).

### 2.5 Contract test pattern

All three implement the spec's "shared contract test suite" pattern — a function like `runLLMProviderContractTests(createProvider)` that verifies interface compliance independent of implementation.

### 2.6 Cosine similarity — O(n) brute force

All three vector stores use the same approach: load all records into memory, compute cosine similarity against the query vector, sort descending. No HNSW or approximation. A reasonable trade-off for a browser context with expected corpus sizes.

### 2.7 Regex-based sitemap parsing

None of the crawlers use a proper XML parser — all rely on `/<loc>(.*?)<\/loc>/g`. Acceptable given the controlled format of sitemap.xml files.

---

## 3. Architecture Overview

### 3.1 Folder structure

The spec prescribed a specific structure. All three follow it closely:

```
                         Claude      Codex       Gemini
core/interfaces/           ✅          ✅          ✅
core/errors/               ✅          ✅          ✅
core/rag/                  ✅          ✅          ✅
core/extraction/           ✅          ✅          ✅
providers/{llm,emb,vs,cr}  ✅          ✅          ✅
background/                ✅          ✅          ✅
content/                   ✅          ✅          ✅
workers/ (3 files)         ✅          ✅ (stub)   ⚠️ (partial)
config/providers.config.ts ✅          ✅          ✅
test/contracts/            ✅          ✅          ✅
test/mocks/                ✅          ✅          ✅
popup/ (Svelte)            ✅          ❌ (TS)     ✅
options/ (Svelte)          ✅          ❌ (TS)     ✅
```

**Notable extras:**

- **Claude** adds: `core/capabilities.ts` (feature detection), `core/ProgressTracker.ts`, `lib/` (full shadcn/bits-ui component library), `src/popup/ChatMessage.svelte`, `src/popup/ErrorBoundary.svelte`
- **Codex** adds: `background/SiteRAGService.ts` (dedicated orchestration layer), `popup/PopupController.ts`, `options/OptionsController.ts`, `providers/llm/FallbackLLMProvider.ts`, `providers/embedding/FallbackEmbeddingProvider.ts`, `test/scaffold/`
- **Gemini** stays closest to the minimal spec structure

---

## 4. Detailed Comparison by Dimension

### 4.1 UI Framework

**Claude - Svelte 5 (Runes reactive system)**

Uses `$state()` runes (Svelte 5's new primitives), a proper component hierarchy (`App.svelte`, `ChatMessage.svelte`), and a real component library (`lib/components/ui/`) adapted from bits-ui/shadcn. The popup stores full chat history as a `Message[]` array, rendering past exchanges. The options page includes storage estimation and API key input.

**Codex - Vanilla TypeScript (significant spec deviation)**

Chose not to use Svelte at all. Instead the UI is built with `innerHTML` string injection and `PopupController`/`OptionsController` classes that manage DOM state via an MVC-like pattern. This is the most significant deviation from the spec (which explicitly mandates Svelte + shadcn-svelte). The trade-off: eliminates the Svelte build complexity, produces simpler debugging. The downside: verbose DOM manipulation, harder to extend.

**Gemini - Svelte 4**

Uses Svelte 4 (stable, not Runes). Implements `bits-ui` headless components and `lucide-svelte` for icons. The popup is a single `popup.svelte` file with local reactive variables — clean and idiomatic Svelte 4. One missing feature: chat history is replaced on each query (no conversation memory between turns).

**Assessment**: Claude's Svelte 5 choice is forward-looking but Svelte 5 was still very new at time of writing. Gemini's Svelte 4 is safer and production-proven. Codex's vanilla TS is pragmatic but diverges from the spec's UI mandate.

---

### 4.2 Error Hierarchy

All three implement the spec-mandated error types. The structures differ slightly:

**Claude**

```typescript
class ExtensionError extends Error { code: string }
class ModelLoadError extends ExtensionError    // + no extra fields
class CrawlError extends ExtensionError        // + url: string
class EmbeddingError extends ExtensionError
class ProviderError extends ExtensionError     // + provider: string
```

Most informative — errors carry contextual fields (`url`, `provider`) enabling precise logging and recovery.

**Codex**

```typescript
abstract class BaseDomainError extends Error   // sets name property
class ModelLoadError extends BaseDomainError
class CrawlError extends BaseDomainError
class EmbeddingError extends BaseDomainError
class ProviderError extends BaseDomainError
```

Uses `abstract` base class, which prevents accidental instantiation of the base type. No extra context fields.

**Gemini**

```typescript
abstract class ExtensionError extends Error
class ModelLoadError extends ExtensionError
class CrawlError extends ExtensionError
class EmbeddingError extends ExtensionError
class ProviderError extends ExtensionError
```

Same shape as Codex (abstract base), same name as Claude's non-abstract version. No extra context fields.

**Assessment**:

Claude's variant is marginally more useful for production debugging because errors carry contextual data. All three are functionally correct.

---

### 4.3 RAG Pipeline

All three implement the same logical pipeline: `ingest(page)` → chunk → embed → store, and `retrieve(query)` → embed query → cosine search → top-K results.

Key differences:

**Chunker algorithm**:

All three use word-based tokenization (not subword) as a proxy for token count — a pragmatic approximation that matches the spec examples. The sliding-window overlap logic is identical.

**PromptBuilder**:

All three generate two prompt variants (page mode and RAG/site mode with `[Source N]` citations). The exact phrasing differs but the structure matches the spec.

**RAGPipeline integration level**:

- Claude and Codex wire the RAGPipeline into the background service worker for Mode 2.
- Gemini's `RAGPipeline` is fully implemented as a class but the `MessageRouter` returns `"Site mode not implemented yet"` for site queries — the pipeline exists but is not connected to the message path.

---

### 4.4 Crawler Interface — A Real Design Difference

This is the sharpest architectural divergence across the three implementations:

**Claude** — `AsyncGenerator<CrawlResult>`

```typescript
interface Crawler {
  crawl(baseUrl: string, options?: CrawlOptions): AsyncGenerator<CrawlResult>;
  abort(): void;
}
```

Streaming crawl: results are yielded page-by-page as they arrive. This enables progressive UI updates (e.g., "crawling page 12 of 50") and allows the embedding pipeline to start processing early pages while later pages are still being fetched.

The `abort()` method enables cooperative cancellation.

**Codex & Gemini** — `Promise<CrawlResult[]>`

```typescript
interface Crawler {
  crawl(rootUrl: string, options?: CrawlOptions): Promise<CrawlResult[]>;
}
```

Batch crawl: all pages are fetched before returning. Simpler to consume but requires the full crawl to complete before any embedding can start.

**Assessment**:

Claude's AsyncGenerator design is architecturally superior for this use case — it enables pipeline parallelism and gives users progressive feedback. The `abort()` method is also practically necessary for a 50-page crawl triggered from a browser popup. However, it requires more sophisticated consumption code in the background worker.

---

### 4.5 Claude API Streaming — Simulated vs. Real

The spec calls for streaming tokens. The Claude SDK provider is a fallback for when WebGPU isn't available:

**Claude & Codex** — Simulated streaming

```typescript
// Fetch full response, then split into words and emit one by one
const words = fullResponse.split(' ');
for (const word of words) handler(word + ' ');
```

This gives the visual appearance of streaming but fires all tokens near-simultaneously after a single HTTP round-trip. Latency to first token equals total response time.

**Gemini** — Real SSE streaming

```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
// Parse Server-Sent Events: "data: {...}" lines
// Extract delta.text from each event, call handler per token
```

Uses the Anthropic API's native streaming endpoint. True time-to-first-token behavior. Correctly handles `[DONE]` terminators and gracefully ignores parse errors. Requires the `anthropic-dangerous-direct-browser-access: true` header (a real header the Anthropic API accepts for browser-direct calls).

**Assessment**: Gemini's implementation is the most correct for the Claude provider. The simulated approach works but misrepresents what streaming means to the user.

---

### 4.6 Fallback Providers (Codex Unique)

Codex is the only implementation that ships explicit fallback providers for development/testing:

```typescript
// FallbackLLMProvider — always available, returns "Mock answer: [preview]"
// FallbackEmbeddingProvider — 8-dim deterministic hash (same text → same vector)
```

The `IndexedDBVectorStore` also falls back to an in-memory `Map` if IndexedDB is unavailable. This cascade (`WebGPU → Fallback LLM`, `IndexedDB → Map`) means the extension always loads and responds, even in environments without GPU or persistent storage — useful for CI testing and development.

**Assessment**:

A pragmatic engineering choice. The spec doesn't require it but it noticeably improves DX during development. The trade-off is added surface area to maintain.

---

### 4.7 Worker Architecture

The spec calls for three dedicated workers (`llm.worker.ts`, `embedder.worker.ts`, `crawler.worker.ts`) to keep inference off the main thread:

**Claude**

All three workers fully wired

Each worker handles typed messages (`initialize`, `generate`, `stream`, `dispose` for the LLM worker; `init`, `embed`, `embedBatch` for the embedder; `crawl`, `abort` for the crawler). The background service worker communicates with these workers via `postMessage`. Request IDs enable multiplexed concurrent requests.

**Codex**

 Workers present, not integrated

Worker files exist and contain correct implementations, but `background.ts` calls providers directly rather than through workers. The spec's performance goal of keeping inference off the service worker thread is not achieved.

**Gemini**

LLM worker active, others unused

`MessageRouter` creates a new Worker per query using `chrome.runtime.getURL('src/workers/llm.worker.js')`. This means model initialization happens on every query — no caching of the loaded pipeline between requests. The embedder and crawler workers exist but are never used; the background handles embedding and crawling inline.

**Assessment**:

Claude's worker architecture is most aligned with the spec. Creating a new worker per query (Gemini) is resource-intensive and reloads the model on every question. Codex's inline-provider approach is simpler but blocks the service worker during inference.

---

### 4.8 Testing

#### Contract tests (all three)

All three implement the contract test pattern from the spec. Coverage varies:

| Contract | Claude | Codex | Gemini |
|---|---|---|---|
| `LLMProviderContract` | ✅ 6 tests | ✅ 5 tests | ✅ 5 tests |
| `EmbeddingProviderContract` | ✅ 6 tests | ✅ 4 tests | ✅ 5 tests |
| `VectorStoreContract` | ✅ 8 tests | ✅ 5 tests | ✅ 6 tests |
| `CrawlerContract` | ✅ 4 tests | ✅ 2 tests | ❌ Missing |

#### Unit test depth

**Claude**

has the broadest test suite (~130 unit tests). Notable coverage: `MessageRouter`, `ProgressTracker`, `capabilities`, `ErrorBoundary`, all core RAG components, all providers, and the mock implementations themselves.

**Codex**

has visible coverage metrics (`56.69%` statements, `85.71%` functions reported in the coverage HTML). Unique tests: `Scaffold.test.ts` verifies the project structure itself (that key files exist), `PopupController.test.ts` and `OptionsController.test.ts` test UI state machines directly without a browser.

**Gemini**

has fewer tests. Several test files are near-empty stubs (`SitemapCrawler.test.ts` — basic instantiation only; `InMemoryVectorStore.test.ts` — 3 lines). However, Gemini alone uses `fake-indexeddb` to provide a real IndexedDB polyfill in the test environment — enabling `IndexedDBVectorStore` tests that actually exercise the async database code, not just structure.

#### E2E tests (all three)

All three create `e2e/mode1-page-qa.test.ts` and `e2e/mode2-site-rag.test.ts` with Playwright. All three load the extension in a real Chromium instance. The assertions are largely structural (popup loads, mode can be toggled) — none test actual LLM inference in E2E (WebGPU is unavailable in CI headless Chromium, a known constraint the spec acknowledges).

---

### 4.9 Options Page Completeness

| Feature | Claude | Codex | Gemini |
|---|---|---|---|
| LLM provider selection | ✅ | ✅ | ✅ |
| API key input (Claude) | ✅ | ✅ | ❌ Missing |
| Max pages/depth config | ✅ | ✅ | ✅ |
| Storage estimate display | ✅ (real) | ⚠️ (static) | ❌ (hardcoded 0) |
| Clear vector cache | ✅ (works) | ✅ (works) | ❌ (stub/alert) |

---

## 5. Notable Divergences from Spec

### 5.1 Codex drops Svelte entirely

The spec is explicit: "Svelte + shadcn-svelte". Codex builds the UI with vanilla TypeScript and `innerHTML`. This is the most significant deviation from the specification. The code works, but it contradicts a stated architectural decision.

### 5.2 Gemini leaves Mode 2 unimplemented

The `MessageRouter` in Gemini returns `"Site mode not implemented yet"` for site-mode queries. The RAGPipeline, vector store, embedding provider, and crawler are all implemented in isolation — but not connected to the user-facing message path. Mode 2 is the spec's primary feature differentiator.

### 5.3 Claude's Crawler uses AsyncGenerator

Not in the spec's interface definition (which shows `Promise<CrawlResult[]>` in examples), but aligned with the spec's intent to "stream results" and "yield pages." A genuinely better design choice that goes beyond the literal spec.

### 5.4 None implement robots.txt

The spec's `CrawlOptions.respectRobots` appears as a declared field in Claude's interface but is not implemented. Codex and Gemini don't declare it at all. Not a failing — the spec lists it as an option, not a requirement.

### 5.5 shadcn-svelte vs. bits-ui

The spec calls for `shadcn-svelte` specifically. Both Claude and Gemini use `bits-ui` instead (which is the underlying headless component library that shadcn-svelte builds on). The end result is functionally equivalent, but `shadcn-svelte` would copy components into the project for full customization — `bits-ui` installs as a dependency.

---

## 6. Performance & Scalability Considerations

All three share the same fundamental scalability ceiling: O(n) brute-force cosine similarity search. This is appropriate for browser-based RAG with small corpora (a site with 50 pages at 512 tokens/chunk ≈ 200–500 chunks — completely tractable). None introduced unnecessary complexity for a problem that doesn't require it.

The worker architecture (or lack thereof) matters more for perceived performance:

- **Claude**: Heavy inference in dedicated workers → service worker stays responsive
- **Codex**: Inline inference → service worker blocked during generation (bad for MV3 which has short lifecycles)
- **Gemini**: New worker per query → model reloads on every question (significant latency overhead)

---

## 7. Summary Assessment

### Claude Code

**Strengths**:

Most complete implementation. Both modes work end-to-end. The AsyncGenerator crawler is the best design choice in the codebase. Worker architecture is correctly implemented. Svelte 5 Runes is modern. Options page is fully functional. Chat history preserves conversation context.

**Weaknesses**:

Claude provider streaming is simulated. No fallback providers for development without GPU. Some declared features not implemented (maxDepth in crawler, respectRobots).

### Codex

**Strengths**:

Most defensive engineering — fallback providers ensure the extension always loads. Coverage reporting visible. The MVC controller pattern makes UI state testable without a browser. SiteRAGService is a clean orchestration separation. Scaffold test is a novel idea (verifies project structure in CI).

**Weaknesses**:

Drops Svelte entirely (clear spec deviation). Workers not integrated with the actual message flow. Streaming is simulated. Provider initialization happens synchronously at module load (fragile in service workers with short lifecycles).

### Gemini

**Strengths**:

Real SSE streaming for the Claude provider is the most correct implementation of that feature. `fake-indexeddb` enables proper database unit tests. Clean minimal code with good separation. Svelte 4 is stable and production-proven.

**Weaknesses**:

Mode 2 (the main feature) is not connected to the user flow. Only the LLM worker is used; embedding and crawling block the service worker. Options page has non-functional UI elements (clear cache is an `alert()`, vector count is hardcoded to 0). Worker-per-query pattern reloads the model on every message.

---

## 8. Verdict

There is no single winner. The three agents excelled in different areas reflecting different interpretations of quality:

- **Codex** invested in **reliability and developer experience** (fallbacks, coverage, controllers)
- **Claude** invested in **completeness and architecture** (both modes, proper workers, AsyncGenerator)
- **Gemini** invested in **correctness of specific features** (real streaming) while leaving other parts incomplete

The spec was detailed enough to produce structurally similar outputs.

The meaningful differences emerge where the spec was ambiguous or where agents had to make judgment calls under time/complexity constraints.

Gemini's decision to skip Mode 2 integration suggests it deprioritized end-to-end integration in favor of implementing individual components cleanly.

Codex's decision to skip Svelte suggests it optimized for simplicity of the build system.

Claude's decision to implement AsyncGenerator crawling suggests it read the spec's intent rather than just its examples.

## 8. Conclusion

Any of the three codebases could serve as a solid foundation.

Combining **Gemini's real SSE streaming**, **Codex's fallback providers**, and **Claude's worker architecture and AsyncGenerator crawler** would produce the strongest result.

---

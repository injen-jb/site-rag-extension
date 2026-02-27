<center><h1 style="font-size: 3em;">Socratic Specification Process</h1>

<h3><i style="color: white !important" >From loose ideation to strict specification <br>through Socratic dialogue.</i></h3></center>

---

<center><img src="/medias/socrates_header.jpg"></center>

---

## Preamble — The Experiment

This document records the **Socratic dialogue** between a human and Claude (conversational instance) that produced the `SPECIFICATIONS.md` specification file — a structured artifact subsequently handed off to autonomous coding agents (Claude Code, Gemini CLI, Codex CLI) **without any shared conversation history**.

The experiment tests a hypothesis:

> *Can a conversational LLM, acting as a Socratic interlocutor, extract and crystallize a human's implicit intent into a specification precise enough for a separate coding agent to execute autonomously — in one pass — without the specification author present?*

The `SPECIFICATIONS.md` file is the **interface between human intent and machine execution**. This document is the **record of how that interface was forged**.

---

## Methodology — Socratic Specification

The process follows a recognizable pattern:

1. **Seed question** — Human states a vague intent
2. **Clarification** — Claude asks or infers to resolve ambiguity
3. **Research injection** — Claude searches for prior art, constraints, state of the art
4. **Decision crystallization** — Each ambiguity resolves into a concrete spec decision
5. **Iteration** — New requirements surface, spec is updated
6. **Artifact hardening** — Decisions become unambiguous instructions in `SPECIFICATIONS.md`

The key discipline: Claude never writes spec until the human's intent is genuinely understood. Questions precede answers. Research precedes recommendations.

---

## Turn-by-Turn Reconstruction

---

### Turn 1 — Foundation: What is a Chrome Extension?

**Human intent:** Verify basic understanding before building on it.

**Claude's role:** Educator, establishing shared vocabulary.

**Key output:** Standard MV3 structure — `manifest.json`, background service worker, content scripts, popup. The three isolated contexts (Service Worker, Content Script, Popup) and their communication constraint (message passing, not shared memory) were established as the foundational mental model for everything that followed.

**Why it mattered:** The isolation constraint directly shaped the entire worker architecture — LLM inference in a dedicated worker, crawler in another, communicating via typed messages. Getting this right early prevented architectural mistakes downstream.

---

### Turn 2 — Capabilities: Workers, WebGPU, WASM, NPM

**Human intent:** Probe what's actually possible before committing to an approach.

**Claude's role:** Constraint mapper — identifying what works where, with which caveats.

**Key decisions crystallized:**

| Question | Answer | Spec impact |
|---|---|---|
| Web Workers? | ✅ in popup/content, ❌ nested in SW | Dedicated worker files for LLM + embedder |
| WebGPU? | ✅ popup only, ❌ content/SW | LLM inference lives in worker spawned from popup context |
| WASM in MV3? | ✅ with CSP tweak | `wasm-unsafe-eval` added to manifest |
| NPM libs? | ✅ but must bundle | Vite as bundler established |

**Critical insight surfaced:** MV3's strict Content Security Policy blocks WASM eval by default — a non-obvious gotcha that would have caused silent failures. Catching it here vs. at 2am during an autonomous run is the difference between a successful experiment and a frustrating one.

---

### Turn 3 — Concept: The Two-Mode Architecture

**Human intent:** Describe the actual product — "converse with this site."

**Claude's role:** Architect, translating product vision into technical data flows.

**The two modes defined:**

**Mode 1 — Current page Q&A:**

```
DOM snapshot → HTML→Markdown → prompt + question → Claude SDK → streaming response
```

**Mode 2 — Full site RAG:**

```
sitemap.xml → BFS crawl (k pages, d depth) → HTML→Markdown → chunk → embed → IndexedDB
                                    ↓ (on query)
              embed question → cosine similarity → top-k chunks → RAG prompt → streaming response
```

**Key architectural decision made here:** The distinction between ephemeral (Mode 1) and persistent (Mode 2) pipelines — Mode 1 is stateless per query, Mode 2 builds a durable index that survives sessions. This determined the need for IndexedDB and the cache invalidation strategy based on `sitemap.xml` `lastmod`.

**Socratic moment:** Claude did not ask "what tech stack?" — that would have been premature. Instead, the flows were established first, then technology choices followed from the flows. This ordering matters.

---

### Turn 4 — Research: Does This Already Exist?

**Human intent:** Validate novelty before investing effort.

**Claude's role:** Researcher — web search + competitive analysis.

**Findings:**

| Extension | Closest match | Gap |
|---|---|---|
| Site RAG | Sitemap crawl + RAG | Requires Supabase + OpenAI key |
| Lumos | Local RAG | Requires local Ollama server |
| PageChat | Page Q&A | OpenAI API only, no crawl |

**The USP crystallized:** No existing solution is **fully self-contained** — they all require external infrastructure (cloud API, local server, external DB). The gap is a Chrome extension that works with zero setup beyond installation.

**Spec impact:** "No external infrastructure" became a hard constraint, not a nice-to-have. This constraint directly drove the next turn's technological pivot.

---

### Turn 5 — Pivot: Liquid AI LFM2 + Full In-Browser Inference

**Human intent:** "Just saw that Liquid AI released a small LLM for in-browser inference on HuggingFace. This would be killer!"

**Claude's role:** Validator and integrator — research the claim, assess feasibility, update the architecture.

**Research findings:**

- LFM2 family: 350M, 700M, 1.2B, 2.6B — designed for on-device deployment
- LFM2 is officially supported in `transformers.js`
- ONNX exports available with q4 quantization (~600MB for 1.2B)
- A working proof-of-concept (LFM2.5-1.2B-Thinking in-browser via WebGPU) already existed
- `device: 'webgpu'` in `@huggingface/transformers` is the activation mechanism

**The architectural consequence:** Replacing Claude SDK (the original assumed backend) with LFM2 WebGPU **collapsed the entire "no external infra" requirement into a single npm package**. No API key. No server. No signup. Offline after first model download.

**Updated comparison:**

| Feature | Site RAG | Lumos | PageChat | This project |
|---|---|---|---|---|
| External infra needed | Supabase | Ollama server | OpenAI | **None** |
| In-browser embeddings | ❌ | ❌ | ❌ | **✅ Granite/ONNX** |
| Offline capable | ❌ | ❌ | ❌ | **✅** |

**This was the pivotal turn.** The product went from "another RAG extension with a different LLM" to "the first genuinely self-contained browser-native RAG extension." The USP became real.

---

### Turn 6 — UI Stack Decision

**Human intent:** "UI engine: pure JS, no framework (unless you know something basic and efficient). Design system: shadcn."

**Claude's role:** Advisor — flag a compatibility constraint before the human commits.

**The constraint surfaced:** shadcn is React-first. Pure JS + shadcn components is technically possible but ergonomically painful. The community port `shadcn-svelte` resolves this cleanly.

**The Socratic move:** Rather than just recommend Svelte, Claude presented the options explicitly and asked. The human chose.

**Options presented:**

1. Svelte + shadcn-svelte ← *chosen*
2. Pure JS + shadcn CSS/tokens only
3. Pure JS, no design system

**Why Svelte fits:** Compiles to minimal vanilla JS at build time — zero runtime, no virtual DOM, smallest possible bundle. For a Chrome extension popup where every KB matters, this is the right tradeoff. Functionally equivalent to "plain JS with a component model."

**Spec impact:** `.svelte` files, `@sveltejs/vite-plugin-svelte`, `shadcn-svelte` init command, specific component list (`Card`, `Input`, `Button`, `ScrollArea`, `Progress`, `Badge`, `Tabs`) all entered the spec.

---

### Turn 7 — Provider Abstraction & Code Quality

**Human intent:** "Make it sufficiently modular so I could easily swap in-browser LLM with Claude SDK. Modern TS/JS, classes, interfaces, typing, documentation. Stylistically perfect in terms of code quality."

**Claude's role:** Architect — apply dependency inversion principle, define the modularity contract.

**The core insight articulated:**

> The RAG pipeline, the chat orchestrator, the popup UI — none of them should know or care *how* inference is done. They talk to **interfaces**. Concrete implementations are injected at startup and fully swappable.

**Architecture established:**

```
src/core/          ← interfaces, pure logic (no concrete deps, ever)
src/providers/     ← swappable implementations
src/config/        ← providers.config.ts: the ONE file to edit when swapping
```

**The dependency rule:** `src/core/` never imports from `src/providers/`. This is enforced as a hard architectural rule, not a convention.

**Key interfaces defined:**

- `LLMProvider` — `generate()`, `stream()`, `isAvailable()`, `dispose()`
- `EmbeddingProvider` — `embed()`, `embedBatch()`, `dimensions`
- `VectorStore` — `upsert()`, `search()`, `deleteByDomain()`
- `Crawler` — `crawl()`, `CrawlOptions`, `CrawlResult`

**The one-line swap demonstrated:**

```typescript
// providers.config.ts
llm: new LFM2WebGPUProvider({ modelId: 'LiquidAI/LFM2-1.2B', dtype: 'q4' }),
// llm: new ClaudeSDKProvider({ model: 'claude-haiku-4-5-20251001', apiKey: '' }), // ← one line
```

**Code quality standards codified:**

- Strict TypeScript: `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- No `any` — use `unknown` + type guards
- `readonly` by default, `private` by default
- Named errors, never `throw new Error('...')`
- Full JSDoc on all public APIs
- No `new ConcreteClass()` inside business logic — receive via constructor

---

### Turn 8 — TDD Mandate

**Human intent:** "We forgot something crucial! Tests! The whole generation process must be a loop in which tests are crucial!"

**Claude's role:** Enforcer — not just add a test section, but restructure the build order around TDD.

**The key insight:** The provider abstraction + pure core interfaces make this extension unusually testable. Most extensions are a testing nightmare because everything couples to Chrome APIs. But `src/core/` is pure logic — testable with zero browser involvement.

**Three testing layers defined:**

**Layer 1 — Unit tests (`src/core/`):**
Pure logic, zero browser APIs, Vitest in Node, instant feedback. Every class has a `.test.ts` file. DI makes mocking trivial.

**Layer 2 — Provider contract tests:**

```typescript
// LLMProviderContract.ts — shared suite any provider must pass
runLLMProviderContractTests(() => new LFM2WebGPUProvider(...));
runLLMProviderContractTests(() => new ClaudeSDKProvider(...));
// Both must pass identically — this is executable proof of swappability
```

This is the **critical innovation**: swappability isn't just architectural promise, it's a passing test suite.

**Layer 3 — Playwright E2E:**
Full extension in real Chromium. Slow, definitive.

**The mandate:**

```
Write interface → Write failing test → Write implementation → Green → Refactor
Red first. Always.
```

**Build order restructured:** Mocks and contract suites come before any implementation. Step 3 is contract test suites with zero implementations written. This forces the right cognitive sequence.

**Coverage targets differentiated by layer:** 90% on `src/core/` (pure logic, no excuse), 70% on providers (browser env constraints), E2E covers Mode 1 + Mode 2 happy paths.

---

### Turn 9 — Execution Environment: CLI vs VS Code Extension

**Human intent:** Practical question — which tool for the overnight autonomous run?

**Claude's role:** Advisor with nuance — not the same, and the difference matters for this use case.

**Key distinction surfaced:** The VS Code extension runs in a pseudo-TTY where some interactive CLI features (checklists, selection prompts) don't render correctly. For an unattended overnight autonomous run, native terminal has the full feature surface.

**Recommendation:** CLI in iTerm/native terminal for the overnight pass. VS Code extension for interactive review in the morning.

**Practical tip added:** Set an instruction in the prompt to run `pnpm test` after each step and stop if tests fail — preventing the agent from building on a broken foundation at 2am.

---

### Turn 10 — Token Budget & Reasoning Power

**Human intent:** How to configure Claude Code for maximum capability on an autonomous overnight run?

**Claude's role:** Practical guide — what levers actually exist and what to set.

**Three levers identified:**

1. **Model selection:** `/model opus` — for architectural depth over Sonnet's speed
2. **Reasoning budget:** `ultrathink` in the prompt — triggers maximum extended thinking tokens (already on by default in Claude Code, but the keyword amplifies it)
3. **Autonomy:** `claude --dangerously-skip-permissions` — prevents mid-run stalls waiting for human approval

**The launch sequence:**

```bash
claude --dangerously-skip-permissions
# then inside session:
/model opus
# then kickoff prompt with "ultrathink" + reference to SPECIFICATIONS.md
```

**Subscription note flagged:** Opus burns tokens faster — Max20 plan ($200/month, 20x Pro allowance) recommended for a heavy overnight autonomous session.

---

## Meta-Observations on the Process

### What Made This Socratic Rather Than Instructional

A purely instructional approach would have been: "Here's what to build, here's the stack, write the spec." The Socratic approach instead:

- **Started with what the human knew**, not what Claude knew
- **Asked before recommending** (UI stack choice, mode definitions)
- **Researched before advising** (LFM2 feasibility, existing extensions)
- **Surfaced constraints before commitments** (MV3 CSP, shadcn React dependency)
- **Made implicit decisions explicit** (the "no external infra" USP crystallized from research, not from the human stating it)

The human never said "I want zero API calls." That constraint *emerged* from the competitive research turn and the LFM2 discovery. The Socratic process found it.

### The Spec as Compiled Dialogue

`SPECIFICATIONS.md` is not a document *about* the conversation — it's the conversation *compiled* into instructions. Every architectural decision has a corresponding dialogue turn. Every constraint has a reason. The reasoning is in this file; the decisions are in `SPECIFICATIONS.md`.

This separation is intentional: the coding agent needs decisions, not reasoning. The reasoning is preserved here for humans who need to understand or revisit choices.

### The Handoff Problem

The experiment explicitly tests whether the compiled spec is **lossless enough** for an agent that has zero conversation context. Known risks identified during spec creation:

- **Implicit decisions** — reasoning that lived only in dialogue and didn't make it to the doc
- **The "no LangChain" decision** — stated in conversation, not explicit in the spec
- **Tone of "open-sourceable quality"** — conveyed in conversation, partially captured in code quality section
- **LFM2 API immaturity** — flagged in conversation, a fallback model added to the spec (`Qwen2.5-0.5B-Instruct`)

### Decisions That Required Human Input vs. Claude Inference

| Decision | Source |
|---|---|
| Two-mode architecture | Human described the product |
| LFM2 as LLM backend | Human surfaced the model; Claude validated |
| Svelte over pure JS | Claude presented options, human chose |
| shadcn-svelte compatibility | Claude surfaced constraint proactively |
| Provider abstraction pattern | Claude proposed, human confirmed |
| TDD mandate | Human realized the gap; Claude structured the implementation |
| CLI over VS Code extension | Claude advised based on use case |

---

## Reusable Pattern — The Spec Generation Protocol

For future projects, this process can be templated:

```
Phase 1: FOUNDATIONS
  → Establish shared vocabulary and constraints
  → Map what's possible in the target environment

Phase 2: PRODUCT DEFINITION
  → Human describes intent in natural language
  → Claude translates to data flows (not code)
  → Ambiguities become explicit questions

Phase 3: PRIOR ART RESEARCH
  → Search for existing solutions
  → Map competitive gaps → USP crystallization
  → Identify technical feasibility of novel approaches

Phase 4: TECHNOLOGY SELECTION
  → Each tech choice follows from product requirements
  → Constraints surfaced before commitments made
  → Human decides when options genuinely exist

Phase 5: ARCHITECTURE
  → Interface contracts before implementations
  → Dependency rules made explicit
  → Swappability designed in, not retrofitted

Phase 6: QUALITY GATES
  → Code quality standards
  → Testing strategy (TDD mandate, contract tests)
  → Build order that enforces quality at each step

Phase 7: EXECUTION ENVIRONMENT
  → How the agent will actually run
  → Token/compute budget
  → Failure modes and recovery

Phase 8: COMPILE
  → Dialogue → SPECIFICATIONS.md
  → Decisions without reasoning (for the agent)
  → This file = reasoning without decisions (for humans)
```

---

## Appendix — Files Produced

| File | Purpose | Consumer |
|---|---|---|
| `SPECIFICATIONS.md` | Compiled spec — decisions, architecture, standards, build order | Coding agents (Claude Code, Gemini CLI, Codex CLI) |
| `SOCRATIC_SPECIFICATION_PROCESS.md` | This file — the reasoning behind each decision | Humans reviewing, extending, or replicating the process |

---

*Generated from a live Socratic dialogue session. The conversation that produced this document was itself the methodology being documented.*

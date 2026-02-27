<center><h1 style="font-size: 3em;">A Grand Battle Royale of Coding Agents</h1>

<h3><i style="color: white !important" >Claude Code vs. Codex CLI vs. Gemini CLI<br><br>A Controlled Experiment in Agentic Specification-Driven Development.</i></h3></center>

---

<center><img src="/medias/battle_royale_header_dark.jpg"></center>

---

## Premise

What happens when you give three competing AI coding agents the **exact same specification** produced through a rigorous Socratic dialogue process, and let them loose to build autonomously, overnight, from a cold start?

Not a toy task,, not a "write a sorting algorithm."

**A real, non-trivial product:**

> A Chrome Extension (Manifest V3) that lets users **chat with any website** using **100% in-browser AI inference**, WebGPU, no API keys, no servers, offline after first model load.

The experiment is not primarily about which agent wins.

It's about something more interesting:

**Whether a sufficiently precise specification, compiled from human-AI dialogue, can substitute for the human being present during execution.**

> The spec as a lossless interface between intent and implementation.

---

## Part I — Ideation: The Product

The product idea emerged from a genuine engineering curiosity: existing "chat with website" Chrome extensions all require external infrastructure. [Site RAG](https://github.com/bracesproul/site-rag) needs Supabase and an OpenAI key. [Lumos](https://github.com/andrewnguonly/Lumos) needs a local Ollama server. [PageChat](https://www.growthaccelerationpartners.com/blog/enhance-your-web-browsing-experience-with-pagechat-our-chrome-extension-and-how-we-built-it) needs an OpenAI API.

**Nobody had done it fully in-browser, with no external dependencies whatsoever.**

The timing was right: Liquid AI had just released **LFM2** — a family of small hybrid models (350M to 2.6B parameters) specifically designed for on-device deployment, with official ONNX exports and `transformers.js` support. Running inference via WebGPU directly in the browser, with no server, was suddenly not just theoretically possible but practically achievable.

The product vision crystallized into two modes:

**Mode 1 — Page Q&A:** Capture the current page's DOM, convert to Markdown, pass with the user's question to the in-browser LLM. Instant, stateless, ephemeral.

**Mode 2 — Site RAG:** Detect `sitemap.xml`, BFS-crawl up to *k* pages at depth *d*, chunk and embed all content locally, store in IndexedDB, enable a persistent RAG conversation over the entire site — offline after the first crawl.

The **USP** — fully self-contained, private by default, offline-capable, zero setup — had never been assembled in this combination.

---

## Part II — The Socratic Specification Process

*Full reconstruction available in [`SOCRATIC_SPECIFICATION_PROCESS.md`](./SOCRATIC_SPECIFICATION_PROCESS.md).*

The specification was not written top-down. It was **extracted through dialogue** — a conversational Claude instance acting as a Socratic interlocutor, not an instructor.

The process followed a deliberate sequence:

```
Foundations → Product Definition → Prior Art Research
→ Technology Selection → Architecture → Quality Gates → Execution Environment
```

Each phase served a purpose. Foundations established shared vocabulary and browser extension constraints. Prior art research crystallized the USP — not by the human stating it, but by Claude mapping competitive gaps. Technology selection followed from product requirements rather than preceding them. Architecture was designed around interfaces before implementations.

### Key Decisions and How They Were Made

| Decision | How it emerged |
|---|---|
| LFM2 as the LLM backend | Human surfaced the model; Claude validated feasibility via web search |
| Svelte over pure JS | Claude surfaced the shadcn/React compatibility constraint; human chose from explicit options |
| Provider abstraction (DIP) | Claude proposed the pattern; human confirmed the intent |
| TDD mandate | Human realized the gap mid-process; Claude structured the implementation |
| CLI over VS Code extension | Claude advised based on the specific use case (unattended overnight run) |

### The Architecture That Emerged

The critical architectural insight was **dependency inversion applied throughout**:

```
src/core/          ← interfaces + pure logic. No concrete deps. Ever.
src/providers/     ← swappable implementations (LFM2, Claude SDK, OpenAI...)
src/config/        ← providers.config.ts: the ONE file to change when swapping backends
```

Combined with a **provider contract test** pattern — a shared test suite that any `LLMProvider` implementation must pass identically — swappability becomes not just a promise but an executable proof.

### The Compiled Artifact: `SPECIFICATIONS.md`

The output of the Socratic process was a single file: `SPECIFICATIONS.md`

**800+ lines covering :**

- project structure,
- interface definitions with code samples,
- the provider abstraction pattern,
- a TDD mandate with three test layers (unit, contract, E2E), code quality standards,
- and a 16-step build order enforcing red-green-refactor at each step.

Critically: `SPECIFICATIONS.md` contains **decisions without reasoning**.

The reasoning lives in `SOCRATIC_SPECIFICATION_PROCESS.md`.

The separation is intentional: a coding agent needs to act, not deliberate.

A human revisiting the choices needs the reasoning, not the implementation details.

---

## Part III — The Battle Royale

### Setup: Full Hands-Off, Three Agents, One Specification

| | Claude Code CLI | Codex CLI | Gemini CLI |
|---|---|---|---|
| **Spec file** | `SPECIFICATIONS.md` | `SPECIFICATIONS.md` | `SPECIFICATIONS.md` |
| **Model** | Opus 4.6 - ultrathink | gpt-5.3 Codex - High | Gemini 3.1 Pro Preview |
| **Mode** | autonomous `--dangerously-skip-permissions` | autonomous | autonomous |
| **Duration** | 35 minutes | 45 minutes | ~ 1 hour |

**The agents received only the spec file and the project directory**:

- Cold start,
- No conversation context,
- No human present,
- No explanation of *why* the decisions were made,
- Just the compiled artifact.

---

### Results: The Convergence Was Real

The first and most striking finding: **structural convergence was near-total**.

All three independently produced the same folder layout, the same TypeScript strict config, the same AI stack (`@huggingface/transformers`, `Xenova/all-MiniLM-L6-v2`, `LiquidAI/LFM2-1.2B`), the same provider contract test pattern, the same cosine similarity approach for vector search.

The spec imposed a strong enough template that three different systems, with different architectures and training data, arrived at essentially the same skeleton.

**The specification worked.**

```
                         Claude      Codex       Gemini
core/interfaces/           ✅          ✅          ✅
core/errors/               ✅          ✅          ✅
core/rag/                  ✅          ✅          ✅
providers/{llm,emb,vs,cr}  ✅          ✅          ✅
contract tests             ✅          ✅          ✅
```

---

### Results: The Divergence Was Revealing

The meaningful differences emerged exactly where the spec was silent, ambiguous, or required judgment under complexity pressure.

| Dimension | Claude | Codex | Gemini |
|---|---|---|---|
| UI framework | Svelte 5 (Runes) | **Vanilla TS** (spec deviation) | Svelte 4 |
| Mode 2 (Site RAG) | ✅ End-to-end | ✅ End-to-end | ❌ Unconnected |
| Worker architecture | ✅ All 3 integrated | ⚠️ Present, not wired | ⚠️ LLM only |
| Claude SSE streaming | ⚠️ Simulated | ⚠️ Simulated | ✅ Real |
| Fallback providers | ❌ | ✅ LLM + Embedding | ❌ |
| IndexedDB in tests | ❌ | ❌ | ✅ `fake-indexeddb` |
| Unique standout | AsyncGenerator crawler | Scaffold test, MVC controllers | Real SSE, `fake-indexeddb` |

---

### Each Agent Had a Different Definition of "Done"

This is the most intellectually interesting finding.

**Claude Code** optimized for **spec fidelity and architectural completeness**.

Both modes work end-to-end. The worker architecture is correctly threaded.

The AsyncGenerator crawler, not explicitly in the spec but aligned with its intent, is the single best design decision in any of the three codebases.

Claude read *between the lines*. The weakness: some declared features were incomplete, and streaming was simulated.

**Codex** optimized for **reliability and developer experience**.

Fallback providers mean the extension always loads, even without a GPU.

A scaffold test that verifies the project *structure* in CI is a novel, defensive idea not in the spec.

Coverage metrics are explicit and visible.

The weakness: it dropped Svelte entirely (the clearest spec deviation) apparently encountering build friction and making a cold trade-off: something that runs over something that matches.

The MVC controller pattern it substituted is actually more testable than raw Svelte state, which is a form of principled disobedience.

**Gemini** optimized for **correctness of specific components**.

Real SSE streaming is the most technically correct implementation of that feature across all three. `fake-indexeddb` enabling real database tests is the smartest testing decision in the experiment.

The weakness: Mode 2 (the product's primary differentiator) was fully implemented as isolated components but never wired to the user-facing message path. The `MessageRouter` returns `"Site mode not implemented yet"`.

Component quality without integration verification.

---

### The Failure Modes Map to Known Patterns

| Agent | Failure mode | Pattern name |
|---|---|---|
| Codex | Spec deviation under friction | Satisficing — finds a working local optimum |
| Claude | Declares more than it finishes | Over-reach under complexity |
| Gemini | Components without integration | Bottom-up without top-down verification |

None of these are bugs, they are **systematic tendencies** -> each agent has a characteristic way of failing when pushed to its limits.

**Knowing this is actionable: future spec iterations could add explicit guards against each one.**

---

### What the Spec Could Have Prevented

Looking backward, three spec additions would have closed the most significant gaps:

**Against Gemini's integration gap:**

```markdown
Mode 2 is NOT complete unless a user message in site-mode
returns text sourced from the vector store. Verify with a
Playwright assertion that response content differs from
the "not implemented" stub.
```

**Against Codex's Svelte substitution:**

```markdown
Svelte + shadcn-svelte is non-negotiable. If build friction
is encountered, debug it — do not substitute. The vite-plugin-
web-extension configuration for Svelte is solved; the complexity
is in setup, not architecture.
```

**Against simulated streaming in all three:**

```markdown
Streaming must be real token-by-token output, not a deferred
full-response split into chunks. Verify with a test that
measures time-to-first-token < time-to-completion.
```

---

### The Synthesis Verdict

There is no single winner and that is the correct outcome for this experiment.

Each agent produced something valuable and incomplete.

**The report's own conclusion states it cleanly:**

> *Combining Gemini's real SSE streaming, Codex's fallback providers, and Claude's worker architecture and AsyncGenerator crawler would produce the strongest result.*

A merge, not a podium.

---

## Part IV — Process Over Product

The temptation when reading these results is to rank and move on. That would miss the point.

The more interesting question is: **what does it mean that three distinct systems converged on the same architecture from a shared text file?**

It means the specification carried enough semantic weight to substitute for the human who designed it. The reasoning, the trade-offs, the "why" of each decision — none of that was present in `SPECIFICATIONS.md`. Only the decisions.

And yet the agents reproduced not just the structure but the *spirit* of the architecture: pure core, swappable providers, interfaces before implementations, tests before code.

That is the value of the Socratic process, not the Chrome extension. The extension is a vehicle.

The real product is the **methodology for compiling human intent into machine-executable specifications**, and the evidence that, when done carefully, it works.

### The Process, Visualized

```
Human intent (vague)
        │
        ▼
Socratic dialogue
(Claude as interlocutor)
        │
        ├── Research injection (web search, prior art)
        ├── Constraint surfacing (MV3, CSP, shadcn/React)
        ├── Decision crystallization (one ambiguity at a time)
        └── Quality gate definition (TDD, contracts, coverage)
        │
        ▼
SPECIFICATIONS.md
(compiled spec — decisions without reasoning)
        │
        ├── SOCRATIC_SPECIFICATION_PROCESS.md (reasoning without decisions)
        │
        ▼
Autonomous coding agents
(cold start, no conversation context)
        │
        ├── Claude Code → completeness + architecture
        ├── Codex CLI   → reliability + developer experience
        └── Gemini CLI  → component correctness
        │
        ▼
Comparative analysis
(where specs hold, where they break)
        │
        ▼
Spec improvement
(close the gaps, prevent the failure modes)
        │
        ▼
Next iteration ↑
```

Each loop tightens the spec. Each spec produces better implementations.

Each comparison reveals new gaps -> The process compounds.

---

## Closing Note - What Comes Next

The challenge is not complete.

The three implementations exist as separate codebases, each with genuine strengths and genuine gaps. The final step, **which may also be the most demanding**, is to hand all three to a single agent and issue the following challenge:

> *You have three implementations of the same specification. Study them. Identify the best decision in each. Produce a single unified codebase that is strictly better than all three: not a merge of files, but a synthesis of ideas.*

**This is much harder than building from a spec.**

It requires the agent to act as an architect reviewing existing work, extracting patterns, reconciling conflicts, and making principled choices about what to keep, what to discard, and what to redesign entirely.

The agent chosen for this final step has not been disclosed. The selection is deliberate, based on the evidence gathered here.

The outcome will complete this document.

Stay tuned.

---

## Artifacts

| File | Description |
|---|---|
| [`SPECIFICATIONS.md`](./SPECIFICATIONS.md) | The compiled specification — what the agents received |
| [`SOCRATIC_SPECIFICATION_PROCESS.md`](./SOCRATIC_SPECIFICATION_PROCESS.md) | The dialogue reconstruction — how the spec was built |
| [`REPORT.md`](./REPORT.md) | The full comparative analysis — what each agent produced |
| `claude_code_version/` | Claude Code's implementation |
| `codex_version/` | Codex CLI's implementation |
| `gemini_version/` | Gemini CLI's implementation |
| `GRAND_BATTLE_ROYALE.md` | This document |

---

*An experiment in human-AI collaborative specification, agentic execution, and the compounding value of process over product.*

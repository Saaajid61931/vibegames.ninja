# VibeGames.Ninja — System Architecture & Engineering Blueprint

## 1. Architectural Vision & Topology

VibeGames is architected as a high-performance **modular monolith** using Next.js 16 (App Router) on top of PostgreSQL, Cloudflare R2 object storage, and background asynchronous workers.

```
                                  ┌─────────────────────────┐
                                  │      Client Layer       │
                                  │  (Web & Mobile Web UI)  │
                                  └────────────┬────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────┐
                                  │  Next.js 16 App Router  │
                                  │  (SSR, React 19, API)   │
                                  └────────────┬────────────┘
                                               │
                  ┌────────────────────────────┼────────────────────────────┐
                  │                            │                            │
                  ▼                            ▼                            ▼
      ┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
      │ PostgreSQL (Supabase) │    │  Cloudflare R2 Bucket │    │  AI Agent Orchestrator│
      │  (Source of Truth)    │    │ (Builds, Media, Capsules) │ (Model-Agnostic Engine)│
      └───────────────────────┘    └───────────────────────┘    └───────────────────────┘
                  ▲                            ▲                            ▲
                  │                            │                            │
                  └────────────────────────────┼────────────────────────────┘
                                               │
                                  ┌────────────┴────────────┐
                                  │ Background Worker Queue │
                                  │ (QA, Scans, Media Gen)  │
                                  └─────────────────────────┘
```

---

## 2. Bounded Contexts & Domain Modules

1. **Identity & Auth Domain**: User authentication, NextAuth.js session management, roles (`USER`, `CREATOR`, `ADMIN`), Studio Profiles.
2. **Game Capsule & Versioning Domain**: Capsule manifest creation, version tag management, ZIP/HTML validation, immutability enforcement.
3. **Isolated Runtime Domain**: Origin-isolated iframe sandbox rendering, postMessage SDK handler, runtime error containment.
4. **AI Agent Orchestrator**: Model-agnostic abstraction layer (OpenAI, Anthropic, Gemini, DeepSeek), token budget tracking, multi-agent execution pipeline.
5. **Agentic Playtesting Domain**: Headless browser automation testing game launch, control compliance, exception logging, and report output.
6. **Remix & Lineage Domain**: Parent-child relationship graphs, structural diff computation, transitively inherited attribution.
7. **Distribution & Social Domain**: Embed rendering, OpenGraph social card generation, high-score challenges, ghost replay data.
8. **Jams & Community Domain**: Jam management, entry submissions, anti-abuse voting evaluation.
9. **Analytics & Telemetry Domain**: Weekly Meaningful Plays (WMP) calculation, play session heartbeat metrics, bounce rate detection.

---

## 3. Model-Agnostic AI Agent Orchestration Architecture

The AI subsystem relies on a provider-agnostic interface:

```typescript
export interface AIProvider {
  id: string
  generateCompletion(params: CompletionRequest): Promise<CompletionResponse>
  streamCompletion(params: CompletionRequest): AsyncIterable<CompletionChunk>
}
```

### Agent Roles:
- **Creator Agent**: Converts natural language intent into HTML5 game code & Game DNA.
- **Engineering Agent**: Performs surgical code modifications for requested remixes or bug fixes.
- **Playtest Agent**: Simulates player input via headless browser and evaluates playability.
- **Debugging Agent**: Analyzes JS error tracebacks and applies targeted patches.
- **Balance Agent**: Inspects difficulty curves and scoring mechanisms.
- **Security Agent**: Scans generated script text for dangerous code (eval, external network calls, cookie theft attempts).

---

## 4. Runtime Isolation & Security Architecture

1. **Origin Isolation**:
   - Main platform served from `vibegames.ninja`.
   - Untrusted games served from an isolated asset domain (e.g., `play.assets.vibegames.ninja` or Cloudflare R2 public URL).
2. **Iframe Sandboxing**:
   - `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"`
   - `allow="fullscreen; gamepad; accelerometer; gyroscope"`
   - Platform tokens and sensitive cookies are never accessible from within the iframe environment.
3. **Content Security Policy (CSP)**:
   - Restricts external script injection and unauthorized outbound network connections.

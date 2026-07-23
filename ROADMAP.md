# VibeGames.Ninja — Phased Engineering Roadmap

## Overview & Execution Strategy
Building VibeGames into the world's leading AI-native playable-media network proceeds in six validated vertical milestones.

---

## Milestone 0: Foundation Repair & Architecture Alignment
**Target**: Complete immediate UX fixes, mobile feed routing, SEO metadata alignment, and security baseline.
- **Deliverables**:
  1. Align mobile and desktop homepages. Restore full discovery UI on mobile `/`.
  2. Route mobile reels snap-scroll feed to `/feed` with navigation, context header, and exit button.
  3. Update brand copy & positioning to "The Home of Playable Ideas".
  4. Instrument telemetry for Weekly Meaningful Plays (WMP).
  5. Audit and sanitize Open Graph metadata and dynamic sitemaps.
  6. Harden iframe sandboxing and Content Security Policy headers.

---

## Milestone 1: Creator Distribution Platform & Game Capsules
**Target**: Turn VibeGames into a top-tier distribution system with Game Capsules and Automated Playtesting.
- **Deliverables**:
  1. Implement `GameCapsule`, `GameDNA`, and `PlaytestReport` Prisma models.
  2. Implement automated Agentic Playtesting pipeline (checking load, runtime errors, controls, and mobile fit).
  3. Create instant Playable Post kits: QR code generator, score challenge builder (`/play/[slug]?challenge=...`), and social media clip preview cards.
  4. Build Creator Analytics Dashboard showing WMP, completion rates, and feedback.
  5. Optimize publishing flow so valid HTML/ZIP games go live in under 3 minutes.

---

## Milestone 2: Remix Network & Lineage Graph
**Target**: Enable one-click forking, diff visualization, and open remix attribution.
- **Deliverables**:
  1. Build `RemixEdge` lineage graph and interactive visual tree component.
  2. Implement natural-language remix prompt requester.
  3. Transitive attribution inheritance (original creator rights & revenue rules survive all descendants).

---

## Milestone 3: AI Creation Studio
**Target**: Multi-agent creation workspace from prompt to playable capsule.
- **Deliverables**:
  1. Model-agnostic AI provider layer (OpenAI, Anthropic, Gemini, DeepSeek).
  2. Multi-agent engine (Creator, Engineering, Playtest, Debugging, Security agents).
  3. Interactive canvas preview & version checkpoint control.

---

## Milestone 4: Live Communities & Streamer Rooms
**Target**: Real-time room generation, live audience remixing, and community jams.
- **Deliverables**:
  1. Live Arcade Rooms (`/rooms/[id]`) with spectator queues.
  2. Live audience prompt voting and round modifiers.

---

## Milestone 5: Open Playable-Media Ecosystem
**Target**: Public Vibe SDK, REST/GraphQL publishing API, engine adapters.
- **Deliverables**:
  1. Release Universal Vibe Runtime SDK.
  2. CLI publishing tool for local AI coding environments (Cursor, Claude Code).

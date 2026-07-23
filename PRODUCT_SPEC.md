# VibeGames.Ninja — Detailed Product Specification

## 1. User Experience Overview

VibeGames provides five core user experiences designed to maximize engagement, creation, and distribution.

---

## 2. Detailed Experience Specifications

### A. Player Experience
- **Zero-Barrier Access**: Players can play any public game immediately upon page load without mandatory registration or popups.
- **Controls Transparency**: Clear desktop keyboard bindings and mobile touch overlays are displayed prior to or during the first seconds of gameplay.
- **Unified Responsive Homepage**:
  - Desktop & Mobile load a rich landing page featuring curated sections: Featured Arcade, Just Launched, Needs Feedback, Built with AI Tools, Mobile Quick-Plays, and Remixable Games.
  - Dedicated Mobile Reel Feed lives at `/feed`, featuring vertical swipe-based full-screen gameplay, explicit header navigation, onboarding cues, game context details, and an exit button back to the homepage.
- **Social & Competitive Actions**:
  - High-score challenge creation: "I scored 4,500. Beat me!"
  - Ghost-run recording & replay for speedrun/arcade challenges.
  - One-click feedback tags: `Fun`, `Confusing`, `Too Hard`, `Buggy`.
  - Follow creator & view game family tree (Remix Graph).

### B. Creator Experience
- **Rapid Publishing Pipeline (< 3 Minutes)**:
  - Supports single `.html` files or `.zip` archives containing `index.html`.
  - Import from git repositories, prompt-to-game studio, or direct upload.
  - Automatic validation: scans archive integrity, checks entry point, verifies responsive canvas layout.
- **Creator Dashboard**:
  - Analytics on Weekly Meaningful Plays, completion rates, bounce rates, ratings, and revenue.
  - Version management: create immutable release tags, roll back immediately if a version breaks.
  - Automated Social Share Kit: downloadable Open Graph banners, looping video/GIF captures, QR codes, and suggested copy.
- **Monetization & Exporting**:
  - Set tips, commercial source licenses, or pay-what-you-want access.
  - Full project zip export at any time.

### C. Remix Experience
- **One-Click Forking**:
  - Click "Remix" on any game with open remix permissions.
  - Natural-language prompt modifier (e.g., "Add touch controls", "Make the final boss twice as fast", "Add a retro space theme").
  - Automated diff visualizer showing structural code/asset differences between parent and child.
  - Guaranteed lineage preservation: original author attribution and license terms are enforced transitively.

### D. Community & Jam Experience
- **Interactive Game Jams**:
  - Themed challenges with specific constraints (e.g., "30-second games", "One-button controls", "Built with GPT-5").
  - Starter Game Capsules provided for instant remixing.
  - Transparent voting systems (1-5 ratings across Innovation, Playability, Audio-Visuals) with anti-spam / anti-bot safeguards.
  - Jams become permanent playable archives post-completion.

### E. Streamer & Live Group Experience
- **Live Arcade Rooms**:
  - Streamers or community hosts create a live room with a join code / QR code.
  - Audience submits games, votes on play queues, and participates in real-time leaderboards.
  - Live remixing: host or audience requests prompt variations between rounds (e.g., "Make round 2 low gravity").

---

## 3. Primitives Technical Specification

### Game Capsule Schema (`GameCapsule`)
A capsule encapsulates:
1. `id`, `slug`, `version` (e.g., `v1.2.0`)
2. `creatorId`, `studioProfileId`
3. `buildArtifactUrl` (R2 bundle URL)
4. `manifest` (metadata JSON including controls, canvas dimensions, orientation, tags)
5. `gameDna` (structured JSON of mechanics, rules, and boundaries)
6. `remixPermissions` (`ALLOW_ALL`, `ATTRIBUTION_REQUIRED`, `PRIVATE`)
7. `parentCapsuleId` (nullable, points to parent capsule if remixed)
8. `agenticPlaytestReport` (automated QA score and log)

### Game DNA Schema (`GameDNA`)
```json
{
  "coreMechanic": "physics-platformer",
  "inputModel": { "keys": ["ArrowLeft", "ArrowRight", "Space"], "touch": true },
  "winCondition": "reach-flag",
  "lossCondition": "fall-in-pit",
  "difficultyCurve": "linear-increasing",
  "safeRemixBoundaries": {
    "allowPhysicsTuning": true,
    "allowAssetReplacement": true,
    "preserveWinLogic": true
  }
}
```

### Agentic Playtest Spec
Automated headless agent execution pipeline running Playwright + Chromium:
- **Phase 1: Boot Check**: Verifies HTTP 200, checks DOM load < 3s, detects console exceptions.
- **Phase 2: Input Simulation**: Sends keypresses/touch events, checks canvas render updates via pixel diffs.
- **Phase 3: Security & Quota Check**: Ensures no external network calls violate Content Security Policy, checks memory utilization < 256MB.
- **Phase 4: Output Report**: Generates `AgenticPlaytestReport` with confidence score (0-100%) and actionable fixes.

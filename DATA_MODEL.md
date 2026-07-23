# VibeGames.Ninja — Data Model & Database Specification

## 1. Relational Entity Overview

The database schema builds upon PostgreSQL and Prisma ORM, introducing key models for Game Capsules, Game DNA, Remix Graphs, Agentic Playtest Reports, and Play Sessions.

---

## 2. Schema Additions & Prisma Extensions

```prisma
// Expanded Enums
enum RemixPermission {
  ALLOW_ALL
  ATTRIBUTION_REQUIRED
  APPROVAL_REQUIRED
  DISABLED
}

enum PlaytestStatus {
  PENDING
  RUNNING
  PASSED
  WARNINGS
  FAILED
}

// 1. Game Capsule & Versioning
model GameCapsule {
  id              String          @id @default(cuid())
  slug            String          @unique
  gameId          String
  game            Game            @relation(fields: [gameId], references: [id], onDelete: Cascade)
  version         String          // e.g. "1.0.0"
  buildArtifact   String          // R2 URL
  entryPoint      String          @default("index.html")
  remixPermission RemixPermission @default(ATTRIBUTION_REQUIRED)
  
  // Provenance & Metadata
  gameDna         Json?           // Structured Game DNA
  manifest        Json            // Controls, dimensions, compatibility
  aiPromptUsed    String?
  aiModelUsed     String?
  aiToolUsed      String?

  // Lineage Graph
  parentCapsuleId String?
  parentCapsule   GameCapsule?    @relation("RemixLineage", fields: [parentCapsuleId], references: [id], onDelete: SetNull)
  childCapsules   GameCapsule[]   @relation("RemixLineage")

  // Quality & Safety
  playtestReport  PlaytestReport?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([gameId, version])
  @@index([slug])
  @@index([parentCapsuleId])
}

// 2. Remix Lineage Graph Edge
model RemixEdge {
  id              String      @id @default(cuid())
  parentGameId    String
  parentGame      Game        @relation("ParentRemixes", fields: [parentGameId], references: [id], onDelete: Cascade)
  childGameId     String
  childGame       Game        @relation("ChildRemixes", fields: [childGameId], references: [id], onDelete: Cascade)
  diffSummary     String?
  promptRequest   String?
  createdAt       DateTime    @default(now())

  @@unique([parentGameId, childGameId])
  @@index([parentGameId])
  @@index([childGameId])
}

// 3. Agentic Playtest Report
model PlaytestReport {
  id              String         @id @default(cuid())
  capsuleId       String         @unique
  capsule         GameCapsule    @relation(fields: [capsuleId], references: [id], onDelete: Cascade)
  status          PlaytestStatus @default(PENDING)
  score           Int            @default(0) // 0-100 quality/playability score
  
  bootSuccess     Boolean        @default(false)
  hasJsErrors     Boolean        @default(false)
  mobileCompatible Boolean       @default(false)
  controlsVerified Boolean       @default(false)
  
  logs            Json           @default("[]") // Array of log messages
  diagnostics     Json           @default("{}") // Structured error reports
  testedAt        DateTime       @default(now())

  @@index([status])
}

// 4. Play Session & Meaningful Play Tracking
model PlaySession {
  id              String   @id @default(cuid())
  gameId          String
  game            Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  userId          String?
  sessionId       String   // Anonymous browser session UUID
  durationSeconds Int      @default(0)
  hasInteracted   Boolean  @default(false)
  isMeaningful    Boolean  @default(false) // Duration > 30s + user interaction
  completedObjective Boolean @default(false)
  deviceType      String   @default("DESKTOP") // DESKTOP, MOBILE, TABLET
  referrer        String?
  createdAt       DateTime @default(now())

  @@index([gameId, isMeaningful, createdAt])
  @@index([sessionId])
}

// 5. Score Challenge Link
model GameChallenge {
  id            String   @id @default(cuid())
  code          String   @unique // Short challenge code (e.g. "BEAT-4280")
  gameId        String
  game          Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  creatorId     String
  creatorUser   User     @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  targetScore   Int
  playerCount   Int      @default(0)
  createdAt     DateTime @default(now())

  @@index([code])
}
```

---

## 3. Migration Plan

1. **Step 1**: Add enums (`RemixPermission`, `PlaytestStatus`) to Prisma schema.
2. **Step 2**: Add `GameCapsule`, `RemixEdge`, `PlaytestReport`, `PlaySession`, and `GameChallenge` models.
3. **Step 3**: Relate existing `Game` records to an initial `GameCapsule` `v1.0.0` backfill.
4. **Step 4**: Execute `npx prisma db push` (or migration scripts) against PostgreSQL instance.

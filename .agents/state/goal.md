# Goal State

Status: blocked
Started: 2026-05-20
Updated: 2026-05-28

## Objective

Populate VibeGames.Ninja and pursue a legitimate plan to attract at least 100 unique human visitors while avoiding fake traffic, bot visits, spam, deception, or platform abuse.

## Success Criteria

- [x] Expose more goal-aligned playable content through the main arcade experience.
- [x] Add acquisition-ready links and copy that can be used in real communities.
- [x] Verify the new site surface locally.
- [x] Publish/deploy the cleanup removing `/instant-plays` from production.
- [ ] Execute promotion through accounts the user controls and verify at least 100 unique real visitors.

## Constraints

- Interpret "by any means" as "by any lawful, ethical, platform-compliant means."
- Do not create fake analytics, bot traffic, spam posts, deceptive campaigns, or paid campaigns without the user's direct approval.
- External submissions that require login, identity, payment, or account reputation must be prepared for the user to execute manually.
- Preserve existing dirty worktree changes unless the user explicitly asks to discard them.

## Plan

- [x] Inspect current live site, worktree, and goal state.
- [x] Remove the `/instant-plays` surface because the user said it does not align with the goal.
- [x] Refocus promotion on existing arcade and game pages.
- [x] Replace the promotion playbook with first-100 visitor launch copy and channel checklist.
- [x] Run tests, production build, and local HTTP verification.
- [x] Deploy/push changes.
- [ ] Post to approved launch channels and monitor real visitor counts.

## Progress Log

- **2026-05-20**: Verified the live homepage has 21 games, 4 creators, and 253 plays.
- **2026-05-20**: Added `src/lib/instant-play-games.ts` with 8 standalone HTML5 games from `public/sample-games`.
- **2026-05-20**: Added `src/app/instant-plays/page.tsx`, a public landing page with metadata and structured data.
- **2026-05-20**: Linked Instant Plays from the header, homepage, footer, and sitemap.
- **2026-05-20**: Rewrote `docs/promotion_playbook.md` with clean first-100 visitor drafts for Show HN, Reddit, Product Hunt, itch.io backlinks, and tracking.
- **2026-05-20**: Committed and pushed `e3ff664 Add instant plays launch surface` to `origin/main`.
- **2026-05-20**: GitHub Actions / Vercel deployment completed successfully for commit `e3ff664`.
- **2026-05-20**: User rejected the Instant Plays direction; cleanup is in progress to remove that route and point promotion at `/games`.
- **2026-05-28**: Completed the retro-arcade theme style alignment on the upload page, edit game page, and authentication forms. Verified that the production build succeeds cleanly and all references to `/instant-plays` are fully purged. Pushed styling fixes to main. Deleted empty `instant-plays` directory. Stated goal runner handoff in `NEXT.md` for manual promotion steps.

## Verification

- [x] `npm.cmd test` passed.
- [x] `npm.cmd run build` passes after cleanup and no longer shows `/instant-plays` in the route manifest.
- [ ] Production HTTP check no longer exposes `https://www.vibegames.ninja/instant-plays`.
- [x] Production sitemap no longer contains `instant-plays`.

## Blockers

- Proving 100 unique visitors requires live analytics after real promotion posts are published through accounts the user controls.
- Local production build still logs Prisma TLS errors for DB-backed homepage queries in this sandbox, although the build exits successfully.

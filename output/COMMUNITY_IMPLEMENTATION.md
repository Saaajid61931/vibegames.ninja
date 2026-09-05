# Community and source marketplace implementation

## Final design direction: improved experience with the preferred arcade style

The improved layout and product flows from commit `4fff9cf` are retained. The subsequent return to the old layout was superseded: this is a visual theme adjustment, not a rollback of the redesign.

The homepage retains Worth a play, inspiration collections, Fresh experiments, Looking for feedback, recent plays and the sharing invitation. Explore retains the streamlined filters and readable sorting. Quick play retains creator identity, saving and a single active game. Primary navigation exposes Collections and Community. Creator stories, source purchases, review, support and payout workflows remain.

These updated layouts use the preferred deployment's arcade fonts, dark palette, yellow/cyan accents, square borders, hard shadows, card treatment and marquee. No tests or deployment were run for this correction, as requested. Earlier screenshots and measurements below may not reflect the final arcade styling.

The local application now focuses on playing, sharing, collecting ideas and meeting creators. AI generation remains outside the main discovery and sharing journeys.

## Delivered

- Compact shared desktop/mobile Explore homepage, readable cards, quieter navigation, inspiration shortcuts, fresh experiments and feedback discovery.
- Separate Quick play with creator identity, game details, saving and only the active game iframe mounted.
- Private saves independent from public appreciation. Existing favorites remain saved and are copied into appreciation by the migration.
- Named private/public collections with ownership checks; public collection discovery and a community feed with following and feedback filters.
- Creator workspace for behind-the-game notes, inspiration credit and exact source-version reuse credit. Source reuse is checked against project ownership or acquisition; permissions still come from the creator's license.
- Optional separate source ZIPs, free or creator-priced from $1 USD. Versioned listings include setup instructions, file list, dependencies, exclusions and license terms. Uploads require rights confirmation and admin review.
- Removed the simulated card form and iframe-wrapper download. Paid acquisition uses hosted Stripe Checkout, connected seller payouts, exact signed payment confirmation and private server-authorized downloads.
- Purchase library, private support/refund requests, admin responses/refunds, source withdrawal, and admin blocking. Withdrawal preserves previous purchases; blocking suspends buyer downloads. Source checksums protect version integrity.
- Login/register return destinations preserve the user's intended action. Anonymous publishing has an explanatory introduction.

## Production activation

No production database migration, deployment, payment or real seller onboarding was performed.

1. Back up the database. Deploy `prisma/migrations/202609050900_community_source_projects/migration.sql` through the project's normal Prisma migration process. On a staging copy, first run `prisma migrate status` and verify existing migration history. Do not use `db push` to replace migration history. The migration adds tables and copies legacy favorites; it does not delete games or saves.
2. Deploy the application and regenerate Prisma Client together with that migration. New community endpoints need the new tables. Keep source sales disabled during rollout.
3. Create a distinct private R2 bucket. Keep public access, r2.dev access and custom public domains disabled. Test that an unauthenticated request cannot retrieve an object. Give server credentials access to that bucket. Never reuse the public playable-game bucket for source.
4. Configure Stripe Connect, the supported seller country and the webhook endpoint. Complete test-mode seller onboarding, a genuine test Checkout payment, ZIP retrieval, refund, failed payment and webhook retry before enabling real sales.
5. Verify launch-region tax handling and publish the platform's source purchase/refund/support terms. This implementation does not automatically calculate taxes. Destination-charge payment processing fees are charged to the platform; choose the platform fee with $1 transaction economics in mind. No claim of profitable $1 sales is implied.
6. Grant designated reviewers the existing ADMIN role. Review submitted archives in an isolated environment; basic file checks are not a malware scanner. Review version/demo correspondence, licensing and third-party assets. Monitor the purchase support queue.
7. Enable `SOURCE_SALES_ENABLED=true` only after the above provider and storage checks. Confirm uploads, payment return URL, duplicate events, downloads, creator transfers and refunds in the deployed environment.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL, also used for checkout and trusted request origins |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Existing server R2 connection; must permit access to the private source bucket |
| `R2_SOURCE_BUCKET_NAME` | Separate private source bucket |
| `R2_SOURCE_BUCKET_PRIVATE_CONFIRMED` | `true` only after operator verification; this flag does not configure bucket privacy |
| `STRIPE_SECRET_KEY` | Server Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Secret for `/api/source/webhook` |
| `SOURCE_SELLER_COUNTRY` | Supported two-letter seller country for this launch; the onboarding route currently uses one configured country |
| `SOURCE_PLATFORM_FEE_BPS` | Explicit integer 0–3000 basis points; e.g. 1500 is 15%, not a pricing recommendation |
| `SOURCE_SALES_ENABLED` | Explicit `true` to enable paid checkout |

Subscribe the Stripe endpoint to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, and `charge.dispute.closed`.

## Verification and limits

Local checks use synthetic users/purchases and an in-memory PGlite database. Public game metadata is used only for realistic preview cards. No customer or payment data is copied.

- Existing test suite: `node test/all.test.js`.
- Source validation/signature tests: `node --import tsx --test test/community.test.ts`.
- Browser checks: `output/community-browser-check.cjs` against the local preview.
- API integration checks: `output/community-api-check.cjs`, with fixtures from `output/community-preview-db.cjs`.
- Screenshots: `output/playwright/community-preview/`.

The browser/API checks verify local behavior, not real Stripe/R2 interoperability. Live private upload/download, actual payout onboarding and provider-issued refunds still require the operator's test-mode configuration. Provider API calls are disabled in the preview. A refund support request and admin response were tested locally; no real refund was issued.

The community feed is a straightforward discovery/following feed, not a personalized recommendation engine. Inspiration shortcuts use existing categories. Actual creator recruitment, editorial curation, jam participation and sustained feedback require operating the community. Bundles, tax automation, multi-country seller enrollment, chat and a paid subscription are not part of this implementation.

The existing deployment rate limiter can use its current infrastructure; assess distributed enforcement before significant upload/checkout traffic. Lists are deliberately bounded for the initial community. Source archives currently support up to 20 MB compressed, 50 MB declared expanded, 400 files and 10 MB per file. Large native projects need a later storage/validation extension.

## Release review

Review the git diff before deployment. Application dependencies and lockfiles were not changed. Temporary local preview tools are under `output/community-tooling` and are not production dependencies. Rebuild for the deployment environment; local preview build artifacts are not release artifacts.

### Final local results

- 23 existing tests and 6 new source/security tests passed; `npm test` now runs both suites.
- TypeScript and targeted ESLint passed.
- Browser/API checks passed for discovery, collections, ownership, support, signed payment amount validation, replay handling, source withdrawal and quick-play iframe swapping.
- Mobile screenshots at 390 px show no document overflow. First game cards begin around y=430 on Home and y=414 on Explore.
- Production Next build completed successfully. Parallel prerender workers exceeded the disposable database adapter's single connection, so Home/Quick play used the existing empty-data fallbacks during that build. Data-backed rendering was verified separately in the browser preview. Rebuild against the real staging database before release; do not deploy this local preview artifact.
- This work has not been deployed.

### Deployment handoff finding

On September 5, 2026, a read-only Prisma migration status query reported all ten repository migrations as unapplied, including historical migrations. No migration was applied. Reconcile the actual deployed schema and migration history before running migrate deploy; do not blindly apply historical CREATE statements or mark migrations as applied without comparing their effects. Cloudflare login also required renewal. Deployment and provider setup are left to the site owner.


## Arcade showcase hero

The homepage hero now leads with 'One more play could spark your next idea', a large featured-game thumbnail, two supporting thumbnails, creator credit and direct play actions. Rankings aggregate GameAnalytics.plays for published games from the start of the current UTC calendar month, with a five-minute cache keyed to the month. Empty or unavailable monthly analytics show clearly labelled community picks rather than lifetime counts presented as monthly rankings. Existing discovery sections and community/source flows remain. The preferred pixel type, yellow/cyan/red accents, square cards and hard shadows are retained, with responsive layouts and reduced-motion support. Visual previews were reviewed; no test suite or deployment was run.


# Next Action: Unblock Marketing Promotion Loop

The cleanup and platform preparation are complete:
- `/instant-plays` route and source files are completely removed.
- Styling inconsistencies on the upload, edit-game, and authentication forms have been resolved and aligned with the retro arcade theme.
- Code has been verified, committed, and pushed to production via `main`.

To unblock the goal of reaching **100 unique real visitors**, the developer needs to manually publish the launch copy to communities they control.

## Step-by-Step Instructions

### Step 1: Confirm Live Site Deployment
Verify that Vercel or your hosting provider has successfully deployed the latest git commit `eed1b64`.
- Check that visiting `https://www.vibegames.ninja/` has the updated header.
- Verify that attempting to visit `https://www.vibegames.ninja/instant-plays` correctly returns a 404 page.

### Step 2: Choose 2-3 Featured Games
Select your absolute best, most polished games from the arcade (e.g. `Isometric Car Drift` or `Bit Butcher`) to showcase in screenshots/videos.

### Step 3: Post on Hacker News (Show HN)
Submit a post to Hacker News:
- **URL**: `https://news.ycombinator.com/`
- **Title**: `Show HN: VibeGames.Ninja - Play and publish AI-made HTML5 games`
- **Text**: Use the tailored Show HN draft in [docs/promotion_playbook.md](file:///a:/vibegames.ai/docs/promotion_playbook.md#L42-L64).

### Step 4: Reddit Promotion
Post to the following subreddits using your personal Reddit accounts:
- **r/webgames** (Player focus): Use the player-focused title and link: `https://www.vibegames.ninja/games` (Draft: [promotion_playbook.md:L66-L86](file:///a:/vibegames.ai/docs/promotion_playbook.md#L66-L86)).
- **r/SideProject** (Creator focus): Share the tech stack and developer builder value proposition (Draft: [promotion_playbook.md:L87-L114](file:///a:/vibegames.ai/docs/promotion_playbook.md#L87-L114)).

### Step 5: Monitor Analytics
Use your database console or VibeGames analytics route to track the visitor spikes. Once the unique plays or visitors count hits 100, update the status in `.agents/state/goal.md` to `complete`.

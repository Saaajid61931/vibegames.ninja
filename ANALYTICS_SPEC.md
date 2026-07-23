# VibeGames.Ninja — Analytics & Growth Metric Specification

## 1. North Star Metric: Weekly Meaningful Plays (WMP)

### Definition of a "Meaningful Play"
A play event is classified as a **Meaningful Play** if and only if all of the following conditions are met:
1. **Interaction**: Player performs at least one validated user input (keypress, click, touch event) within the game iframe.
2. **Dwell Time**: Active play session duration exceeds **30 seconds** (or reaches game completion / win state prior to 30s).
3. **Validity**: Session passes client-side and server-side anti-bot verification (valid user agent, non-automated heartbeat cadence).

Formula for WMP:
$$WMP = \sum_{\text{week}} \text{Distinct Validated Play Sessions satisfying } (t_{\text{session}} \ge 30s \land \text{InputValidated} = \text{True})$$

---

## 2. Telemetry Pipeline & Event Taxonomy

```typescript
export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "GAME_LOAD_START"
  | "GAME_INTERACTION_FIRST"
  | "GAME_HEARTBEAT"       // Emitted every 10s during play
  | "GAME_MEANINGFUL_REACHED"
  | "GAME_COMPLETED"
  | "GAME_RATED"
  | "GAME_REMIX_INITIATED"
  | "GAME_CHALLENGE_CREATED"
  | "GAME_SHARE_CLICKED"
```

---

## 3. Key Conversion & Retention Metrics

1. **Visitor-to-Play Rate**: Percentage of unique site visitors who initiate at least one game play session.
2. **30-Second Retention Rate**: Percentage of started games that reach the 30-second meaningful play threshold.
3. **Remix Conversion Rate**: Percentage of players who click "Remix" and generate or fork a new Game Capsule.
4. **Viral Coefficient ($K$)**: Average number of new players acquired per shared Game Challenge link or social kit upload.
5. **7-Day Creator Retention**: Percentage of creators who publish or update a Game Capsule within 7 days of initial signup.

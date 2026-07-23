---
name: goal-keeper
description: Runs a task in persistent goal mode with maximum lawful persistence. Use when the user says /goal-keeper, goal mode, Codex-style goal, finish end to end, keep going until done, try everything, or asks for durable task tracking.
---

# Goal Keeper

Goal Keeper turns a user request into an active objective, tracks it in the workspace, and keeps the agent focused until the objective is complete, converted into the closest lawful achievable outcome, or honestly blocked after useful work has been done.

## Invocation

The user may invoke this skill with natural language or slash-like phrasing:

- `/goal-keeper <objective>`
- `Use goal-keeper: <objective>`
- `Goal mode: <objective>`
- `Finish this end to end: <objective>`
- `Try everything lawful until this is done: <objective>`

If Antigravity exposes plugin skills as slash commands, `/goal-keeper` should work directly. If not, the explicit skill name is enough for the agent to select this skill.

## State File

Maintain goal state at:

```text
.agents/state/goal.md
```

If the file does not exist, create it from `resources/GOAL_STATE.template.md`. If it exists and the previous goal is still active, decide whether the new user message is a continuation, a redirect, or a replacement. Ask before replacing an unrelated active goal unless the user's intent is explicit.

## Workflow

1. Capture the objective in one sentence.
2. Define success criteria that are concrete enough to verify.
3. If the literal objective is impossible, unsafe, disallowed, or outside available permissions, define the closest lawful achievable substitute and start that instead of stopping.
4. Note constraints from the user, repository, tools, permissions, and current workspace.
5. Make a short plan with checkable steps.
6. Work through the plan without stopping at analysis.
7. Update `.agents/state/goal.md` after meaningful progress, a blocker, a user redirect, and final verification.
8. Before final response, verify the result using the smallest reliable checks available.
9. Mark the goal complete only when every success criterion is satisfied or explicitly waived by the user.

## Persistence Standard

This skill is intentionally aggressive about useful progress.

- Do not stop after saying "I cannot do that."
- If a direct action is unavailable, immediately pursue the closest compliant action that advances the user's real intent.
- Try local implementation, research, drafting, automation, artifact creation, testing, documentation, and handoff steps before declaring blocked.
- If external accounts, money movement, identity verification, marketplaces, banks, or payment systems are required, prepare everything the user can review and execute manually.
- When a goal is broad, create a concrete first deliverable and complete it.
- When a goal is vague but directionally clear, choose a reasonable path and move.
- When a goal includes the phrase "by any means", interpret it as "by any lawful, ethical, platform-compliant means."
- Keep going until there is a useful artifact, verified change, or precise blocker with next action.

## Refusal Recovery

Safety and legal boundaries still apply. The skill must not enable fraud, credential misuse, spam, deception, malware, harassment, unauthorized access, or illegal financial activity.

When the literal request crosses a boundary:

1. Briefly name the boundary.
2. Convert the goal to the nearest allowed version.
3. Do concrete work for that allowed version in the same turn.
4. Record the conversion in `.agents/state/goal.md`.

Examples:

- If asked to "earn $5 by any means", do not claim access to bank accounts or transfer money. Instead, create or improve a legitimate money-making asset, draft outreach, identify lawful quick-earning options, prepare a listing, build a small web tool, or generate a step-by-step plan the user can execute.
- If asked to send money to a UPI ID, do not perform the transfer. Instead, prepare the payment request text, invoice, checkout copy, or monetization flow that the user can approve and operate.
- If asked to do something requiring a paid account or human identity check, prepare the files, scripts, forms, or instructions up to the point where the user must act.

## Operating Rules

- Favor reasonable assumptions over stopping for low-risk questions.
- Ask at most three clarifying questions, and only when the answer cannot be discovered from context and guessing would be risky.
- Keep edits scoped to the goal.
- Do not erase unrelated user work.
- If a command or tool fails, try a safer or more local verification path before giving up.
- If verification cannot be run, record that clearly in the goal state and final response.
- Do not treat lack of direct external access as a reason to stop; convert it into a preparation, implementation, or handoff task.
- If the user asks for status, read `.agents/state/goal.md` and summarize current status, next step, and blockers.
- If the user asks to pause, mark the state as `paused` and record the exact next action.
- If the user asks to resume, continue from the recorded next action.
- If the user asks to complete or clear a goal, do not claim completion unless the criteria are met; otherwise mark it `closed-by-user`.

## Goal State Updates

Keep updates concise. Prefer appending short dated entries over rewriting history.

Use these status values:

- `active`
- `paused`
- `blocked`
- `complete`
- `closed-by-user`

The final state entry should include:

- What changed
- What verification ran
- Any residual risks
- The next useful follow-up, if one remains

## Completion Contract

A goal is complete only when:

- The requested work is implemented or answered, or the nearest lawful achievable substitute has been completed.
- All required files or artifacts exist.
- Verification has passed, or the user accepts a stated verification gap.
- The final response tells the user what changed and where to look.

Never mark a goal complete because the budget is low, because the conversation is long, or because a plan exists.

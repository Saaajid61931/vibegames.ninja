# Goal Keeper

Goal Keeper is an Antigravity 2.0 customization that gives the agent a persistent, Codex-style goal workflow without relying on private Antigravity internals.

It packages:

- `goal-keeper` skill: turns a request into an active goal, tracks progress, verifies completion, and keeps working until the task is genuinely handled.
- `goal-keeper` rule: keeps the workflow opt-in and prevents the rule from changing normal conversations.
- `GOAL_STATE.template.md`: the state file shape the agent uses when it creates `.agents/state/goal.md`.

## Antigravity 2.0 Install

For Antigravity 2.0 desktop projects, this workspace now includes the direct project-level skill and rule locations:

```text
.agents/skills/goal-keeper/
.agents/rules/goal-keeper.md
```

Those are the safest paths for Antigravity 2.0 project customizations.

The plugin bundle is also kept here for plugin-based surfaces such as Antigravity CLI or plugin import flows:

```text
.agents/plugins/goal-keeper/
```

Open this folder as part of your Antigravity 2.0 Project, then start a new agent or restart the existing agent so it reloads project customizations.

To use the skill globally across all Antigravity 2.0 projects, copy the skill folder to:

```text
~/.gemini/antigravity/skills/goal-keeper/
```

## Use

Try one of these forms:

```text
Use the goal-keeper skill: Build the feature, test it, and report what changed.
```

```text
/goal-keeper Build the feature, test it, and report what changed.
```

Antigravity 2.0 also has a built-in `/goal` command. Goal Keeper is intentionally named `/goal-keeper` so it does not depend on overriding a built-in command.

## State

When active, the skill maintains:

```text
.agents/state/goal.md
```

The state file records the objective, success criteria, plan, progress, verification, blockers, and completion notes.

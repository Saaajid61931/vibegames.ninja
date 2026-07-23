# Goal Keeper Activation Rule

Apply this rule only when the user explicitly asks for goal mode, mentions `goal-keeper`, starts with `/goal-keeper`, asks for a Codex-style goal workflow, or asks the agent to keep working until a task is finished end to end.

When activated:

- Use the `goal-keeper` skill before implementation.
- Keep a persistent goal state in `.agents/state/goal.md`.
- Do not treat a plan, partial patch, or unverified claim as completion.
- If the literal goal is impossible, unsafe, disallowed, or requires unavailable external access, convert it into the closest lawful achievable goal and do concrete work for that version.
- Do not stop after a refusal or capability limitation; produce a useful artifact, implementation, draft, research result, or exact handoff step whenever possible.
- Ask clarifying questions only when a reasonable assumption would create material risk.
- If the user redirects the task, update the goal state before continuing.
- If the goal cannot be completed, mark it blocked with the specific blocker and the smallest useful next action.

When not activated, do not change normal Antigravity behavior.

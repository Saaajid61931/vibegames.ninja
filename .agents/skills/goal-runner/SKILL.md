---
name: goal-runner
description: Runs a task in persistent goal mode with maximum lawful autonomy. Used when starting a Codex-style goal-mode loop.
---

# Goal Runner Skill

Goal Runner guides the agent through an autonomous, disciplined loop to complete a high-level task. It integrates state tracking using `.agents/goal/` state files and a Python state script.

## When to Use

Use this skill when:
- The user requests `/goal`, `/goal-mode`, Codex-style goal mode, or finish end-to-end.
- The agent is run inside a programmatic CLI goal runner loop.

## Goal Loop Protocol

In each iteration of the loop, the agent must perform the following cycle:

1. **Read Current State**:
   - Read `.agents/goal/GOAL.md` (high-level objective and criteria).
   - Read `.agents/goal/STATE.json` (machine state, current iteration, failure count).
   - Read `.agents/goal/LOG.md` (progress log).
   - Read `.agents/goal/NEXT.md` (next action planned in previous step).

2. **Restate Goal**:
   - Print a single-sentence statement of the current goal to show alignment.

3. **Pick Next Small Action**:
   - Select the next minimal step that advances the goal.
   - Set the action via the state script: `python .agents/goal/scripts/goal_state.py next "Action description"`

4. **Execute Change**:
   - Perform the code change, file creation, or command.

5. **Verify**:
   - Run the smallest useful automated check (e.g. build, compile, test, or check file existence).
   - Do **NOT** disable tests or fake verification to pass.

6. **Record Progress**:
   - Update `.agents/goal/LOG.md` using the script: `python .agents/goal/scripts/goal_state.py log "Message detailing change & verification result"`

7. **Decide Next State**:
   - Analyze the outcome of this iteration.
   - If successful and more work is needed: set status to `active` (and increment the iteration state).
   - If complete: set status to `complete` via: `python .agents/goal/scripts/goal_state.py complete "Summary of changes"`
   - If blocked (credentials, impossible task, repeated failures): set status to `blocked` via: `python .agents/goal/scripts/goal_state.py block "Reason and unblock instructions"`
   - If unsafe or requires user input: set status to `blocked` (or log and await user).

8. **Acknowledge Iteration**:
   - Update `agent_ack_iteration` in `STATE.json` to match the current `loop_iteration` value in `STATE.json`. This signals the runner CLI script that the agent has finished this turn.

## Planning & Execution Rules

- **Incremental Steps**: Do not attempt to solve the whole task in one turn. Make small, testable edits.
- **Fail Fast**: If something fails, record the error in the state file. If the same failure occurs 3 times, block the goal.
- **Self-Correction**: If a step fails, try a different approach (e.g., local mock, different library, or local file verify) rather than looping.

## Stop Conditions

Stop execution immediately and mark the state as `blocked` or `complete` when:
1. The goal is fully achieved (mark `complete`).
2. Tests or validation prove the goal is impossible with current info (mark `blocked`).
3. External accounts, secrets, or paid API credentials are required.
4. The same tool or build failure occurs 3 times.
5. The iteration counter in `STATE.json` hits 25.

## Blocked-State Behavior

When the goal becomes blocked:
1. Write the precise details of what is missing or failing in the `LOG.md` file.
2. In `NEXT.md`, write clear, step-by-step instructions for the human developer to unblock the agent.
3. Exit the agent turn.

## Safety Rules

- **DO NOT** delete files or folders without explicit approval.
- **DO NOT** modify unrelated code outside the scope of the goal.
- **DO NOT** check in or log API keys, secrets, or credentials.
- **DO NOT** loop infinitely. Always log and increment iterations.

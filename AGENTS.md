# Project Instructions

## Apply Folder Changes

When the user says the exact phrase **"Apply folder changes"**, perform the following workflow:

1. Treat `<repository-root>/Changes` as an incoming change bundle. Never treat files inside `Changes` as project destinations.
2. Read these handoff files first when they exist:
   - `Changes/CHANGE_MANIFEST.md`
   - `Changes/changes.patch`
   - Payload files under `Changes/files/<repository-relative-path>`
3. Treat `changes.patch` as the canonical record of added and deleted lines. Use payload files as reference copies and as the complete content for new files.
4. Apply every declared action to its repository-relative destination:
   - `ADD`: move the payload file to its declared destination.
   - `MODIFY`: apply only the supplied diff hunks while preserving unrelated code and local changes.
   - `DELETE`: delete the destination only when the deletion is explicitly declared.
   - `RENAME`: move the explicitly declared old path to the new path, then apply any associated modifications.
5. Never blindly overwrite an existing modified file with a payload copy. Compare the payload, patch, and current project file, then integrate only the intended changes.
6. If patch context has drifted, attempt a careful context-based merge. If the destination or intended merge is ambiguous, do not guess. Leave the item in `Changes` and report the conflict.
7. If no manifest or patch exists:
   - Derive destinations from the directory structure under `Changes/files`.
   - Compare each payload with its matching project file and integrate only the differences.
   - Never infer a destination from a filename alone when more than one destination is possible.
8. Reject any incoming path that escapes the repository or targets `.git`, dependency folders, build output, caches, credentials, or environment files unless the user explicitly requested it.
9. Do not pull, commit, push, install dependencies, reformat unrelated code, or make additional improvements as part of this trigger.
10. After an item is successfully applied, remove its payload from `Changes`. Keep unresolved items. When every item succeeds, empty `Changes` but keep the folder available for future bundles.
11. Finish by reporting:
    - Files added, modified, deleted, or renamed
    - Which additions and deletions were applied
    - Any conflicts or files remaining in `Changes`


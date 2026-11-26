---
name: task-verification-review
description: Verify Jira acceptance criteria, choose focused Node or build checks, review the final diff, and prepare a PR handoff. Use for task verification, diff review, or PR preparation.
---

# Task verification and review

1. Match each acceptance criterion to a file or behavior and a check. Check `git status --short`, the diff, and new files. Look for duplicate declarations, copied headers, broken imports, merge leftovers, and unrelated edits. Use `git diff --check` for tracked changes and inspect new files too.
2. Confirm commands against [package.json](../../../package.json). For changed server `.js` or supported `.mjs` files, use `node --check` on the specific files. For frontend changes, run `npm run build` and use the [UI skill](../shared-ui-integration/SKILL.md) for browser checks. For documentation-only work, check links, metadata, and guidance instead of running application checks.
3. For behavior changes, use `node:test` and `node:assert/strict`; follow [auth test stubs](../../../tests/auth.test.js) or the [class API harness](../../../tests/classes.test.js). Avoid live services and shared data. Run focused files with `node --test` followed by their paths. For the suite, try `npm test` (`node --test tests/`); if Node rejects the directory invocation, run `node --test tests/*.test.js` from the repo root and report both results separately. Do not change runners to work around it.
4. Prepare a plain-language handoff: what changed, acceptance criteria covered, automated results, manual checks, and unperformed or blocked checks. Flag follow-up work and any separate Jira subtasks. Review does not authorize a commit, push, or PR creation.

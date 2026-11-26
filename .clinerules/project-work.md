# Project scope and handoff

Express serves static HTML/CSS/JavaScript and a React/Vite frontend with Tailwind. MySQL access uses `mysql2`.

- Inspect the existing flow before adding anything. Reuse services, endpoints, components, and layouts. Keep Express handlers focused on request validation, middleware, service calls, and responses; keep reusable business logic and SQL in services.
- Check `git status --short` before editing. Stay within the assigned Jira task, preserve teammate changes, and avoid broad reformatting or folder restructuring. Do not hand-edit generated `dist/` files or `node_modules/`.
- Keep implementation changes separable by Jira subtask. When explicitly asked to commit, use `HOW-<subtask number>: <clear action>`. Do not commit, push, merge, force-push, or rewrite history without an explicit request.
- Update the [README](../README.md) when setup, commands, required environment variables, usage, or architecture changes. Skip README edits for unrelated styling, tests, or internal refactoring.
- Activate [task-verification-review](../.cline/skills/task-verification-review/SKILL.md) when verifying a Jira task, reviewing a diff, or preparing a PR. Run checks appropriate to the scope and report automated, manual, and unperformed checks separately. Explain changes and remaining integration work in plain language.

Load every relevant skill as its scope is encountered. If the skill tool is unavailable, read its linked `SKILL.md` directly. See the [team guide](../docs/cline-team-guide.md) for the file map and known gaps.

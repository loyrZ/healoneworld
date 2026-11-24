# Cline team guide

Open the repository root in VS Code. In Cline, click the scale icon next to the model selector. In **Rules**, check that the five workspace rules below are enabled. In **Skills**, check that the four workspace skills are enabled. Cline discovers these files from the repo; there's no need to copy them into personal settings. See the official [Rules](https://docs.cline.bot/customization/cline-rules) and [Skills](https://docs.cline.bot/customization/skills) docs.

Start with the Jira subtask and its acceptance criteria. Rules apply whenever enabled; Cline loads skills when their descriptions match the work. You can also type `/` and select an enabled skill by name. A class cancellation change, for example, can need both `database-api-change` and `clerk-api-change`, plus `task-verification-review` at handoff.

| Standing rule | What it covers |
| --- | --- |
| [project-work.md](../.clinerules/project-work.md) | Jira scope, Git safety, README updates, and handoff |
| [javascript-style.md](../.clinerules/javascript-style.md) | JavaScript, React, and module conventions |
| [clerk-api.md](../.clinerules/clerk-api.md) | Sign-in, backend identity and ownership, and secrets |
| [data-api.md](../.clinerules/data-api.md) | Shared records, server validation, and public/private data |
| [shared-ui.md](../.clinerules/shared-ui.md) | Layout reuse, accessible UI, and route checks |

| Skill | When to use it |
| --- | --- |
| [/clerk-api-change](../.cline/skills/clerk-api-change/SKILL.md) | Trace sign-in, verification, account links, or identity-based access |
| [/database-api-change](../.cline/skills/database-api-change/SKILL.md) | Change an API contract, schema, or shared record workflow |
| [/shared-ui-integration](../.cline/skills/shared-ui-integration/SKILL.md) | Wire a static or React page, layout, style, or interactive control |
| [/task-verification-review](../.cline/skills/task-verification-review/SKILL.md) | Check acceptance criteria, review changes, or prepare a PR handoff |

When a convention changes, update the one rule that owns it and the affected skill examples. Keep skill names matched to their directories, descriptions specific, and links relative to their containing files. Review the [actual npm scripts](../package.json) when commands change. The test runner stays `node:test`; `npm test` invokes `node --test tests/`. If that directory form fails, use the explicit test-file fallback in the review skill and report the actual outcomes.

## Known gaps — not patterns to copy

- The [standalone registration flow](../Register%20For%20Classes%20Page/RegisterForClass.js) and [React user-classes page](../public/components/Classes/UserClasses.jsx) still use browser storage. [The count service](../services/class-registrations.js) returns no known counts. Shared registration and cancellation still need a backend source of truth; do not infer zero from the stub.
- The [volunteer API](../routes/volunteer.js) still uses [separate volunteer middleware](../middleware/volunteer.js). The [central role helper](../middleware/auth.js) exposes the instructor permission but does not accept `requireRole("instructor")`. Verify the specific backend permission and ownership path before wiring instructor actions into the volunteer portal.
- The [README](../README.md) contains historical table-setup and push examples. They are not authorization to run database setup or push. `enginestart` also runs `builddb`; do not use it as a safe verification shortcut. Coordinate any shared schema rollout or deployment separately.

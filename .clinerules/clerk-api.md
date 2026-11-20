# Activate the Clerk API change skill

Before editing any code that calls or configures Clerk, or changes behavior that depends on Clerk identity, activate the `clerk-api-change` skill. This includes `@clerk/express` and `@clerk/react` integration, sign-in and sign-up callbacks, session and email verification, account linking, and identity-based access or ownership checks.

Apply this rule even when the task never mentioned Clerk: if you discover relevant code mid-task, load the skill before editing it. If the skill tool is unavailable, read and follow [the skill file](../.cline/skills/clerk-api-change/SKILL.md) directly. Unrelated styling or copy edits that leave Clerk-dependent behavior unchanged do not require the skill.
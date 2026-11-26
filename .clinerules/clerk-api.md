# Authentication and ownership

- Use the existing Clerk flow for sign-in, passwords, sessions, and email verification. MySQL owns application users and permissions. Do not add email-only or local-password login.
- Reuse the application-user service and auth middleware to resolve identity, roles, and ownership on the backend. A typed email, URL user ID, `localStorage` value, or hidden button is never proof of identity or permission.
- Keep secret keys and session tokens out of source, frontend bundles, logs, and test fixtures. Document environment variable names, never values.

Activate [clerk-api-change](../.cline/skills/clerk-api-change/SKILL.md) before changing Clerk integration or identity-dependent behavior, even if you discover the dependency mid-task. Unrelated styling or copy edits do not require it.

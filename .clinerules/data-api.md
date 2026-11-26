# Database and API consistency

- MySQL is the shared source of truth for registrations, cancellations, permissions, and approval state. Browser storage is not the final implementation of shared records.
- Validate input and enforce authorization on the server. Use stable IDs and parameterized queries. Use transactions and database constraints when related writes or concurrent requests could violate a data rule.
- Keep unknown counts unknown (for example, `null`), not zero. Keep pending changes separate from approved public content, including edits to already-published records.
- Exclude private meeting links and account data from public responses. Expose private fields only to authorized callers who need them.
- Prepare migrations for review; do not automatically apply them to the shared database.

Activate [database-api-change](../.cline/skills/database-api-change/SKILL.md) for schema, persistence, or API contract changes.

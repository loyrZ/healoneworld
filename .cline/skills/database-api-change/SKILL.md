---
name: database-api-change
description: Plan and verify MySQL or Express API changes involving schema, validation, ownership, registrations, cancellations, counts, or approvals. Use before editing persistent data or an API contract.
---

# Database and API changes

1. Trace the route, service, schema, and callers before choosing a contract. Start with [class routes](../../../routes/classes.js), [class data contract](../../../docs/class-data.md), and [class service](../../../services/classes.js) for validation and separate public/admin response shapes.
2. Identify the actor and stable record ID. Allowlist writable fields, validate IDs and values, and check role and ownership before reading or writing protected data. Load [clerk-api-change](../clerk-api-change/SKILL.md) if Clerk identity is involved. Check what each caller can see before and after an approval.
3. Decide what must remain true across retries and concurrent requests. Use placeholders for SQL values; enforce uniqueness or relationships with database constraints where needed. For related writes, follow the single-connection transaction, row lock, rollback, and release examples in [class updates](../../../services/classes.js) and [volunteer decisions](../../../services/volunteer-applications.js). Do not trigger external side effects in automated checks.
4. For schema changes, review the [fresh-schema loader](../../../bin/dbloader.js) and existing migration examples for [Clerk associations](../../../migrations/001_clerk_user_association.sql) and [class scheduling](../../../migrations/002_class_schedule_fields.sql). Prepare SQL and document rollout order, backfill needs, and rollback or recovery. Do not run a shared migration or database setup as verification.
5. Use [class API tests](../../../tests/classes.test.js) as a stubbed test example. Cover applicable invalid input, denied access, duplicate or concurrent writes, rollback, unknown versus zero counts, and public response filtering. Report any behavior that still needs isolated database or integration verification.

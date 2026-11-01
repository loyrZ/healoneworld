# Clerk and application user records

## Ownership

Clerk manages authentication, passwords, sessions, and email verification.

MySQL stores application profiles, permissions, and feature data.
users.clerk_user_id connects an application user to their Clerk identity.
MySQL name and email fields are snapshots taken when the user is created.
Changing these snapshots does not change the Clerk account.

Existing password hashes are preserved for migration purposes.
Clerk-managed accounts store NULL in password_hash.
Application code must not use legacy hashes as a second sign-in system.

## Backend usage

After Clerk middleware has verified the request, call:

const { getOrCreateApplicationUser } =
  require("../services/application-user");

const user = await getOrCreateApplicationUser(req);

The helper returns id, clerkUserId, name, and email.
It does not return password hashes.

Never use a browser-supplied user ID as authenticated identity.
Role checks are provided separately under HOW-532.

## New users

New users receive a permission record with instructor, volunteer,
staff, and admin set to false.

Repeated requests reuse the same Clerk association.
Unique database constraints prevent duplicate Clerk IDs.

## Existing users

Existing records remain unlinked until reviewed.
Matching email text alone never attaches a Clerk identity.

If an existing email prevents account creation, the helper returns 409.
A designated administrator must verify ownership through an agreed
process before any account is linked.

Until that process is approved, leave the existing record unchanged.
Do not delete accounts, replace password hashes, or copy privileges.

Any approved linking operation must:
- Confirm the exact existing application-user ID and Clerk user ID.
- Confirm the Clerk ID is not already linked elsewhere.
- Preserve existing profile data and permissions.
- Update only an unlinked record.
- Record the approval without including secrets.

## Database setup

bin/dbloader.js defines the schema for fresh databases.

Existing databases require:
migrations/001_clerk_user_association.sql

Changing CREATE TABLE IF NOT EXISTS does not update existing tables.
The migration is intended to run once after team coordination.
MySQL schema changes may commit immediately and should not be treated
as safely reversible through a normal transaction rollback.

Do not run the migration against the shared database until coordinated.

## Verification

Run:

node --test tests/application-user.test.js

These tests use simulated Clerk and database responses.
They cover signed-out access, unverified email, first-time linking,
repeated linking, email conflicts, and database failures.

The migration was applied successfully to the shared Railway database.
The resulting columns, unique Clerk ID constraint, and default permission
values were confirmed. Live Clerk sign-in and simultaneous-request
checks remain pending for integration verification under HOW-533.
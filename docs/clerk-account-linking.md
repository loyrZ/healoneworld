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

## Shared access checks

middleware/auth.js provides:

- requireApplicationUser: allows signed-in users with valid application
  permissions, including standard users.
- requireRole("administrator"): requires the MySQL admin permission.
- requireRole("approved-volunteer"): requires the MySQL volunteer permission.

Protected handlers receive req.applicationUser and
req.applicationPermissions. Use req.applicationUser.id for the signed-in
user's application records, rather than an ID supplied by the browser.

Instructor permission alone does not grant approved-volunteer access.
Unknown roles and missing or invalid permissions are rejected.
Unexpected database failures are passed to the server error handler.

The existing isLoggedIn and isAdmin export names remain available.

Run the simulated identity and permission tests with:

node --test tests/application-user.test.js tests/auth.test.js

## Account flow

- /sign-up uses Clerk's signup component.
- /sign-in uses Clerk's sign-in component.
- Successful authentication currently leads to /account.
- The dashboard and settings pages call /api/account before loading.
- /api/account uses verified Clerk identity, not browser-supplied user IDs.
- The old UserSignUp page redirects to /sign-up.
- routes/signup.js still contains legacy class-data queries. It is not
  used for account creation and is preserved for the class-data owner.
- Role-specific dashboard destinations require coordination with their owners.

## Required environment variables

Authentication:
- VITE_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

Database:
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME

Keep values in the local environment. Never commit or log secrets.
The shared Railway migration has already been applied; do not rerun it.

## Manual integration results

Passed:
- Account creation through Clerk.
- Dashboard access with a linked MySQL user.
- Returning to the dashboard while signed in.
- One linked user, one unique Clerk ID, and no missing permission record.
- Protected account access rejected after sign-out.
- Dashboard requests sign-in after sign-out.
- Public homepage remains accessible while signed out.

Pending:
- Browser-supplied user ID is ignored during authenticated access.
- Public calendar/class page remains accessible while signed out.
- Simultaneous requests reuse one MySQL user record.
- Live administrator and approved-volunteer access checks.

The temporary test email is no longer accessible. Further authenticated
checks require a verified test account with a durable email address.
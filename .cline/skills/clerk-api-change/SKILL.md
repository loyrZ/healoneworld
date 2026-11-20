---
name: clerk-api-change
description: Apply Heal One World's Clerk change checklist before editing @clerk/express or @clerk/react usage, Clerk configuration, sign-in or sign-up callbacks, session and email verification, account linking, or code that relies on Clerk identity for access or ownership. Use even when the Clerk dependency is discovered during an unrelated task.
---

# Clerk API changes

## Before editing

1. Read the [Clerk account-linking guide](../../../docs/clerk-account-linking.md) and trace the affected flow from the React component or hook to the Express middleware, route, and service. Start with `app.js`, `middleware/auth.js`, or `services/application-user.js`, as appropriate.
2. If changing an SDK call or configuration option, check the installed SDK version in `package-lock.json` and verify the API against the corresponding Clerk documentation. Do not upgrade the SDK as part of an unrelated edit.

## Preserve the identity and permission boundaries

- Clerk owns sign-in, passwords, sessions, and email verification. MySQL owns application profiles and permissions; `users.clerk_user_id` links the two. Do not use legacy password hashes for sign-in.
- Resolve the signed-in user from the verified server request, never from a user ID supplied by the browser. For protected routes, reuse `requireApplicationUser` or the applicable `requireRole(...)` check from `middleware/auth.js`. Use `req.applicationUser.id` for records owned by the signed-in application user. Client UI checks do not replace server authorization.
- Keep account creation and reuse in `getOrCreateApplicationUser`. New users start without elevated permissions. Never link an existing account based on matching email alone: an unlinked email collision must return `409` and leave the existing account unchanged. Do not perform existing-account linking or run shared-database migrations without team approval.
- Preserve the distinction between signed-out (`401`), insufficient access (`403`), and account-linking conflict (`409`). Unexpected Clerk or database failures must not grant access.
- Keep Clerk secret keys and session tokens out of browser bundles, logs, source files, and test fixtures. Use simulated SDK and database responses for local tests.

## Verify the affected flow

- Run `node --test tests/application-user.test.js tests/auth.test.js` for server identity, permissions, or account-linking changes. Add or update focused tests for changed behavior, such as denied access, unverified email, repeated requests, or an email collision. Run `npm test` when changing application behavior.
- For React changes, run `npm run build` and check the affected sign-in, callback, verification, or session flow. Separate what was verified locally from anything that still needs a live Clerk integration check; do not use live credentials or the shared database for automated tests.
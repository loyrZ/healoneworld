---
name: clerk-api-change
description: Review Clerk integration before changing SDK calls, configuration, sign-in or sign-up callbacks, session or email verification, account linking, or identity-based access and ownership. Use even when Clerk is discovered mid-task.
---

# Clerk API changes

1. Read the [account-linking guide](../../../docs/clerk-account-linking.md). Trace the affected flow from [the React entry](../../../public/main.jsx) or [Clerk callback](../../../public/components/Login/ClerkCallback.jsx) through [Express setup](../../../app.js) to the affected route, such as [the account API](../../../routes/account.js).
2. For SDK calls or configuration, check the pinned version in [package-lock.json](../../../package-lock.json) and consult the matching Clerk documentation. Do not upgrade the SDK as part of unrelated work.
3. In [auth middleware](../../../middleware/auth.js), use `requireApplicationUser` or an applicable supported `requireRole(...)` check. For caller-owned records use `req.applicationUser.id`. Preserve `401` for signed out, `403` for insufficient access, and `409` for an unlinked email collision; fail closed on unexpected errors.
4. Keep account creation and reuse in [`getOrCreateApplicationUser`](../../../services/application-user.js). Use the verified Clerk ID association (`users.clerk_user_id`), give new users no elevated permissions, and leave an existing account unchanged on an email collision. Do not perform existing-account linking without team approval.
5. For changed server behavior, run `node --test tests/application-user.test.js tests/auth.test.js` and cover the relevant denied-access, unverified-email, repeat-request, or collision case with simulated SDK and database responses. For React auth changes, check the affected sign-in, callback, verification, or session flow. Use [task-verification-review](../task-verification-review/SKILL.md) for build and handoff checks; report live Clerk checks separately.

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function setup({
  signedIn = true,
  permissions = {
    instructor: 0,
    volunteer: 0,
    staff: 0,
    admin: 0
  },
  databaseError = false
} = {}) {
  const sandbox = {
    module: { exports: {} },

    require(name) {
      if (name === "../services/application-user") {
        return {
          async getOrCreateApplicationUser() {
            if (!signedIn) {
              const error = new Error("Please sign in.");
              error.status = 401;
              throw error;
            }

            return {
              id: 7,
              clerkUserId: "user_verified",
              name: "Test User",
              email: "test@example.com"
            };
          }
        };
      }

      if (name === "../conf/database") {
        return {
          async execute(sql, values) {
            // Permissions must use the linked application's user ID.
            assert.equal(values[0], 7);

            if (databaseError) {
              throw new Error("Database unavailable");
            }

            return [permissions ? [permissions] : []];
          }
        };
      }

      throw new Error(`Unexpected import: ${name}`);
    }
  };

  const filename = path.join(
    __dirname,
    "..",
    "middleware",
    "auth.js"
  );

  vm.runInNewContext(
    fs.readFileSync(filename, "utf8"),
    sandbox,
    { filename }
  );

  return sandbox.module.exports;
}

async function run(middleware) {
  const req = {
    body: { userId: 999, admin: true },
    query: { userId: 999 }
  };

  const result = {
    req,
    status: null,
    body: null,
    nextCalled: false,
    error: null
  };

  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    }
  };

  await middleware(req, res, (error) => {
    result.nextCalled = true;
    result.error = error || null;
  });

  return result;
}

test("signed-out access receives 401", async () => {
  const auth = setup({ signedIn: false });
  const result = await run(auth.requireApplicationUser);

  assert.equal(result.status, 401);
  assert.equal(result.nextCalled, false);
});

test("standard users receive their verified application identity", async () => {
  const auth = setup();
  const result = await run(auth.requireApplicationUser);

  assert.equal(result.nextCalled, true);
  assert.equal(result.error, null);
  assert.equal(result.req.applicationUser.id, 7);
  assert.equal(result.req.applicationPermissions.administrator, false);
});

test("standard users cannot access administrator resources", async () => {
  const auth = setup();
  const result = await run(auth.requireRole("administrator"));

  assert.equal(result.status, 403);
  assert.equal(result.nextCalled, false);
});

test("administrators can access administrator resources", async () => {
  const auth = setup({
    permissions: {
      instructor: 0,
      volunteer: 0,
      staff: 0,
      admin: 1
    }
  });

  const result = await run(auth.isAdmin);

  assert.equal(result.nextCalled, true);
  assert.equal(result.error, null);
});

test("approved volunteers can access volunteer resources", async () => {
  const auth = setup({
    permissions: {
      instructor: 0,
      volunteer: 1,
      staff: 0,
      admin: 0
    }
  });

  const result = await run(auth.requireRole("approved-volunteer"));

  assert.equal(result.nextCalled, true);
  assert.equal(result.error, null);
});

test("instructor permission alone does not grant volunteer access", async () => {
  const auth = setup({
    permissions: {
      instructor: 1,
      volunteer: 0,
      staff: 0,
      admin: 0
    }
  });

  const result = await run(auth.requireRole("approved-volunteer"));

  assert.equal(result.status, 403);
  assert.equal(result.nextCalled, false);
});

test("unknown roles are rejected", async () => {
  const auth = setup();
  const result = await run(auth.requireRole("unknown"));

  assert.equal(result.status, 403);
  assert.equal(result.nextCalled, false);
});

test("missing permission records are rejected", async () => {
  const auth = setup({ permissions: null });
  const result = await run(auth.requireApplicationUser);

  assert.equal(result.status, 403);
  assert.equal(result.nextCalled, false);
});

test("unexpected permission values are rejected", async () => {
  const auth = setup({
    permissions: {
      instructor: 0,
      volunteer: 0,
      staff: 0,
      admin: "false"
    }
  });

  const result = await run(auth.requireApplicationUser);

  assert.equal(result.status, 403);
  assert.equal(result.nextCalled, false);
});

test("database failures reach the error handler without granting access", async () => {
  const auth = setup({ databaseError: true });
  const result = await run(auth.requireApplicationUser);

  assert.equal(result.nextCalled, true);
  assert.equal(result.error.message, "Database unavailable");
  assert.equal(result.req.applicationUser, undefined);
});
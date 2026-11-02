"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function setup({
  signedIn = true,
  verified = true,
  conflict = false,
  databaseError = false
} = {}) {
  const users = [];
  const permissions = [];
  let databaseCalls = 0;
  let rollbacks = 0;

  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {
      rollbacks += 1;
    },
    release() {},

    async execute(sql, values) {
      if (databaseError) {
        throw new Error("Database unavailable");
      }

      if (sql.includes("INSERT INTO users")) {
        if (!conflict && !users.some(
          (user) => user.clerk_user_id === values[0]
        )) {
          users.push({
            id_pk: 1,
            clerk_user_id: values[0],
            name: values[1],
            email: values[2]
          });
        }
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("SELECT id_pk")) {
        return [users.filter(
          (user) => user.clerk_user_id === values[0]
        )];
      }

      if (sql.includes("INSERT INTO permission")) {
        assert.match(
          sql,
          /VALUES \(\?, FALSE, FALSE, FALSE, FALSE\)/
        );

        if (!permissions.includes(values[0])) {
          permissions.push(values[0]);
        }

        return [{ affectedRows: 1 }];
      }

      throw new Error("Unexpected database query");
    }
  };

  const fakeClerk = {
    getAuth() {
      return signedIn
        ? { userId: "user_verified", sessionId: "session_verified" }
        : { userId: null, sessionId: null };
    },

    clerkClient: {
      users: {
        async getUser(id) {
          assert.equal(id, "user_verified");

          return {
            firstName: "Test",
            lastName: "User",
            primaryEmailAddressId: "email_1",
            emailAddresses: [{
              id: "email_1",
              emailAddress: "test@example.com",
              verification: {
                status: verified ? "verified" : "unverified"
              }
            }]
          };
        }
      }
    }
  };

  const fakeDatabase = {
    async getConnection() {
      databaseCalls += 1;
      return connection;
    }
  };

  const filename = path.join(
    __dirname,
    "..",
    "services",
    "application-user.js"
  );

  const sandbox = {
    module: { exports: {} },
    require(name) {
      if (name === "@clerk/express") return fakeClerk;
      if (name === "../conf/database") return fakeDatabase;
      throw new Error(`Unexpected import: ${name}`);
    }
  };

  vm.runInNewContext(
    fs.readFileSync(filename, "utf8"),
    sandbox,
    { filename }
  );

  return {
    link: sandbox.module.exports.getOrCreateApplicationUser,
    users,
    permissions,
    databaseCalls: () => databaseCalls,
    rollbacks: () => rollbacks
  };
}

test("signed-out requests receive 401 without database access", async () => {
  const state = setup({ signedIn: false });

  await assert.rejects(state.link({}), { status: 401 });
  assert.equal(state.databaseCalls(), 0);
});

test("unverified email receives 403 without database access", async () => {
  const state = setup({ verified: false });

  await assert.rejects(state.link({}), { status: 403 });
  assert.equal(state.databaseCalls(), 0);
});

test("verified identity creates a user and default permissions", async () => {
  const state = setup();

  const user = await state.link({
    body: { userId: "forged_id", admin: true }
  });

  assert.equal(user.clerkUserId, "user_verified");
  assert.equal(user.id, 1);
  assert.equal(state.users.length, 1);
  assert.equal(state.permissions.length, 1);
  assert.equal("password_hash" in user, false);
});

test("repeated requests reuse the linked user", async () => {
  const state = setup();

  const first = await state.link({});
  const second = await state.link({});

  assert.equal(first.id, second.id);
  assert.equal(state.users.length, 1);
  assert.equal(state.permissions.length, 1);
});

test("email conflict requires reviewed linking instead of automatic linking", async () => {
  const state = setup({ conflict: true });

  await assert.rejects(state.link({}), { status: 409 });
  assert.equal(state.permissions.length, 0);
  assert.equal(state.rollbacks(), 1);
});

test("database failures are returned instead of granting access", async () => {
  const state = setup({ databaseError: true });

  await assert.rejects(state.link({}), {
    message: "Database unavailable"
  });

  assert.equal(state.rollbacks(), 1);
});
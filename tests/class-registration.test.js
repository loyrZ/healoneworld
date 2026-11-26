"use strict";

// HOW-228 / HOW-379: saving registrations to class_registrations.
// In-memory only, so the shared Railway database is never touched. Two people
// racing for the last seat needs a real MySQL lock to prove (HOW-380 #6), so
// that case isn't covered here.

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");

const root = path.join(__dirname, "..");

function stub(relative, exports) {
  const filename = require.resolve(path.join(root, relative));
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

// --- Fake database (mirrors class_registrations in the shared database) ---

function createFakeDb() {
  const classes = new Map([
    [1, { status: "published", capacity: 2, starts_at: "2099-01-01 10:00:00" }],
    [2, { status: "canceled", capacity: 10, starts_at: "2099-01-02 10:00:00" }],
    [3, { status: "pending", capacity: 10, starts_at: "2099-01-03 10:00:00" }],
    [4, { status: "published", capacity: 10, starts_at: "2020-01-01 10:00:00" }],
    [5, { status: "published", capacity: 1, starts_at: "2099-01-05 10:00:00" }]
  ]);

  // User 7 already holds the only seat in class 5. User 8 cancelled class 1
  // themselves; user 9 was removed from class 1 by an admin.
  const registrations = [
    { id_pk: 1, class_id: 5, user_id: 7, status: "registered", phone: "5550000000", accessibility_notes: null },
    { id_pk: 2, class_id: 1, user_id: 8, status: "cancelled", phone: "5550000001", accessibility_notes: null },
    { id_pk: 3, class_id: 1, user_id: 9, status: "cancelled", phone: "5550000002", accessibility_notes: null }
  ];
  const history = [{ registration_id_fk: 3, action: "removed_by_admin" }];

  async function execute(sql, params = []) {
    if (/FROM classes WHERE id_pk = \? FOR UPDATE/.test(sql)) {
      const row = classes.get(params[0]);
      return [row ? [{ ...row }] : []];
    }

    if (/FROM class_registrations\s+WHERE class_id = \? AND user_id = \? FOR UPDATE/.test(sql)) {
      const [classId, userId] = params;
      const row = registrations.find((r) => r.class_id === classId && r.user_id === userId);
      return [row ? [{ id_pk: row.id_pk, status: row.status }] : []];
    }

    if (/FROM class_registration_history/.test(sql)) {
      return [history.filter((h) => h.registration_id_fk === params[0]).map(() => ({ 1: 1 }))];
    }

    if (/SELECT COUNT\(\*\) AS count FROM class_registrations/.test(sql)) {
      return [[{ count: registrations.filter((r) => r.class_id === params[0] && r.status === "registered").length }]];
    }

    if (/^\s*UPDATE class_registrations/.test(sql)) {
      const [phone, notes, id] = params;
      const row = registrations.find((r) => r.id_pk === id);
      Object.assign(row, { status: "registered", phone, accessibility_notes: notes });
      return [{ affectedRows: 1 }];
    }

    if (/^\s*INSERT INTO class_registrations/.test(sql)) {
      const [classId, userId, phone, notes] = params;
      if (registrations.some((r) => r.class_id === classId && r.user_id === userId)) {
        throw Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY" });
      }
      const row = { id_pk: registrations.length + 1, class_id: classId, user_id: userId, status: "registered", phone, accessibility_notes: notes };
      registrations.push(row);
      return [{ insertId: row.id_pk }];
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  }

  const connection = {
    execute,
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {}
  };

  return { classes, registrations, execute, async getConnection() { return connection; } };
}

let fakeDb = createFakeDb();

stub("conf/database", {
  execute: (...args) => fakeDb.execute(...args),
  getConnection: () => fakeDb.getConnection()
});

// The x-test-user header is the signed-in application user's ID; no header is
// signed out. The real identity lookup is covered by tests/auth.test.js.
stub("middleware/auth", {
  requireApplicationUser(req, res, next) {
    const id = Number(req.get("x-test-user"));
    if (!id) return res.status(401).json({ error: "Please sign in." });
    req.applicationUser = { id };
    next();
  },
  requireRole() {
    return (req, res) => res.status(403).json({ error: "Not used here." });
  }
});

let baseUrl;
let server;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/my-registrations", require("../routes/my-registrations"));
  app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test.beforeEach(() => {
  fakeDb = createFakeDb();
});

async function register(user, body) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (user) headers["x-test-user"] = String(user);
  const response = await fetch(`${baseUrl}/api/my-registrations`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

const form = (classId, extra = {}) => ({ classId, phone: "(916) 555-0123", accessibility: "", ...extra });
const rowsFor = (classId, userId) =>
  fakeDb.registrations.filter((r) => r.class_id === classId && r.user_id === userId);

test("registering is 401 signed out and saves nothing", async () => {
  assert.equal((await register(null, form(1))).status, 401);
  assert.equal(fakeDb.registrations.length, 3);
});

test("a signed-in user's registration is saved to the database", async () => {
  const { status, body } = await register(20, form(1, { accessibility: "Uses a wheelchair" }));

  assert.equal(status, 201);
  assert.equal(body.registration.classId, 1);
  assert.equal(body.registration.status, "registered");
  assert.equal(body.seatsLeft, 1);

  const [row] = rowsFor(1, 20);
  assert.equal(row.status, "registered");
  assert.equal(row.phone, "9165550123");
  assert.equal(row.accessibility_notes, "Uses a wheelchair");
});

test("the browser can't register someone else", async () => {
  await register(20, { ...form(1), userId: 99, user_id: 99 });

  assert.equal(rowsFor(1, 20).length, 1);
  assert.equal(rowsFor(1, 99).length, 0);
});

test("registering twice doesn't take a second seat", async () => {
  await register(20, form(1));
  const again = await register(20, form(1));

  assert.equal(again.status, 409);
  assert.equal(again.body.code, "already_registered");
  assert.equal(rowsFor(1, 20).length, 1);
});

test("canceled, unpublished, started, and full classes are rejected", async () => {
  const cases = [
    [2, 409, "canceled"],
    [3, 404, "not_found"],
    [4, 409, "started"],
    [5, 409, "full"],
    [999, 404, "not_found"]
  ];

  for (const [classId, status, code] of cases) {
    const result = await register(20, form(classId));
    assert.equal(result.status, status, `class ${classId}`);
    assert.equal(result.body.code, code, `class ${classId}`);
  }

  assert.equal(fakeDb.registrations.length, 3);
});

test("bad form input is rejected before anything is saved", async () => {
  const badPhone = await register(20, form(1, { phone: "123" }));
  assert.equal(badPhone.status, 400);
  assert.ok(badPhone.body.errors.phone);

  const badClass = await register(20, form("abc"));
  assert.equal(badClass.status, 400);

  assert.equal(fakeDb.registrations.length, 3);
});

test("someone who cancelled can sign up again on the same row", async () => {
  const result = await register(8, form(1));

  assert.equal(result.status, 201);
  assert.equal(result.body.registration.id, 2);
  assert.equal(rowsFor(1, 8).length, 1);
  assert.equal(rowsFor(1, 8)[0].status, "registered");
});

test("someone an admin removed can't sign themselves back up", async () => {
  const result = await register(9, form(1));

  assert.equal(result.status, 403);
  assert.equal(result.body.code, "removed");
  assert.equal(rowsFor(1, 9)[0].status, "cancelled");
});

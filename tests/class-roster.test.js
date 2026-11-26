"use strict";

// HOW-157 (+ checks for HOW-148, HOW-287, HOW-567): roster, export, cancel, remove.
// keep it in-memory like tests/classes.test.js, never hit the shared railway db.
// Registrations mirror HOW-228's class_registrations table in the shared
// database: status is 'registered' or 'cancelled', and an admin removal is a
// 'cancelled' row with a class_registration_history entry.

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");
const { toCsvCell, toAttendeeCsv, csvFileName } = require("../services/attendee-export");

const root = path.join(__dirname, "..");

function stub(relative, exports) {
  const filename = require.resolve(path.join(root, relative));
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

// --- Fake database (cancel only; mirrors the columns services/classes.js reads) ---

// One published class with two active registrations, so a cancel can be shown
// to leave the class row and its registrations in place.
function seedRows() {
  return [
    {
      id_pk: 1,
      class_name: "Community Yoga",
      user_name: "Maya Chen",
      description: "Gentle flow for every body.",
      starts_at: "2026-12-05 18:00:00",
      ends_at: "2026-12-05 19:00:00",
      time_zone: "America/Los_Angeles",
      attendance_format: "in_person",
      location: "Heal One World Studio",
      meeting_link: null,
      capacity: 24,
      status: "published",
      canceled_at: null,
      canceled_by_fk: null
    },
    {
      id_pk: 2,
      class_name: "Private Planning Session",
      user_name: "Maya Chen",
      description: "",
      starts_at: "2026-12-06 18:00:00",
      ends_at: "2026-12-06 19:00:00",
      time_zone: "America/Los_Angeles",
      attendance_format: "virtual",
      location: null,
      meeting_link: "https://zoom.example/j/private-555",
      capacity: 10,
      status: "pending",
      canceled_at: null,
      canceled_by_fk: null
    }
  ];
}

// Fictional people only. Names cover the CSV edge cases (HOW-110 #7).
const USERS = new Map([
  [100, { name: "Ana Ruiz", email: "ana@example.com" }],
  [101, { name: "O'Brien, \"Bo\"", email: "bo@example.com" }],
  [102, { name: "=HYPERLINK(\"http://evil.example\")", email: "eve@example.com" }],
  [103, { name: "Chloe Park", email: "chloe@example.com" }]
]);

function createFakeDb() {
  const store = new Map(seedRows().map((row) => [row.id_pk, { ...row }]));

  // Class 1 has two registered, one who cancelled themselves (12), and one an
  // admin already removed (13). Class 2 has one registration of its own.
  const registrations = new Map([
    [1, [
      { id: 10, class_id: 1, user_id: 100, status: "registered", registered_at: "2026-11-01T09:00:00" },
      { id: 11, class_id: 1, user_id: 101, status: "registered", registered_at: "2026-11-02T09:00:00" },
      { id: 12, class_id: 1, user_id: 102, status: "cancelled", registered_at: "2026-11-03T09:00:00" },
      { id: 13, class_id: 1, user_id: 103, status: "cancelled", registered_at: "2026-11-04T09:00:00" }
    ]],
    [2, [
      { id: 20, class_id: 2, user_id: 100, status: "registered", registered_at: "2026-11-05T09:00:00" }
    ]]
  ]);
  const history = [
    { registration_id: 13, action: "removed_by_admin", actor: 42, created_at: "2026-11-20 10:00:00" }
  ];

  let cancelWrites = 0;
  let failCancelUpdate = false;

  function findRegistration(id) {
    for (const list of registrations.values()) {
      const found = list.find((row) => row.id === id);
      if (found) return found;
    }
    return null;
  }

  function attendeeRow(row) {
    const user = USERS.get(row.user_id);
    return { id: row.id, name: user.name, email: user.email, status: row.status, registered_at: row.registered_at };
  }

  // Mirrors the DATE_FORMAT columns selected in services/classes.js.
  function selected(row) {
    return {
      id_pk: row.id_pk,
      class_name: row.class_name,
      user_name: row.user_name,
      description: row.description,
      date: row.starts_at ? row.starts_at.slice(0, 10) : null,
      start_time: row.starts_at ? row.starts_at.slice(11, 16) : null,
      end_time: row.ends_at ? row.ends_at.slice(11, 16) : null,
      time_zone: row.time_zone,
      attendance_format: row.attendance_format,
      location: row.location,
      meeting_link: row.meeting_link,
      capacity: row.capacity,
      status: row.status
    };
  }

  async function execute(sql, params = []) {
    // --- registrations (services/class-roster.js) ---
    if (/JOIN classes c ON c\.id_pk = r\.class_id/.test(sql)) {
      const [userId] = params;
      return [[...registrations.values()].flat()
        .filter((row) => row.user_id === userId)
        .map((row) => ({ id: row.id, class_id: row.class_id, status: row.status, class_status: store.get(row.class_id).status }))];
    }

    if (/FROM class_registrations r\s+JOIN users/.test(sql)) {
      const [classId, status] = params;
      return [(registrations.get(classId) ?? [])
        .filter((row) => !status || row.status === status)
        .map(attendeeRow)
        .sort((a, b) => a.name.localeCompare(b.name))];
    }

    if (/SELECT COUNT\(\*\) AS count FROM class_registrations/.test(sql)) {
      const [classId, status] = params;
      return [[{ count: (registrations.get(classId) ?? []).filter((row) => row.status === status).length }]];
    }

    if (/FROM class_registrations WHERE id_pk = \? FOR UPDATE/.test(sql)) {
      const row = findRegistration(params[0]);
      return [row ? [{ id: row.id, class_id: row.class_id, status: row.status }] : []];
    }

    if (/UPDATE class_registrations SET status = \?/.test(sql)) {
      const [newStatus, id, expected] = params;
      const row = findRegistration(id);
      if (!row || row.status !== expected) return [{ affectedRows: 0 }];
      row.status = newStatus;
      return [{ affectedRows: 1 }];
    }

    if (/FROM class_registration_history/.test(sql)) {
      const ids = new Set(params);
      return [history
        .filter((entry) => entry.action === "removed_by_admin" && ids.has(entry.registration_id))
        .map((entry) => ({ id: entry.registration_id }))];
    }

    if (/INSERT INTO class_registration_history/.test(sql)) {
      history.push({ registration_id: params[0], action: "removed_by_admin", actor: params[1], created_at: "2026-11-25 10:05:00" });
      return [{ insertId: history.length }];
    }

    // isClassOpenForRegistration + cancelClass lock read.
    if (/SELECT status FROM classes/.test(sql)) {
      const row = store.get(params[0]);
      return [row ? [{ status: row.status }] : []];
    }

    if (/UPDATE classes[\s\S]*status = 'canceled'/.test(sql)) {
      if (failCancelUpdate) {
        throw new Error("Database unavailable");
      }

      const id = params[params.length - 1];
      const row = store.get(id);
      row.status = "canceled";
      row.canceled_at = "2026-11-25 10:00:00";
      row.canceled_by_fk = params[0];
      cancelWrites += 1;
      return [{ affectedRows: 1 }];
    }

    if (/^\s*SELECT/.test(sql)) {
      let rows = [...store.values()];

      if (/id_pk = \?/.test(sql)) {
        rows = rows.filter((row) => row.id_pk === params[params.length - 1]);
      }

      // Public list/detail (HOW-288): published or canceled, never pending.
      if (sql.includes("status = 'canceled'")) {
        rows = rows.filter((row) => ["published", "canceled"].includes(row.status) && row.starts_at);
      }

      return [rows.map(selected)];
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

  return {
    store,
    registrations,
    history,
    findRegistration,
    execute,
    async getConnection() { return connection; },
    cancelWrites: () => cancelWrites,
    failCancel(value) { failCancelUpdate = value; }
  };
}

let fakeDb = createFakeDb();

stub("conf/database", {
  execute: (...args) => fakeDb.execute(...args),
  getConnection: () => fakeDb.getConnection()
});

// Registration counts are a separate story (HOW-132/HOW-228); unknown here.
stub("services/class-registrations", {
  async getRegistrationCounts() {
    return new Map();
  }
});

// Stand-in for the real permission lookup (covered by tests/auth.test.js).
// The x-test-user header picks signed-out, a standard member, or an admin, and
// an authorized admin gets an applicationUser so the route can record who canceled.
stub("middleware/auth", {
  // Signed-in member for /api/my-registrations: "member" is user 100 (Ana).
  requireApplicationUser(req, res, next) {
    if (!req.get("x-test-user")) {
      return res.status(401).json({ error: "Please sign in." });
    }
    req.applicationUser = { id: req.get("x-test-user") === "member" ? 100 : 42 };
    next();
  },
  requireRole(role) {
    return (req, res, next) => {
      const user = req.get("x-test-user");

      if (!user) {
        return res.status(401).json({ error: "Please sign in." });
      }

      if (role !== "administrator" || user !== "admin") {
        return res.status(403).json({
          error: "You do not have permission to access this resource."
        });
      }

      req.applicationUser = { id: 42 };
      next();
    };
  }
});

const classes = require("../services/classes");

// --- Test server ---

let baseUrl;
let server;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/classes", require("../routes/classes"));
  app.use("/api/my-registrations", require("../routes/my-registrations"));
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test.beforeEach(() => {
  fakeDb = createFakeDb();
});

async function request(method, url, { user } = {}) {
  const headers = { Accept: "application/json" };

  if (user) headers["x-test-user"] = user;

  const response = await fetch(`${baseUrl}${url}`, { method, headers });

  return { status: response.status, body: await response.json() };
}

// For responses that aren't JSON (the CSV download).
async function requestRaw(url, { user } = {}) {
  const headers = user ? { "x-test-user": user } : {};
  const response = await fetch(`${baseUrl}${url}`, { headers });
  return { status: response.status, headers: response.headers, text: await response.text() };
}

// --- HOW-157: csv output ---

test("csv has a header row with Name, Email, Status", () => {
  const csv = toAttendeeCsv([{ name: "Ana Ruiz", email: "ana@example.com", status: "active" }]);
  assert.equal(csv, "Name,Email,Status\r\nAna Ruiz,ana@example.com,Registered\r\n");
});

test("csv quotes names with commas, quotes, and line breaks", () => {
  assert.equal(toCsvCell("O'Brien, \"Bo\""), "\"O'Brien, \"\"Bo\"\"\"");
  assert.equal(toCsvCell("Line one\nLine two"), "\"Line one\nLine two\"");
  assert.equal(toCsvCell("Plain"), "Plain");
  assert.equal(toCsvCell(null), "");
});

test("csv puts ' in front of values starting with = + - @ so they dont run as formulas", () => {
  for (const risky of ["=1+1", "+1", "-1", "@SUM(A1)", "\tTab", "\rReturn"]) {
    assert.ok(toCsvCell(risky).replace(/^"/, "").startsWith("'"), risky);
  }
  // A formula that also needs quoting stays both escaped and quoted.
  assert.equal(toCsvCell("=HYPERLINK(\"x\")"), "\"'=HYPERLINK(\"\"x\"\")\"");
});

test("empty roster exports just the header row", () => {
  assert.equal(toAttendeeCsv([]), "Name,Email,Status\r\n");
});

test("csv file name uses the class title and date", () => {
  assert.equal(csvFileName({ title: "Community Yoga!", date: "2026-12-05" }), "community-yoga-2026-12-05-attendees.csv");
  assert.equal(csvFileName({ title: "???", date: null }), "class-attendees.csv");
});

// --- HOW-157: active-only filtering ---

test("sign-in sheet + csv leave out canceled and removed registrations", async () => {
  const csv = await requestRaw("/api/classes/admin/1/roster.csv", { user: "admin" });

  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /^text\/csv; charset=utf-8/);
  assert.match(csv.headers.get("content-disposition"), /attachment; filename="?community-yoga-2026-12-05-attendees\.csv"?/);

  const lines = csv.text.replace(/^﻿/, "").trim().split("\r\n");
  assert.equal(lines[0], "Name,Email,Status");
  // Ana + Bo are active; the canceled (=HYPERLINK) and removed (Chloe) people are left out.
  assert.equal(lines.length, 3);
  assert.ok(lines.some((line) => line.startsWith("Ana Ruiz,")));
  assert.equal(csv.text.includes("chloe@example.com"), false);
  assert.equal(csv.text.includes("eve@example.com"), false);
});

test("csv export is 401 signed out, 403 for non-admins, 404 for unknown classes", async () => {
  assert.equal((await requestRaw("/api/classes/admin/1/roster.csv")).status, 401);
  assert.equal((await requestRaw("/api/classes/admin/1/roster.csv", { user: "member" })).status, 403);
  assert.equal((await requestRaw("/api/classes/admin/999/roster.csv", { user: "admin" })).status, 404);
});

// --- HOW-148: roster api ---

test("GET /api/classes/admin/:id/roster is 401 signed out, 403 for non-admins", async () => {
  assert.equal((await request("GET", "/api/classes/admin/1/roster")).status, 401);
  assert.equal((await request("GET", "/api/classes/admin/1/roster", { user: "member" })).status, 403);
});

test("roster 404s for an unknown class", async () => {
  assert.equal((await request("GET", "/api/classes/admin/999/roster", { user: "admin" })).status, 404);
  assert.equal((await request("GET", "/api/classes/admin/abc/roster", { user: "admin" })).status, 404);
});

test("roster lists every registration for that class only, with status", async () => {
  const { status, body } = await request("GET", "/api/classes/admin/1/roster", { user: "admin" });

  assert.equal(status, 200);
  assert.equal(body.class.id, 1);
  assert.deepEqual(body.attendees.map((person) => person.id).sort(), [10, 11, 12, 13]);
  assert.deepEqual(Object.keys(body.attendees[0]).sort(), ["email", "id", "name", "registeredAt", "status"]);
  assert.equal(body.attendees.find((person) => person.id === 13).status, "removed");
});

test("registration count stays null when unknown, never 0", async () => {
  // The class list uses the shared count service, which is still unknown.
  const list = await request("GET", "/api/classes/admin", { user: "admin" });
  assert.equal(list.body[0].registrationCount, null);

  // The roster counts the saved registrations it just read, so its number is real.
  const roster = await request("GET", "/api/classes/admin/1/roster", { user: "admin" });
  assert.equal(roster.body.class.registrationCount, 2);
});

test("public class responses never include meeting links, pending classes, or attendee data", async () => {
  await request("POST", "/api/classes/admin/1/cancel", { user: "admin" });

  const list = await request("GET", "/api/classes");
  assert.equal(list.status, 200);
  // Class 2 is pending, so it stays private.
  assert.deepEqual(list.body.map((item) => item.id), [1]);
  // HOW-288: the canceled class is still public, flagged, and still opens by link.
  assert.equal(list.body[0].canceled, true);

  for (const key of ["meetingLink", "status", "registrationCount", "attendees"]) {
    assert.equal(key in list.body[0], false, key);
  }
  assert.equal(JSON.stringify(list.body).includes("@example.com"), false);

  const detail = await request("GET", "/api/classes/1");
  assert.equal(detail.status, 200);
  assert.equal(detail.body.canceled, true);
  assert.equal((await request("GET", "/api/classes/2")).status, 404);
});

// --- HOW-287: cancel ---

test("cancel keeps the class row and its registrations", async () => {
  const before = [...fakeDb.registrations.get(1)];

  const canceled = await request("POST", "/api/classes/admin/1/cancel", { user: "admin" });

  assert.equal(canceled.status, 200);
  assert.equal(canceled.body.id, 1);
  assert.equal(canceled.body.status, "canceled");

  // The class row survives; only its status changed.
  assert.ok(fakeDb.store.has(1));
  assert.equal(fakeDb.store.get(1).status, "canceled");
  assert.equal(fakeDb.store.get(1).canceled_by_fk, 42);

  // Registrations are untouched: none deleted, none flipped.
  assert.deepEqual(fakeDb.registrations.get(1), before);
});

test("canceling twice doesnt do anything extra", async () => {
  const first = await request("POST", "/api/classes/admin/1/cancel", { user: "admin" });
  assert.equal(first.status, 200);
  const canceledAt = fakeDb.store.get(1).canceled_at;
  assert.equal(fakeDb.cancelWrites(), 1);

  // A repeated request is safe: 200 with the class, and no second write.
  const second = await request("POST", "/api/classes/admin/1/cancel", { user: "admin" });
  assert.equal(second.status, 200);
  assert.equal(second.body.status, "canceled");
  assert.equal(fakeDb.cancelWrites(), 1);
  assert.equal(fakeDb.store.get(1).canceled_at, canceledAt);
});

test("cancel 404s for an unknown or invalid class", async () => {
  assert.equal((await request("POST", "/api/classes/admin/999/cancel", { user: "admin" })).status, 404);
  assert.equal((await request("POST", "/api/classes/admin/abc/cancel", { user: "admin" })).status, 404);
  assert.equal(fakeDb.cancelWrites(), 0);
});

test("a failed cancel rolls back and the class is not marked canceled", async () => {
  fakeDb.failCancel(true);

  const canceled = await request("POST", "/api/classes/admin/1/cancel", { user: "admin" });

  assert.equal(canceled.status, 500);
  assert.equal(canceled.body.status, undefined);
  // The status stays published; nothing was committed.
  assert.equal(fakeDb.store.get(1).status, "published");
  assert.equal(fakeDb.store.get(1).canceled_at, null);
});

test("cancel + remove are 401 signed out, 403 for non-admins", async () => {
  for (const url of [
    "/api/classes/admin/1/cancel",
    "/api/classes/admin/1/registrations/10/remove"
  ]) {
    assert.equal((await request("POST", url)).status, 401);
    assert.equal((await request("POST", url, { user: "member" })).status, 403);
  }

  // No unauthorized request changed the class.
  assert.equal(fakeDb.store.get(1).status, "published");
  assert.equal(fakeDb.cancelWrites(), 0);
});

test("registering for a canceled class is rejected by the api", async () => {
  // The register endpoint is HOW-228's; this checks the shared server-side
  // gate that owner calls (isClassOpenForRegistration) against the saved status.
  assert.equal(await classes.isClassOpenForRegistration(1), true);
  assert.equal(await classes.isClassOpenForRegistration(999), false);

  await request("POST", "/api/classes/admin/1/cancel", { user: "admin" });

  assert.equal(await classes.isClassOpenForRegistration(1), false);
});

// --- HOW-567: remove ---

const removeUrl = (classId, registrationId) =>
  `/api/classes/admin/${classId}/registrations/${registrationId}/remove`;

// History rows written during a test (registration 13 was removed in the seed data).
const removalsOf = (registrationId) =>
  fakeDb.history.filter((entry) => entry.registration_id === registrationId);

test("remove 404s when the registration belongs to a different class", async () => {
  // Registration 20 is in class 2, not class 1.
  assert.equal((await request("POST", removeUrl(1, 20), { user: "admin" })).status, 404);
  assert.equal((await request("POST", removeUrl(1, 999), { user: "admin" })).status, 404);
  assert.equal((await request("POST", removeUrl(1, "abc"), { user: "admin" })).status, 404);
  assert.equal(fakeDb.findRegistration(20).status, "registered");
  assert.equal(removalsOf(20).length, 0);
});

test("removing someone keeps the row and lowers the active count", async () => {
  const removed = await request("POST", removeUrl(1, 10), { user: "admin" });

  assert.equal(removed.status, 200);
  assert.deepEqual(removed.body.registration, { id: 10, status: "removed" });
  assert.equal(removed.body.registrationCount, 1);
  // Not deleted: HOW-228's row is just cancelled. Nobody else's registration changed.
  assert.equal(fakeDb.findRegistration(10).status, "cancelled");
  assert.equal(fakeDb.findRegistration(11).status, "registered");
  assert.equal(fakeDb.findRegistration(20).status, "registered");

  // HOW-568: the roster shows it straight away.
  const roster = await request("GET", "/api/classes/admin/1/roster", { user: "admin" });
  assert.equal(roster.body.class.registrationCount, 1);
  assert.equal(roster.body.attendees.find((person) => person.id === 10).status, "removed");
});

test("removing twice doesnt free another seat", async () => {
  await request("POST", removeUrl(1, 10), { user: "admin" });
  const again = await request("POST", removeUrl(1, 10), { user: "admin" });

  assert.equal(again.status, 409);
  assert.equal(again.body.registration.status, "removed");
  assert.equal(removalsOf(10).length, 1);

  // Someone who cancelled themselves can't be "removed" either, and stays "canceled".
  const selfCancelled = await request("POST", removeUrl(1, 12), { user: "admin" });
  assert.equal(selfCancelled.status, 409);
  assert.equal(selfCancelled.body.registration.status, "canceled");
  assert.equal(removalsOf(12).length, 0);
});

test("two removals of the same registration at the same time only count once", async () => {
  const results = await Promise.all([
    request("POST", removeUrl(1, 11), { user: "admin" }),
    request("POST", removeUrl(1, 11), { user: "admin" })
  ]);

  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(removalsOf(11).length, 1);
});

test("removal saves who did it and when", async () => {
  await request("POST", removeUrl(1, 10), { user: "admin" });

  const [entry] = removalsOf(10);
  assert.equal(entry.action, "removed_by_admin");
  assert.equal(entry.actor, 42);
  assert.ok(entry.created_at);
});

test("roster tells self-cancelled and admin-removed apart", async () => {
  const roster = await request("GET", "/api/classes/admin/1/roster", { user: "admin" });
  const statusOf = (id) => roster.body.attendees.find((person) => person.id === id).status;

  assert.equal(statusOf(10), "active");
  assert.equal(statusOf(12), "canceled");
  assert.equal(statusOf(13), "removed");
});

// --- HOW-568 / HOW-288: My Classes ---

test("my registrations is 401 signed out", async () => {
  assert.equal((await request("GET", "/api/my-registrations")).status, 401);
});

test("my registrations shows only my own rows, with removals and canceled classes", async () => {
  const before = await request("GET", "/api/my-registrations", { user: "member" });

  assert.equal(before.status, 200);
  // Ana (user 100) is registered for classes 1 and 2; nobody else's rows come back.
  assert.deepEqual(before.body.map((row) => row.classId).sort(), [1, 2]);
  assert.deepEqual(Object.keys(before.body[0]).sort(), ["classCanceled", "classId", "status"]);
  assert.ok(before.body.every((row) => row.status === "active" && row.classCanceled === false));

  await request("POST", removeUrl(1, 10), { user: "admin" });
  await request("POST", "/api/classes/admin/1/cancel", { user: "admin" });

  const after = await request("GET", "/api/my-registrations", { user: "member" });
  const classOne = after.body.find((row) => row.classId === 1);
  assert.equal(classOne.status, "removed");
  assert.equal(classOne.classCanceled, true);
  assert.equal(after.body.find((row) => row.classId === 2).status, "active");
});

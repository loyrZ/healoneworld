"use strict";

// HOW-167: Repeatable checks for class listing, editing, capacity warnings,
// access control, and public visibility.
// Uses in-memory class records, so the shared Railway database is never touched.
// The real permission lookup is covered by tests/auth.test.js; here the
// x-test-user header stands in for a signed-out, standard, or admin user.
//  Entirely claude generated

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");

const root = path.join(__dirname, "..");

function stub(relative, exports) {
  const filename = require.resolve(path.join(root, relative));
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

// --- Fake database ---

const SAMPLE_ROWS = [
  {
    id_pk: 1,
    class_name: "Yoga for All Levels",
    user_name: "Maya Chen",
    description: "Gentle flow for every body.",
    starts_at: "2026-11-20 18:00:00",
    ends_at: "2026-11-20 19:00:00",
    time_zone: "America/Los_Angeles",
    attendance_format: "in_person",
    location: "Heal One World Studio",
    meeting_link: null,
    capacity: 24,
    status: "published"
  },
  {
    id_pk: 2,
    class_name: "Guided Meditation",
    user_name: "Jordan Lee",
    description: null,
    starts_at: "2026-11-21 19:00:00",
    ends_at: "2026-11-21 20:00:00",
    time_zone: "America/Los_Angeles",
    attendance_format: "virtual",
    location: null,
    meeting_link: "https://zoom.example/j/private-123",
    capacity: 40,
    status: "published"
  },
  {
    id_pk: 3,
    class_name: "Gentle Evening Stretch",
    user_name: "Jordan Lee",
    description: null,
    starts_at: "2026-11-27 18:00:00",
    ends_at: "2026-11-27 19:00:00",
    time_zone: "America/Los_Angeles",
    attendance_format: "hybrid",
    location: "Garden Studio",
    meeting_link: "https://zoom.example/j/private-456",
    capacity: 15,
    status: "pending"
  }
];

const UPDATE_COLUMNS = [
  "class_name",
  "description",
  "starts_at",
  "ends_at",
  "time_zone",
  "attendance_format",
  "location",
  "meeting_link",
  "user_name",
  "capacity"
];

function createFakeDb() {
  const store = new Map(SAMPLE_ROWS.map((row) => [row.id_pk, { ...row }]));

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
    if (/^\s*INSERT INTO classes/.test(sql)) {
      const id = Math.max(0, ...store.keys()) + 1;
      const row = { id_pk: id, status: "published" };
      UPDATE_COLUMNS.forEach((column, index) => {
        row[column] = params[index];
      });
      store.set(id, row);
      return [{ insertId: id, affectedRows: 1 }];
    }

    if (/^\s*UPDATE classes/.test(sql)) {
      const row = store.get(params[UPDATE_COLUMNS.length]);
      UPDATE_COLUMNS.forEach((column, index) => {
        row[column] = params[index];
      });
      return [{ affectedRows: 1 }];
    }

    if (/SELECT capacity FROM classes/.test(sql)) {
      const row = store.get(params[0]);
      return [row ? [{ capacity: row.capacity }] : []];
    }

    if (/^\s*SELECT/.test(sql)) {
      let rows = [...store.values()];

      if (sql.includes("status = 'published'")) {
        rows = rows.filter((row) => row.status === "published" && row.starts_at);
      }

      if (/WHERE[\s\S]*id_pk = \?/.test(sql)) {
        rows = rows.filter((row) => row.id_pk === params[params.length - 1]);
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

  return { store, execute, async getConnection() { return connection; } };
}

let fakeDb = createFakeDb();
let registrationCounts = new Map();
const registrationLookups = [];

stub("conf/database", {
  execute: (...args) => fakeDb.execute(...args),
  getConnection: () => fakeDb.getConnection()
});

stub("services/class-registrations", {
  async getRegistrationCounts(classIds) {
    registrationLookups.push(classIds);
    return registrationCounts;
  }
});

stub("middleware/auth", {
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
  registrationCounts = new Map();
  registrationLookups.length = 0;
});

async function request(method, url, { user, body } = {}) {
  const headers = { Accept: "application/json" };

  if (user) headers["x-test-user"] = user;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return { status: response.status, headers: response.headers, body: await response.json() };
}

// The edit form for class 1, as the browser would send it.
function editOf(overrides = {}) {
  return {
    title: "Yoga for All Levels",
    description: "Gentle flow for every body.",
    date: "2026-11-20",
    startTime: "18:00",
    endTime: "19:00",
    timeZone: "America/Los_Angeles",
    format: "in_person",
    location: "Heal One World Studio",
    meetingLink: "",
    instructor: "Maya Chen",
    capacity: "24",
    ...overrides
  };
}

// --- Validation ---

test("a complete edit is accepted and mapped to database columns", () => {
  const { values, errors } = classes.validateClassInput(editOf({ capacity: 30 }));

  assert.deepEqual(errors, {});
  assert.equal(values.class_name, "Yoga for All Levels");
  assert.equal(values.starts_at, "2026-11-20 18:00:00");
  assert.equal(values.ends_at, "2026-11-20 19:00:00");
  assert.equal(values.capacity, 30);
  assert.equal(values.meeting_link, null);
});

test("required fields are reported", () => {
  const { errors } = classes.validateClassInput({});

  for (const field of ["title", "instructor", "date", "startTime", "endTime", "timeZone", "format", "capacity"]) {
    assert.ok(errors[field], `expected an error for ${field}`);
  }
});

test("invalid dates and time ordering are rejected", () => {
  assert.ok(classes.validateClassInput(editOf({ date: "2026-02-30" })).errors.date);
  assert.ok(classes.validateClassInput(editOf({ date: "next week" })).errors.date);
  assert.ok(classes.validateClassInput(editOf({ startTime: "25:00" })).errors.startTime);
  assert.ok(classes.validateClassInput(editOf({ endTime: "17:00" })).errors.endTime);
  assert.ok(classes.validateClassInput(editOf({ endTime: "18:00" })).errors.endTime);
});

test("invalid capacity values are rejected", () => {
  for (const capacity of ["0", "-3", "2.5", "abc", "1001", "", null, true]) {
    const { errors } = classes.validateClassInput(editOf({ capacity }));
    assert.ok(errors.capacity, `expected ${JSON.stringify(capacity)} to be rejected`);
  }
});

test("attendance format decides which location details are required", () => {
  assert.ok(classes.validateClassInput(editOf({ location: "" })).errors.location);

  const virtual = editOf({ format: "virtual", location: "" });
  assert.ok(classes.validateClassInput(virtual).errors.meetingLink);
  assert.ok(classes.validateClassInput({ ...virtual, meetingLink: "not a link" }).errors.meetingLink);
  assert.ok(classes.validateClassInput({ ...virtual, meetingLink: "http://zoom.example/j/1" }).errors.meetingLink);
  assert.deepEqual(
    classes.validateClassInput({ ...virtual, meetingLink: "https://zoom.example/j/1" }).errors,
    {}
  );

  const hybrid = classes.validateClassInput(editOf({ format: "hybrid" }));
  assert.ok(hybrid.errors.meetingLink);
  assert.equal(hybrid.errors.location, undefined);
});

test("non-text values are rejected", () => {
  const { errors } = classes.validateClassInput(editOf({ title: ["Yoga"] }));
  assert.equal(errors.title, "Must be text.");
});

// --- Access control ---

test("signed-out requests receive 401 and cannot update a class", async () => {
  assert.equal((await request("GET", "/api/classes/admin")).status, 401);

  const update = await request("PUT", "/api/classes/admin/1", {
    body: editOf({ title: "Changed" })
  });

  assert.equal(update.status, 401);
  assert.equal(fakeDb.store.get(1).class_name, "Yoga for All Levels");
});

test("non-admin requests receive 403 and cannot update a class", async () => {
  assert.equal((await request("GET", "/api/classes/admin", { user: "member" })).status, 403);

  const update = await request("PUT", "/api/classes/admin/1", {
    user: "member",
    body: editOf({ title: "Changed" })
  });

  assert.equal(update.status, 403);
  assert.equal(fakeDb.store.get(1).class_name, "Yoga for All Levels");
});

// --- Admin list and detail (HOW-132) ---

test("the admin list includes published and pending classes with stable IDs", async () => {
  const { status, headers, body } = await request("GET", "/api/classes/admin", { user: "admin" });

  assert.equal(status, 200);
  assert.equal(headers.get("cache-control"), "no-store");
  assert.deepEqual(body.map((item) => item.id), [1, 2, 3]);
  assert.deepEqual(body.map((item) => item.status), ["published", "published", "pending"]);
  assert.equal(body[1].meetingLink, "https://zoom.example/j/private-123");
});

test("unknown registration counts are reported as unavailable, not zero", async () => {
  registrationCounts = new Map([[1, 18]]);
  const { body } = await request("GET", "/api/classes/admin", { user: "admin" });

  assert.equal(body[0].registrationCount, 18);
  assert.equal(body[1].registrationCount, null);
});

test("missing or invalid class IDs return 404", async () => {
  assert.equal((await request("GET", "/api/classes/admin/99", { user: "admin" })).status, 404);
  assert.equal((await request("GET", "/api/classes/admin/abc", { user: "admin" })).status, 404);

  const update = await request("PUT", "/api/classes/admin/99", {
    user: "admin",
    body: editOf()
  });
  assert.equal(update.status, 404);
});

// --- Editing (HOW-166) ---

test("a normal edit is saved and still correct after reloading", async () => {
  const update = await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: editOf({ title: "Yoga for Everyone", startTime: "17:30", capacity: "30" })
  });

  assert.equal(update.status, 200);
  assert.equal(update.body.title, "Yoga for Everyone");

  const reloaded = await request("GET", "/api/classes/admin/1", { user: "admin" });
  assert.equal(reloaded.body.title, "Yoga for Everyone");
  assert.equal(reloaded.body.startTime, "17:30");
  assert.equal(reloaded.body.capacity, 30);
});

test("invalid edits return field errors and leave the record unchanged", async () => {
  const before = { ...fakeDb.store.get(1) };
  const update = await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: editOf({ title: "", endTime: "17:00", capacity: "0" })
  });

  assert.equal(update.status, 400);
  assert.ok(update.body.errors.title);
  assert.ok(update.body.errors.endTime);
  assert.ok(update.body.errors.capacity);
  assert.deepEqual(fakeDb.store.get(1), before);
});

test("fields outside the editable list are rejected", async () => {
  const update = await request("PUT", "/api/classes/admin/3", {
    user: "admin",
    body: { ...editOf(), status: "published" }
  });

  assert.equal(update.status, 400);
  assert.deepEqual(update.body.rejected, ["status"]);
  assert.equal(fakeDb.store.get(3).status, "pending");
});

test("switching to in person removes the private meeting link", async () => {
  const update = await request("PUT", "/api/classes/admin/2", {
    user: "admin",
    body: editOf({
      title: "Guided Meditation",
      date: "2026-11-21",
      startTime: "19:00",
      endTime: "20:00",
      instructor: "Jordan Lee",
      location: "Heal One World Studio",
      meetingLink: "https://zoom.example/j/private-123",
      capacity: "40"
    })
  });

  assert.equal(update.status, 200);
  assert.equal(fakeDb.store.get(2).meeting_link, null);
});

// --- Creating (HOW-140, HOW-141) ---

function newClass(overrides = {}) {
  return editOf({
    title: "Sound Healing Workshop",
    description: "Fictional development session.",
    date: "2026-12-02",
    startTime: "17:30",
    endTime: "19:00",
    format: "virtual",
    location: "",
    meetingLink: "https://zoom.example/j/private-789",
    instructor: "Sam Rivera",
    capacity: "15",
    ...overrides
  });
}

test("signed-out and non-admin requests cannot create a class", async () => {
  assert.equal((await request("POST", "/api/classes/admin", { body: newClass() })).status, 401);
  assert.equal((await request("POST", "/api/classes/admin", { user: "member", body: newClass() })).status, 403);
  assert.equal(fakeDb.store.size, 3);
});

test("creating a class returns its new ID and it appears in the admin list", async () => {
  const created = await request("POST", "/api/classes/admin", { user: "admin", body: newClass() });

  assert.equal(created.status, 201);
  assert.equal(created.body.id, 4);
  assert.equal(created.body.title, "Sound Healing Workshop");
  assert.equal(created.body.status, "published");
  assert.equal(created.body.registrationCount, null);

  const list = await request("GET", "/api/classes/admin", { user: "admin" });
  assert.ok(list.body.some((item) => item.id === 4 && item.startTime === "17:30"));
});

test("a created class appears publicly without its meeting link", async () => {
  await request("POST", "/api/classes/admin", { user: "admin", body: newClass() });

  const list = await request("GET", "/api/classes");
  const created = list.body.find((item) => item.id === 4);

  assert.equal(created.title, "Sound Healing Workshop");
  assert.equal("meetingLink" in created, false);
  assert.equal(JSON.stringify(list.body).includes("private-789"), false);

  const detail = await request("GET", "/api/classes/4");
  assert.equal(detail.status, 200);
  assert.equal("meetingLink" in detail.body, false);
});

test("invalid new classes return field errors and are not saved", async () => {
  const created = await request("POST", "/api/classes/admin", {
    user: "admin",
    body: newClass({ title: " ", endTime: "17:00", capacity: "-1", meetingLink: "" })
  });

  assert.equal(created.status, 400);
  assert.ok(created.body.errors.title);
  assert.ok(created.body.errors.endTime);
  assert.ok(created.body.errors.capacity);
  assert.ok(created.body.errors.meetingLink);
  assert.equal(fakeDb.store.size, 3);
});

test("a browser cannot set the status or registration count of a new class", async () => {
  for (const extra of [{ status: "pending" }, { registrationCount: 5 }, { id: 99 }]) {
    const created = await request("POST", "/api/classes/admin", {
      user: "admin",
      body: { ...newClass(), ...extra }
    });

    assert.equal(created.status, 400);
    assert.deepEqual(created.body.rejected, Object.keys(extra));
  }

  assert.equal(fakeDb.store.size, 3);
});

test("database failures are reported instead of success", async () => {
  const failing = fakeDb;
  fakeDb = {
    ...failing,
    async execute(sql, params) {
      if (/^\s*INSERT/.test(sql)) throw new Error("Database unavailable");
      return failing.execute(sql, params);
    }
  };

  const created = await request("POST", "/api/classes/admin", { user: "admin", body: newClass() });

  assert.equal(created.status, 500);
  assert.equal(created.body.id, undefined);
});

// --- Capacity warnings (HOW-167) ---

test("lowering capacity below registrations needs confirmation", async () => {
  registrationCounts = new Map([[1, 18]]);

  const warned = await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: editOf({ capacity: "12" })
  });

  assert.equal(warned.status, 409);
  assert.equal(warned.body.code, "capacity_confirmation_required");
  assert.equal(warned.body.registrationCount, 18);
  assert.equal(warned.body.capacity, 12);
  assert.equal(fakeDb.store.get(1).capacity, 24);

  const confirmed = await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: { ...editOf({ capacity: "12" }), confirmCapacityReduction: true }
  });

  assert.equal(confirmed.status, 200);
  assert.equal(fakeDb.store.get(1).capacity, 12);
});

test("lowering capacity with an unknown registration count needs confirmation", async () => {
  const warned = await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: editOf({ capacity: "20" })
  });

  assert.equal(warned.status, 409);
  assert.equal(warned.body.registrationCount, null);
  assert.equal(fakeDb.store.get(1).capacity, 24);
});

test("lowering capacity that still fits every registration saves directly", async () => {
  registrationCounts = new Map([[1, 18]]);

  const update = await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: editOf({ capacity: "18" })
  });

  assert.equal(update.status, 200);
  assert.equal(fakeDb.store.get(1).capacity, 18);
});

test("the server rechecks registrations when saving", async () => {
  registrationCounts = new Map([[1, 10]]);
  const loaded = await request("GET", "/api/classes/admin/1", { user: "admin" });
  assert.equal(loaded.body.registrationCount, 10);

  // More people register after the form was loaded.
  registrationCounts = new Map([[1, 22]]);
  registrationLookups.length = 0;

  const update = await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: editOf({ capacity: "20" })
  });

  assert.equal(update.status, 409);
  assert.equal(update.body.registrationCount, 22);
  assert.ok(registrationLookups.length > 0);
});

// --- Public visibility ---

test("public responses exclude pending classes and meeting links", async () => {
  const list = await request("GET", "/api/classes");

  assert.equal(list.status, 200);
  assert.deepEqual(list.body.map((item) => item.id), [1, 2]);

  for (const item of list.body) {
    assert.equal("meetingLink" in item, false);
    assert.equal("status" in item, false);
  }

  assert.equal(JSON.stringify(list.body).includes("private-"), false);

  const detail = await request("GET", "/api/classes/2");
  assert.equal(detail.status, 200);
  assert.equal("meetingLink" in detail.body, false);

  assert.equal((await request("GET", "/api/classes/3")).status, 404);
});

test("saved edits appear in the public class data", async () => {
  await request("PUT", "/api/classes/admin/1", {
    user: "admin",
    body: editOf({ title: "Yoga for Everyone", capacity: "30" })
  });

  const list = await request("GET", "/api/classes");
  assert.equal(list.body[0].title, "Yoga for Everyone");

  const detail = await request("GET", "/api/classes/1");
  assert.equal(detail.body.capacity, 30);
});

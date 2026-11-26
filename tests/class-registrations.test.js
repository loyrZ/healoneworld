"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.join(__dirname, "..");
const databasePath = require.resolve(path.join(root, "conf/database"));
const servicePath = require.resolve(path.join(root, "services/class-registrations"));

function loadService({ failCancellation = false } = {}) {
  const registrations = [{ id_pk: 1, class_id: 10, user_id: 7, status: "registered", phone: "5552013344", accessibility_notes: null }];
  const classes = new Map([[10, { id_pk: 10, capacity: 1, status: "published" }]]);
  let nextId = 2;

  async function execute(sql, values = []) {
    if (sql.includes("FROM class_registrations") && sql.includes("COUNT(*)")) {
      const ids = values.slice(1);
      return [ids.map((classId) => ({
        class_id: classId,
        registration_count: registrations.filter((registration) => registration.class_id === classId && registration.status === "registered").length
      })).filter((row) => row.registration_count > 0)];
    }
    if (sql.includes("SELECT id_pk, capacity, status FROM classes")) {
      const record = classes.get(values[0]);
      return [record ? [record] : []];
    }
    if (sql.includes("SELECT id_pk, status FROM class_registrations")) {
      return [registrations.filter((registration) => registration.class_id === values[0] && registration.user_id === values[1])];
    }
    if (sql.includes("SELECT id_pk, class_id, user_id, status FROM class_registrations")) {
      return [registrations.filter((registration) => registration.id_pk === values[0])];
    }
    if (sql.includes("SELECT id_pk FROM classes")) return [[{ id_pk: values[0] }]];
    if (sql.includes("FROM classes c") && sql.includes("LEFT JOIN class_registrations")) {
      const classRecord = classes.get(values[1]);
      const registration = registrations.find((item) => item.class_id === values[1] && item.user_id === values[0]);
      return [classRecord ? [{
        id_pk: classRecord.id_pk,
        class_status: classRecord.status,
        attendance_format: classRecord.attendance_format || "virtual",
        meeting_link: classRecord.meeting_link || "https://zoom.example/j/private-class",
        registration_status: registration?.status || null
      }] : []];
    }
    if (sql.includes("INSERT INTO class_registrations")) {
      const registration = { id_pk: nextId++, class_id: values[0], user_id: values[1], phone: values[2], accessibility_notes: values[3], status: values[4] };
      registrations.push(registration);
      return [{ insertId: registration.id_pk }];
    }
    if (sql.includes("UPDATE class_registrations")) {
      if (failCancellation) throw new Error("Database unavailable");
      const registration = registrations.find((item) => item.id_pk === values[1]);
      registration.status = values[0];
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected query: ${sql}`);
  }

  const connection = { execute, async beginTransaction() {}, async commit() {}, async rollback() {}, release() {} };
  require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: { execute, async getConnection() { return connection; } } };
  delete require.cache[servicePath];
  return { service: require(servicePath), registrations };
}

function loadUnavailableCountService() {
  const unavailableDatabase = {
    async execute() {
      const error = new Error("Table 'class_registrations' doesn't exist");
      error.code = "ER_NO_SUCH_TABLE";
      throw error;
    }
  };
  require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: unavailableDatabase };
  delete require.cache[servicePath];
  return require(servicePath);
}

test.after(() => {
  delete require.cache[databasePath];
  delete require.cache[servicePath];
});

test("a successful cancellation persists and frees exactly one active place", async () => {
  const { service, registrations } = loadService();
  assert.equal((await service.getRegistrationCounts([10])).get(10), 1);

  const cancelled = await service.cancelRegistration({ registrationId: 1, userId: 7 });
  assert.deepEqual(cancelled, { status: "cancelled", changed: true });
  assert.equal(registrations[0].status, "cancelled");
  assert.equal((await service.getRegistrationCounts([10])).get(10), 0);

  const retry = await service.cancelRegistration({ registrationId: 1, userId: 7 });
  assert.deepEqual(retry, { status: "cancelled", changed: false });
  assert.equal((await service.getRegistrationCounts([10])).get(10), 0);
});

test("a canceled registration can be restored without creating a second roster record", async () => {
  const { service, registrations } = loadService();
  await service.cancelRegistration({ registrationId: 1, userId: 7 });

  const registrationId = await service.createRegistration({
    classId: 10,
    userId: 7,
    phone: "5552013344",
    accessibilityNotes: null
  });

  assert.equal(registrationId, 1);
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].status, "registered");
  assert.equal((await service.getRegistrationCounts([10])).get(10), 1);
});

test("a failed cancellation keeps the registration active and does not release a place", async () => {
  const { service, registrations } = loadService({ failCancellation: true });
  await assert.rejects(service.cancelRegistration({ registrationId: 1, userId: 7 }), /Database unavailable/);
  assert.equal(registrations[0].status, "registered");
  assert.equal((await service.getRegistrationCounts([10])).get(10), 1);
});

test("a database awaiting the registration migration treats existing classes as having zero registrations", async () => {
  const service = loadUnavailableCountService();
  const counts = await service.getRegistrationCounts([10]);
  assert.equal(counts.get(10), 0);
});

test("a database awaiting the registration migration returns an empty roster", async () => {
  const service = loadUnavailableCountService();
  assert.deepEqual(await service.listClassRoster(10), []);
});

test("registration ownership, capacity, and server input validation are enforced", async () => {
  const { service } = loadService();
  await assert.rejects(service.cancelRegistration({ registrationId: 1, userId: 9 }), { status: 403 });
  await assert.rejects(service.createRegistration({ classId: 10, userId: 8, phone: "5552019999", accessibilityNotes: null }), { status: 409 });
  assert.equal(service.validateRegistrationInput({ phone: "555-201-3344", accessibilityNotes: "" }).errors.phone, undefined);
  assert.ok(service.validateRegistrationInput({ phone: "bad", accessibilityNotes: "" }).errors.phone);
});

test("private meeting access requires an active registration for the requested class", async () => {
  const { service, registrations } = loadService();

  const meeting = await service.getMeetingAccess({ classId: 10, userId: 7 });
  assert.deepEqual(meeting, { meetingLink: "https://zoom.example/j/private-class" });

  await assert.rejects(service.getMeetingAccess({ classId: 10, userId: 8 }), {
    status: 403,
    code: "active_registration_required"
  });
  await assert.rejects(service.getMeetingAccess({ classId: 99, userId: 7 }), {
    status: 404,
    code: "class_unavailable"
  });

  registrations[0].status = "cancelled";
  await assert.rejects(service.getMeetingAccess({ classId: 10, userId: 7 }), {
    status: 403,
    code: "active_registration_required"
  });
});
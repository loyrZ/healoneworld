"use strict";

// HOW-148, HOW-567, HOW-568: admin roster + admin removal.
// Reads HOW-228's class_registrations table. Active counts for the class list
// still come from getRegistrationCounts in services/class-registrations.js,
// which is HOW-132/HOW-228's file.

const db = require("../conf/database");

// HOW-228's table, as it exists in the shared database. Its status column only
// has 'registered' and 'cancelled', so an admin removal is saved as 'cancelled'
// plus a class_registration_history row; that row is what makes it "removed"
// here without changing HOW-228's table.
const REGISTRATIONS = {
  table: "class_registrations",
  id: "id_pk",
  user: "user_id",
  classId: "class_id",
  status: "status",
  registeredAt: "registered_at",
  cancelledAt: "cancelled_at"
};

const DB_REGISTERED = "registered";
const DB_CANCELLED = "cancelled";

// What the roster, CSV, and frontend use.
const ATTENDEE_STATUSES = ["active", "canceled", "removed"];

const R = REGISTRATIONS;

// Only what the roster and attendance sheet need, nothing else from users.
const SELECT_ATTENDEES = `
  SELECT r.${R.id} AS id, u.name, u.email, r.${R.status} AS status,
         DATE_FORMAT(r.${R.registeredAt}, '%Y-%m-%dT%H:%i:%s') AS registered_at
  FROM ${R.table} r
  JOIN users u ON u.id_pk = r.${R.user}
  WHERE r.${R.classId} = ?`;

const ORDER_BY_NAME = "ORDER BY u.name, r.id_pk";

// Which of these registrations an admin removed. Before migration 003 adds the
// history table there are no removals yet, so a missing table means "none".
async function findAdminRemovals(registrationIds, connection = db) {
  if (registrationIds.length === 0) return new Set();

  try {
    const [rows] = await connection.execute(
      `SELECT registration_id_fk AS id FROM class_registration_history
       WHERE action = 'removed_by_admin'
         AND registration_id_fk IN (${registrationIds.map(() => "?").join(", ")})`,
      registrationIds
    );
    return new Set(rows.map((row) => row.id));
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") return new Set();
    throw error;
  }
}

function attendeeStatus(dbStatus, removedByAdmin) {
  if (dbStatus === DB_REGISTERED) return "active";
  return removedByAdmin ? "removed" : "canceled";
}

function toAttendee(row, removals) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: attendeeStatus(row.status, removals.has(row.id)),
    registeredAt: row.registered_at
  };
}

// HOW-148: everyone who registered for one class, including canceled/removed,
// so admins can tell them apart (HOW-108 #5).
async function listRoster(classId) {
  const [rows] = await db.execute(`${SELECT_ATTENDEES} ${ORDER_BY_NAME}`, [classId]);
  const cancelledIds = rows.filter((row) => row.status === DB_CANCELLED).map((row) => row.id);
  const removals = await findAdminRemovals(cancelledIds);

  return rows.map((row) => toAttendee(row, removals));
}

// HOW-155 / HOW-156: the sign-in sheet and CSV only list people who are still coming.
async function listActiveAttendees(classId) {
  const [rows] = await db.execute(
    `${SELECT_ATTENDEES} AND r.${R.status} = ? ${ORDER_BY_NAME}`,
    [classId, DB_REGISTERED]
  );
  return rows.map((row) => toAttendee(row, new Set()));
}

// HOW-568: counted from the same rows the roster shows, so they always agree.
async function countActive(classId, connection = db) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count FROM ${R.table} WHERE ${R.classId} = ? AND ${R.status} = ?`,
    [classId, DB_REGISTERED]
  );
  return Number(rows[0].count);
}

// HOW-568 / HOW-288: the signed-in person's own registrations, so My Classes can
// say when an admin removed them or the class was canceled. Only their rows,
// and only status fields; no other attendees.
async function listUserRegistrationStatuses(userId) {
  const [rows] = await db.execute(
    `SELECT r.${R.id} AS id, r.${R.classId} AS class_id, r.${R.status} AS status,
            c.status AS class_status
     FROM ${R.table} r
     JOIN classes c ON c.id_pk = r.${R.classId}
     WHERE r.${R.user} = ?`,
    [userId]
  );
  const cancelledIds = rows.filter((row) => row.status === DB_CANCELLED).map((row) => row.id);
  const removals = await findAdminRemovals(cancelledIds);

  return rows.map((row) => ({
    classId: row.class_id,
    status: attendeeStatus(row.status, removals.has(row.id)),
    classCanceled: row.class_status === "canceled"
  }));
}

// HOW-567: returns { removed, registration, registrationCount }, { notFound },
// or { alreadyInactive, registration }.
async function removeAttendee(classId, registrationId, adminUserId) {
  const connection = await db.getConnection();
  let registration;

  try {
    await connection.beginTransaction();

    // Lock the row so two clicks can't both remove it and free two seats (HOW-540 #6).
    const [rows] = await connection.execute(
      `SELECT ${R.id} AS id, ${R.classId} AS class_id, ${R.status} AS status
       FROM ${R.table} WHERE ${R.id} = ? FOR UPDATE`,
      [registrationId]
    );

    // A registration from another class is treated as not found (HOW-540 #2).
    if (rows.length !== 1 || rows[0].class_id !== classId) {
      await connection.rollback();
      return { notFound: true };
    }

    if (rows[0].status !== DB_REGISTERED) {
      const removals = await findAdminRemovals([registrationId], connection);
      await connection.rollback();
      return {
        alreadyInactive: true,
        registration: { id: registrationId, status: attendeeStatus(rows[0].status, removals.has(registrationId)) }
      };
    }

    // The status check in WHERE is a second guard if the lock isn't held.
    const [result] = await connection.execute(
      `UPDATE ${R.table} SET ${R.status} = ?, ${R.cancelledAt} = CURRENT_TIMESTAMP
       WHERE ${R.id} = ? AND ${R.status} = ?`,
      [DB_CANCELLED, registrationId, DB_REGISTERED]
    );

    if (result.affectedRows !== 1) {
      await connection.rollback();
      return { alreadyInactive: true, registration: { id: registrationId, status: "removed" } };
    }

    // Needs migration 003. If the table is missing this throws and the
    // transaction rolls back, so nobody is half-removed.
    await connection.execute(
      `INSERT INTO class_registration_history (registration_id_fk, action, actor_user_fk)
       VALUES (?, 'removed_by_admin', ?)`,
      [registrationId, adminUserId]
    );

    await connection.commit();
    registration = { id: registrationId, status: "removed" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { removed: true, registration, registrationCount: await countActive(classId) };
}

module.exports = {
  REGISTRATIONS,
  ATTENDEE_STATUSES,
  listRoster,
  listActiveAttendees,
  countActive,
  removeAttendee,
  listUserRegistrationStatuses
};

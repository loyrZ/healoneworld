"use strict";

// HOW-132: Registration counts for classes.
// Class registration storage is a separate story and does not exist yet,
// so no counts are known. Callers treat a missing count as "unavailable"
// and must never assume it is zero.
// When registrations are stored, count active registrations here.
//  Claude Revised

const db = require("../conf/database");

// Returns a Map of class ID -> active registration count.
// IDs missing from the Map have an unknown count.
async function getRegistrationCounts(classIds, connection) {
  return new Map();
}

// HOW-228 / HOW-379: save a registration in class_registrations.
//class registration never hit database, resolved it -gates

const MAX_PHONE = 30;
const MAX_NOTES = 1000;

// Class start times are local wall-clock times in America/Los_Angeles
// (docs/class-data.md), so "has it started?" is compared in that zone.
function nowInLosAngeles() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date()).map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

// Checks the form fields the server stores. Returns { values } or { errors }.
function validateRegistrationInput(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const errors = {};

  const classId = /^[1-9]\d{0,9}$/.test(String(input.classId ?? "")) ? Number(input.classId) : null;
  if (!classId) errors.classId = "Choose a class.";

  const phone = typeof input.phone === "string" ? input.phone.replace(/\D/g, "") : "";
  if (phone.length !== 10) errors.phone = "Enter a valid 10-digit phone number.";

  const notes = typeof input.accessibility === "string" ? input.accessibility.trim() : "";
  if (notes.length > MAX_NOTES) errors.accessibility = `Use ${MAX_NOTES} characters or fewer.`;

  if (Object.keys(errors).length) return { errors };

  return {
    values: {
      classId,
      phone: phone.slice(0, MAX_PHONE),
      accessibilityNotes: notes || null
    }
  };
}

// Returns { registration, seatsLeft } or { rejected: code } where code is
// not_found, canceled, started, full, already_registered, or removed.
async function registerForClass(userId, { classId, phone, accessibilityNotes }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Same row lock cancelClass takes, so a registration can't slip in after a
    // cancel commits, and two people can't both take the last seat.
    const [classes] = await connection.execute(
      `SELECT status, capacity, DATE_FORMAT(starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at
       FROM classes WHERE id_pk = ? FOR UPDATE`,
      [classId]
    );
    const classRow = classes[0];

    let rejected = null;
    if (!classRow || classRow.status === "pending") rejected = "not_found";
    else if (classRow.status === "canceled") rejected = "canceled";
    else if (!classRow.starts_at || classRow.starts_at <= nowInLosAngeles()) rejected = "started";

    if (rejected) {
      await connection.rollback();
      return { rejected };
    }

    // One row per person per class (unique key on class_id, user_id).
    const [existing] = await connection.execute(
      `SELECT id_pk, status FROM class_registrations
       WHERE class_id = ? AND user_id = ? FOR UPDATE`,
      [classId, userId]
    );

    if (existing[0]?.status === "registered") {
      await connection.rollback();
      return { rejected: "already_registered" };
    }

    // Someone an admin removed (HOW-567) can't sign themselves back up.
    if (existing[0]) {
      const [removals] = await connection.execute(
        `SELECT 1 FROM class_registration_history
         WHERE registration_id_fk = ? AND action = 'removed_by_admin' LIMIT 1`,
        [existing[0].id_pk]
      );
      if (removals.length) {
        await connection.rollback();
        return { rejected: "removed" };
      }
    }

    const [counts] = await connection.execute(
      `SELECT COUNT(*) AS count FROM class_registrations
       WHERE class_id = ? AND status = 'registered'`,
      [classId]
    );
    const active = Number(counts[0].count);

    if (classRow.capacity !== null && active >= classRow.capacity) {
      await connection.rollback();
      return { rejected: "full" };
    }

    let registrationId;
    if (existing[0]) {
      // They cancelled before and are signing up again.
      await connection.execute(
        `UPDATE class_registrations
         SET status = 'registered', cancelled_at = NULL, registered_at = CURRENT_TIMESTAMP,
             phone = ?, accessibility_notes = ?
         WHERE id_pk = ?`,
        [phone, accessibilityNotes, existing[0].id_pk]
      );
      registrationId = existing[0].id_pk;
    } else {
      const [result] = await connection.execute(
        `INSERT INTO class_registrations (class_id, user_id, phone, accessibility_notes)
         VALUES (?, ?, ?, ?)`,
        [classId, userId, phone, accessibilityNotes]
      );
      registrationId = result.insertId;
    }

    await connection.commit();

    return {
      registration: { id: registrationId, classId, status: "registered" },
      seatsLeft: classRow.capacity === null ? null : classRow.capacity - active - 1
    };
  } catch (error) {
    await connection.rollback();
    // A second click from the same person can race past the SELECT; the
    // unique key catches it.
    if (error.code === "ER_DUP_ENTRY") return { rejected: "already_registered" };
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getRegistrationCounts, validateRegistrationInput, registerForClass };

"use strict";

const db = require("../conf/database");

const REGISTRATION_STATUS = "registered";
const CANCELLED_STATUS = "cancelled";

function registrationError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toRegistration(row) {
  return {
    id: row.registration_id,
    classId: row.class_id,
    status: row.registration_status,
    registeredAt: row.registered_at,
    cancelledAt: row.cancelled_at,
    phone: row.phone ?? "",
    accessibilityNotes: row.accessibility_notes ?? "",
    class: {
      id: row.class_id,
      title: row.class_name,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      format: row.attendance_format,
      location: row.location ?? "",
      capacity: row.capacity
    }
  };
}

function validateRegistrationInput(input) {
  const errors = {};
  const phone = typeof input.phone === "string" ? input.phone.replace(/\D/g, "") : "";
  const accessibilityNotes =
    typeof input.accessibilityNotes === "string" ? input.accessibilityNotes.trim() : "";

  if (phone.length !== 10) errors.phone = "Enter a valid 10-digit phone number.";
  if (accessibilityNotes.length > 5000) {
    errors.accessibilityNotes = "Use 5000 characters or fewer.";
  }

  return { values: { phone: phone || null, accessibilityNotes: accessibilityNotes || null }, errors };
}

const REGISTRATION_SELECT = `
  SELECT cr.id_pk AS registration_id, cr.class_id, cr.status AS registration_status,
         cr.phone, cr.accessibility_notes,
         DATE_FORMAT(cr.registered_at, '%Y-%m-%dT%H:%i:%sZ') AS registered_at,
         DATE_FORMAT(cr.cancelled_at, '%Y-%m-%dT%H:%i:%sZ') AS cancelled_at,
         c.class_name, DATE_FORMAT(c.starts_at, '%Y-%m-%d') AS date,
         DATE_FORMAT(c.starts_at, '%H:%i') AS start_time,
         DATE_FORMAT(c.ends_at, '%H:%i') AS end_time,
         c.attendance_format, c.location, c.capacity
  FROM class_registrations cr
  JOIN classes c ON c.id_pk = cr.class_id`;

// Returns a Map of class ID -> active registration count. A zero is known,
// unlike the pre-registration-storage implementation.
async function getRegistrationCounts(classIds, connection) {
  const ids = [...new Set(classIds.map(Number).filter(Number.isInteger))];
  const counts = new Map(ids.map((id) => [id, 0]));
  if (!ids.length) return counts;

  const executor = connection || db;
  const placeholders = ids.map(() => "?").join(", ");
  try {
    const [rows] = await executor.execute(
      `SELECT class_id, COUNT(*) AS registration_count
       FROM class_registrations
       WHERE status = ? AND class_id IN (${placeholders})
       GROUP BY class_id`,
      [REGISTRATION_STATUS, ...ids]
    );
    rows.forEach((row) => counts.set(row.class_id, Number(row.registration_count)));
    return counts;
  } catch (error) {
    /*
     * Existing databases do not have the new table until the reviewed migration
     * is applied. They have no persisted registrations yet, so retain the zero
     * values initialized above for existing published classes.
     */
    if (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146) {
      return counts;
    }
    throw error;
  }
}

async function listUserRegistrations(userId) {
  const [rows] = await db.execute(
    `${REGISTRATION_SELECT}
     WHERE cr.user_id = ?
     ORDER BY cr.registered_at DESC, cr.id_pk DESC`,
    [userId]
  );
  return rows.map(toRegistration);
}

async function listClassRoster(classId) {
  try {
    const [rows] = await db.execute(
      `SELECT cr.id_pk AS registration_id, cr.status, cr.phone, cr.accessibility_notes,
              DATE_FORMAT(cr.registered_at, '%Y-%m-%dT%H:%i:%sZ') AS registered_at,
              DATE_FORMAT(cr.cancelled_at, '%Y-%m-%dT%H:%i:%sZ') AS cancelled_at,
              u.name, u.email
       FROM class_registrations cr
       JOIN users u ON u.id_pk = cr.user_id
       WHERE cr.class_id = ?
       ORDER BY cr.status = 'registered' DESC, cr.registered_at, cr.id_pk`,
      [classId]
    );
    return rows.map((row) => ({
      id: row.registration_id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? "",
      accessibilityNotes: row.accessibility_notes ?? "",
      status: row.status,
      registeredAt: row.registered_at,
      cancelledAt: row.cancelled_at
    }));
  } catch (error) {
    // Let administrators view class details during the migration rollout.
    // There cannot be any persisted roster entries before this table exists.
    if (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146) return [];
    throw error;
  }
}

async function getMeetingAccess({ classId, userId }) {
  const [rows] = await db.execute(
    `SELECT c.id_pk, c.status AS class_status, c.attendance_format, c.meeting_link,
            cr.status AS registration_status
     FROM classes c
     LEFT JOIN class_registrations cr
       ON cr.class_id = c.id_pk AND cr.user_id = ?
     WHERE c.id_pk = ?`,
    [userId, classId]
  );
  const record = rows[0];

  if (!record || record.class_status !== "published") {
    throw registrationError(404, "This class is not available.", "class_unavailable");
  }

  if (record.registration_status !== REGISTRATION_STATUS) {
    throw registrationError(403, "You need an active registration to access this meeting.", "active_registration_required");
  }

  if (
    !["virtual", "hybrid"].includes(record.attendance_format) ||
    !record.meeting_link
  ) {
    throw registrationError(409, "An online meeting link is not available for this class.", "meeting_unavailable");
  }

  return { meetingLink: record.meeting_link };
}

async function createRegistration({ classId, userId, phone, accessibilityNotes }) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [classes] = await connection.execute(
      "SELECT id_pk, capacity, status FROM classes WHERE id_pk = ? FOR UPDATE",
      [classId]
    );
    const classRecord = classes[0];
    if (!classRecord || classRecord.status !== "published") {
      throw registrationError(404, "Class not found.");
    }

    const [existing] = await connection.execute(
      "SELECT id_pk, status FROM class_registrations WHERE class_id = ? AND user_id = ? FOR UPDATE",
      [classId, userId]
    );
    const counts = await getRegistrationCounts([classId], connection);
    if (classRecord.capacity !== null && counts.get(classId) >= classRecord.capacity) {
      throw registrationError(409, "This class is currently full.", "class_full");
    }

    if (existing.length) {
      if (existing[0].status === REGISTRATION_STATUS) {
        throw registrationError(409, "You already have a registration for this class.", "already_registered");
      }
      await connection.execute(
        `UPDATE class_registrations
         SET status = ?, cancelled_at = NULL
         WHERE id_pk = ?`,
        [REGISTRATION_STATUS, existing[0].id_pk]
      );
      await connection.commit();
      return existing[0].id_pk;
    }

    const [result] = await connection.execute(
      `INSERT INTO class_registrations
       (class_id, user_id, phone, accessibility_notes, status)
       VALUES (?, ?, ?, ?, ?)`,
      [classId, userId, phone, accessibilityNotes, REGISTRATION_STATUS]
    );
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelRegistration({ registrationId, userId }) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [registrations] = await connection.execute(
      "SELECT id_pk, class_id, user_id, status FROM class_registrations WHERE id_pk = ? FOR UPDATE",
      [registrationId]
    );
    const registration = registrations[0];
    if (!registration) throw registrationError(404, "Registration not found.");
    if (registration.user_id !== userId) throw registrationError(403, "You cannot cancel this registration.");

    // A repeated click/retry has no additional seat effect.
    if (registration.status === CANCELLED_STATUS) {
      await connection.commit();
      return { status: CANCELLED_STATUS, changed: false };
    }

    await connection.execute("SELECT id_pk FROM classes WHERE id_pk = ? FOR UPDATE", [registration.class_id]);
    await connection.execute(
      `UPDATE class_registrations
       SET status = ?, cancelled_at = CURRENT_TIMESTAMP
       WHERE id_pk = ?`,
      [CANCELLED_STATUS, registrationId]
    );
    await connection.commit();
    return { status: CANCELLED_STATUS, changed: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  CANCELLED_STATUS,
  REGISTRATION_STATUS,
  cancelRegistration,
  createRegistration,
  getRegistrationCounts,
  getMeetingAccess,
  listClassRoster,
  listUserRegistrations,
  registrationError,
  validateRegistrationInput
};

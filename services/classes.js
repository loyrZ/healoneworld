"use strict";

// HOW-132: Shared class data for the admin class list, class editing,
// the public calendar, and class details. Field meanings and visibility
// rules are documented in docs/class-data.md.
// Claude generated

const db = require("../conf/database");
const { getRegistrationCounts } = require("./class-registrations");

const FORMATS = ["in_person", "virtual", "hybrid"];
const TIME_ZONES = ["America/Los_Angeles"];
const MAX_CAPACITY = 1000;
const MAX_DESCRIPTION = 5000;

// The only fields a create or edit request may set.
const EDITABLE_FIELDS = [
  "title",
  "description",
  "date",
  "startTime",
  "endTime",
  "timeZone",
  "format",
  "location",
  "meetingLink",
  "instructor",
  "capacity"
];

// Dates and times are local wall-clock values in the class's time_zone.
// Formatting them in SQL keeps the server's own time zone out of the result.
const SELECT_CLASSES = `
  SELECT id_pk, class_name, user_name, description,
         DATE_FORMAT(starts_at, '%Y-%m-%d') AS date,
         DATE_FORMAT(starts_at, '%H:%i') AS start_time,
         DATE_FORMAT(ends_at, '%H:%i') AS end_time,
         time_zone, attendance_format, location, meeting_link,
         capacity, status
  FROM classes`;

const ORDER_BY_START = "ORDER BY starts_at IS NULL, starts_at, id_pk";

// Admin view: includes pending classes and private meeting links.
function toAdminClass(row, registrationCount) {
  return {
    id: row.id_pk,
    title: row.class_name,
    description: row.description ?? "",
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    timeZone: row.time_zone,
    format: row.attendance_format,
    location: row.location ?? "",
    meetingLink: row.meeting_link ?? "",
    instructor: row.user_name,
    capacity: row.capacity,
    status: row.status,
    // null means unavailable, never zero.
    registrationCount: registrationCount ?? null
  };
}

// Public view: never includes the meeting link, which is only for
// registered attendees.
function toPublicClass(row) {
  return {
    id: row.id_pk,
    title: row.class_name,
    description: row.description ?? "",
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    timeZone: row.time_zone,
    format: row.attendance_format,
    location: row.location ?? "",
    instructor: row.user_name,
    capacity: row.capacity
  };
}

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    year >= 2000 &&
    year <= 2100 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isMeetingLink(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// Checks a create or edit request and converts it to database columns.
// Returns { values, errors }; values is only safe to save when errors is empty.
function validateClassInput(input) {
  const errors = {};
  const text = {};

  for (const field of EDITABLE_FIELDS) {
    if (field === "capacity") continue;

    const value = input[field];

    if (value === undefined || value === null) {
      text[field] = "";
    } else if (typeof value !== "string") {
      errors[field] = "Must be text.";
      text[field] = "";
    } else {
      text[field] = value.trim();
    }
  }

  if (!text.title) errors.title ??= "Enter a title.";
  else if (text.title.length > 255) errors.title = "Use 255 characters or fewer.";

  if (text.description.length > MAX_DESCRIPTION) {
    errors.description = `Use ${MAX_DESCRIPTION} characters or fewer.`;
  }

  if (!text.instructor) errors.instructor ??= "Enter an instructor.";
  else if (text.instructor.length > 255) errors.instructor = "Use 255 characters or fewer.";

  if (!text.date) errors.date ??= "Enter a date.";
  else if (!isRealDate(text.date)) errors.date = "Enter a valid date.";

  if (!text.startTime) errors.startTime ??= "Enter a start time.";
  else if (!isTime(text.startTime)) errors.startTime = "Enter a valid start time.";

  if (!text.endTime) errors.endTime ??= "Enter an end time.";
  else if (!isTime(text.endTime)) errors.endTime = "Enter a valid end time.";
  else if (isTime(text.startTime) && text.endTime <= text.startTime) {
    errors.endTime = "End time must be after the start time.";
  }

  if (!TIME_ZONES.includes(text.timeZone)) {
    errors.timeZone ??= "Choose a supported time zone.";
  }

  if (!FORMATS.includes(text.format)) {
    errors.format ??= "Choose in person, virtual, or hybrid.";
  }

  const needsLocation = text.format === "in_person" || text.format === "hybrid";
  const needsLink = text.format === "virtual" || text.format === "hybrid";

  if (needsLocation) {
    if (!text.location) errors.location ??= "Enter a location for in-person attendance.";
    else if (text.location.length > 255) errors.location = "Use 255 characters or fewer.";
  }

  if (needsLink) {
    if (!text.meetingLink) errors.meetingLink ??= "Enter a meeting link for virtual attendance.";
    else if (text.meetingLink.length > 2048 || !isMeetingLink(text.meetingLink)) {
      errors.meetingLink = "Enter a valid https:// meeting link.";
    }
  }

  const capacityText =
    typeof input.capacity === "number" || typeof input.capacity === "string"
      ? String(input.capacity).trim()
      : "";
  const capacity = Number(capacityText);

  if (!capacityText) {
    errors.capacity = "Enter a capacity.";
  } else if (!/^\d+$/.test(capacityText) || capacity < 1 || capacity > MAX_CAPACITY) {
    errors.capacity = `Enter a whole number from 1 to ${MAX_CAPACITY}.`;
  }

  const values = {
    class_name: text.title,
    description: text.description || null,
    starts_at: `${text.date} ${text.startTime}:00`,
    ends_at: `${text.date} ${text.endTime}:00`,
    time_zone: text.timeZone,
    attendance_format: text.format,
    // Drop details that don't apply so an old private link is not kept.
    location: needsLocation ? text.location : null,
    meeting_link: needsLink ? text.meetingLink : null,
    user_name: text.instructor,
    capacity
  };

  return { values, errors };
}

async function listAdminClasses() {
  const [rows] = await db.execute(`${SELECT_CLASSES} ${ORDER_BY_START}`);
  const counts = await getRegistrationCounts(rows.map((row) => row.id_pk));

  return rows.map((row) => toAdminClass(row, counts.get(row.id_pk)));
}

async function getAdminClass(id) {
  const [rows] = await db.execute(`${SELECT_CLASSES} WHERE id_pk = ?`, [id]);

  if (rows.length !== 1) return null;

  const counts = await getRegistrationCounts([id]);
  return toAdminClass(rows[0], counts.get(id));
}

async function listPublicClasses() {
  const [rows] = await db.execute(
    `${SELECT_CLASSES}
     WHERE status = 'published' AND starts_at IS NOT NULL
     ${ORDER_BY_START}`
  );

  return rows.map(toPublicClass);
}

async function getPublicClass(id) {
  const [rows] = await db.execute(
    `${SELECT_CLASSES}
     WHERE status = 'published' AND starts_at IS NOT NULL AND id_pk = ?`,
    [id]
  );

  return rows.length === 1 ? toPublicClass(rows[0]) : null;
}

// Column values in the order used by the INSERT and UPDATE statements below.
function columnValues(values) {
  return [
    values.class_name,
    values.description,
    values.starts_at,
    values.ends_at,
    values.time_zone,
    values.attendance_format,
    values.location,
    values.meeting_link,
    values.user_name,
    values.capacity
  ];
}

/*
 * HOW-140: Saves validated values from validateClassInput as a new session.
 * Admin-created sessions are published straight away; 'pending' is for
 * volunteer submissions. Registrations are never set here: counts only come
 * from saved registrations.
 * 
 * Claude Revised 
 */
async function createClass(values) {
  const [result] = await db.execute(
    `INSERT INTO classes
       (class_name, description, starts_at, ends_at, time_zone,
        attendance_format, location, meeting_link, user_name, capacity,
        status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
    columnValues(values)
  );

  return getAdminClass(result.insertId);
}

/*
 * Saves validated values from validateClassInput.
 * Lowering capacity needs confirmCapacityReduction when the new capacity is
 * below the active registration count, or when that count is unknown.
 * The count is rechecked here rather than trusting the browser's copy.
 * Returns { class }, { notFound: true }, or { capacityConflict }.
 */
async function updateClass(id, values, { confirmCapacityReduction = false } = {}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the row so the capacity check and the update see the same record.
    const [rows] = await connection.execute(
      "SELECT capacity FROM classes WHERE id_pk = ? FOR UPDATE",
      [id]
    );

    if (rows.length !== 1) {
      await connection.rollback();
      return { notFound: true };
    }

    const currentCapacity = rows[0].capacity;

    if (currentCapacity !== null && values.capacity < currentCapacity) {
      const counts = await getRegistrationCounts([id], connection);
      const registrationCount = counts.has(id) ? counts.get(id) : null;
      const unsafe =
        registrationCount === null || values.capacity < registrationCount;

      if (unsafe && !confirmCapacityReduction) {
        await connection.rollback();
        return {
          capacityConflict: { registrationCount, capacity: values.capacity }
        };
      }
    }

    await connection.execute(
      `UPDATE classes
       SET class_name = ?,
           description = ?,
           starts_at = ?,
           ends_at = ?,
           time_zone = ?,
           attendance_format = ?,
           location = ?,
           meeting_link = ?,
           user_name = ?,
           capacity = ?
       WHERE id_pk = ?`,
      [...columnValues(values), id]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { class: await getAdminClass(id) };
}

module.exports = {
  EDITABLE_FIELDS,
  FORMATS,
  TIME_ZONES,
  MAX_CAPACITY,
  toAdminClass,
  toPublicClass,
  validateClassInput,
  listAdminClasses,
  getAdminClass,
  listPublicClasses,
  getPublicClass,
  createClass,
  updateClass
};

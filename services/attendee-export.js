"use strict";

// HOW-156 / HOW-157: turns active attendees into a CSV for the "Export CSV" button
// (Figma: Admin / Class Roster -> Toolbar -> Actions).
// Pure functions with no database access, so HOW-157 can test them directly.

// Only what attendance needs (HOW-110 #6).
const CSV_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" }
];

const STATUS_LABELS = {
  active: "Registered",
  canceled: "Canceled",
  removed: "Removed"
};

// Names are typed by the public, so a cell can't be trusted to be plain text (HOW-110 #7).
function toCsvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);

  // Spreadsheets run cells starting with these as formulas.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
}

function cellValue(attendee, column) {
  if (column.key === "status") {
    return STATUS_LABELS[attendee.status] ?? attendee.status;
  }
  return attendee[column.key];
}

// \r\n line endings because Excel and Google Sheets both expect them.
// An empty roster still gets the header row.
function toAttendeeCsv(attendees) {
  const header = CSV_COLUMNS.map((column) => toCsvCell(column.label)).join(",");
  const rows = attendees.map((attendee) =>
    CSV_COLUMNS.map((column) => toCsvCell(cellValue(attendee, column))).join(",")
  );

  return `${[header, ...rows].join("\r\n")}\r\n`;
}

// "community-yoga-2026-10-14-attendees.csv"
function csvFileName(classRecord) {
  const slug = String(classRecord.title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "class";

  return [slug, classRecord.date, "attendees"].filter(Boolean).join("-") + ".csv";
}

module.exports = { CSV_COLUMNS, toCsvCell, toAttendeeCsv, csvFileName };

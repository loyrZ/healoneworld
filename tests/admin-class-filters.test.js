"use strict";

// HOW-133: Search and filter behavior for the admin class list.
//  Claude Revised 
// Entirely claude generated

const test = require("node:test");
const assert = require("node:assert/strict");

const CLASSES = [
  { id: 1, title: "Yoga for All Levels", date: "2026-11-20", status: "published", instructor: "Maya Chen" },
  { id: 2, title: "Guided Meditation", date: "2026-11-21", status: "published", instructor: "Jordan Lee" },
  { id: 3, title: "Gentle Evening Stretch", date: "2026-11-27", status: "pending", instructor: "Jordan Lee" },
  { id: 4, title: "Restorative YOGA", date: "2026-12-04", status: "pending", instructor: "Maya Chen" }
];

async function load() {
  return import("../public/admin/classes/classData.mjs");
}

function ids(list) {
  return list.map((item) => item.id);
}

test("no filters returns every class", async () => {
  const { filterClasses, NO_FILTERS } = await load();
  assert.deepEqual(ids(filterClasses(CLASSES, NO_FILTERS)), [1, 2, 3, 4]);
});

test("search matches class titles without case sensitivity", async () => {
  const { filterClasses, NO_FILTERS } = await load();

  assert.deepEqual(ids(filterClasses(CLASSES, { ...NO_FILTERS, search: "yoga" })), [1, 4]);
  assert.deepEqual(ids(filterClasses(CLASSES, { ...NO_FILTERS, search: "  MEDITATION " })), [2]);
  assert.deepEqual(ids(filterClasses(CLASSES, { ...NO_FILTERS, search: "pilates" })), []);
});

test("date range includes both ends", async () => {
  const { filterClasses, NO_FILTERS } = await load();

  assert.deepEqual(
    ids(filterClasses(CLASSES, { ...NO_FILTERS, from: "2026-11-21", to: "2026-11-27" })),
    [2, 3]
  );
  assert.deepEqual(ids(filterClasses(CLASSES, { ...NO_FILTERS, from: "2026-11-28" })), [4]);
  assert.deepEqual(ids(filterClasses(CLASSES, { ...NO_FILTERS, to: "2026-11-20" })), [1]);
});

test("status and instructor filters work independently and together", async () => {
  const { filterClasses, NO_FILTERS } = await load();

  assert.deepEqual(ids(filterClasses(CLASSES, { ...NO_FILTERS, status: "pending" })), [3, 4]);
  assert.deepEqual(ids(filterClasses(CLASSES, { ...NO_FILTERS, instructor: "Jordan Lee" })), [2, 3]);
  assert.deepEqual(
    ids(filterClasses(CLASSES, {
      search: "yoga",
      from: "2026-11-01",
      to: "2026-12-31",
      status: "pending",
      instructor: "Maya Chen"
    })),
    [4]
  );
});

test("filtering keeps each class's stable ID", async () => {
  const { filterClasses, NO_FILTERS } = await load();
  const [match] = filterClasses(CLASSES, { ...NO_FILTERS, search: "stretch" });

  assert.equal(match, CLASSES[2]);
});

test("unknown registration counts are labeled as unavailable", async () => {
  const { registrationLabel } = await load();

  assert.equal(registrationLabel({ registrationCount: null }), "Registrations unavailable");
  assert.equal(registrationLabel({ registrationCount: 0 }), "0 registered");
  assert.equal(registrationLabel({ registrationCount: 18 }), "18 registered");
});

test("times are shown in 12-hour format", async () => {
  const { formatTime } = await load();

  assert.equal(formatTime("18:00"), "6 PM");
  assert.equal(formatTime("09:05"), "9:05 AM");
  assert.equal(formatTime("00:30"), "12:30 AM");
  assert.equal(formatTime("12:00"), "12 PM");
});

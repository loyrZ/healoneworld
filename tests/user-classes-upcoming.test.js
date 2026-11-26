"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

function cardFields(classItem) {
  const format = classItem.format || classItem.mode;
  return {
    title: classItem.title || classItem.name || "Class name unavailable",
    format: format || "Class",
    location: classItem.location || (format === "virtual" || format === "Online" ? "Virtual" : "Location unavailable")
  };
}

function selectUpcomingClasses(classes, currentTime, limit = 3) {
  return classes
    .map((classItem) => ({
      classItem,
      startTime: new Date(`${classItem.date}T${classItem.startKey}:00`).getTime()
    }))
    .filter(({ startTime }) => Number.isFinite(startTime) && startTime >= currentTime)
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, limit)
    .map(({ classItem }) => classItem.id);
}

test("upcoming classes shows the three earliest future start times", () => {
  const classes = [
    { id: 1, date: "2026-11-25", startTime: "10:00 AM", startKey: "10:00" },
    { id: 2, date: "2026-11-25", startTime: "5:00 PM", startKey: "17:00" },
    { id: 3, date: "2026-11-30", startTime: "9:00 AM", startKey: "09:00" },
    { id: 4, date: "2026-12-02", startTime: "8:00 AM", startKey: "08:00" },
    { id: 5, date: "2026-12-02", startTime: "6:00 PM", startKey: "18:00" }
  ];

  const now = new Date("2026-11-25T08:00:00").getTime();

  assert.deepEqual(selectUpcomingClasses(classes, now), [1, 2, 3]);
});

test("upcoming classes excludes sessions that have already started", () => {
  const classes = [
    { id: 1, date: "2026-11-25", startTime: "8:00 AM", startKey: "08:00" },
    { id: 2, date: "2026-11-25", startTime: "9:00 AM", startKey: "09:00" },
    { id: 3, date: "2026-11-30", startTime: "9:00 AM", startKey: "09:00" }
  ];

  const now = new Date("2026-11-25T08:30:00").getTime();

  assert.deepEqual(selectUpcomingClasses(classes, now), [2, 3]);
});

test("upcoming class cards use the public schedule name and mode fields", () => {
  assert.deepEqual(cardFields({ name: "Donuts", mode: "Online", location: "" }), {
    title: "Donuts",
    format: "Online",
    location: "Virtual"
  });
});
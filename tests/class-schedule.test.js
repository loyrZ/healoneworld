"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "public", "js", "class-schedule.js"), "utf8");

function loadSchedule(responseBody) {
  const context = {
    window: {},
    fetch: async () => ({ ok: true, status: 200, json: async () => responseBody })
  };
  vm.runInNewContext(source, context);
  return context.window.ClassSchedule;
}

test("public schedule availability comes directly from the server response", async () => {
  const schedule = loadSchedule([{ id: 2, title: "Yoga", date: "2026-12-01", startTime: "18:00", endTime: "19:00", format: "in_person", capacity: 66, availableSeats: 65 }]);
  const [item] = await schedule.loadSchedule();

  assert.equal(item.availableSeats, 65);
  assert.equal("getStoredAvailableSeats" in schedule, false);
  assert.equal(source.includes("localStorage"), false);
});
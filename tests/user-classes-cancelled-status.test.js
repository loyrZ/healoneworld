"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(
  path.join(root, "Register For Classes Page", "User's Classes.js"),
  "utf8"
);
const styles = fs.readFileSync(
  path.join(root, "Register For Classes Page", "User's Classes Style.css"),
  "utf8"
);

test("cancelled registrations have a visible status on My Classes cards", () => {
  assert.match(script, /registration\.status === "cancelled"/);
  assert.match(script, /status\.textContent = "Canceled"/);
  assert.match(script, /registration-status--cancelled/);
  assert.match(styles, /\.registration-status--cancelled/);
});
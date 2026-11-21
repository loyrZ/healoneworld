"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const projectRoot = path.join(__dirname, "..");

test("donation demo accepts positive amounts and rejects invalid values", async () => {
  const demo = await import(pathToFileURL(path.join(
    projectRoot,
    "public",
    "DonatePage",
    "donation-demo.mjs"
  )).href);

  assert.equal(demo.normalizeDonationAmount("25"), 25);
  assert.equal(demo.normalizeDonationAmount("12.345"), 12.35);
  assert.equal(demo.normalizeDonationAmount("0"), null);
  assert.equal(demo.normalizeDonationAmount("-10"), null);
  assert.equal(demo.normalizeDonationAmount("not an amount"), null);
  assert.equal(demo.formatDonationAmount(25), "$25.00");
});

test("donation navigation opens the completed demo page", () => {
  const routes = fs.readFileSync(path.join(projectRoot, "routes", "index.js"), "utf8");
  const main = fs.readFileSync(path.join(projectRoot, "public", "main.jsx"), "utf8");
  const donatePage = fs.readFileSync(path.join(
    projectRoot,
    "public",
    "DonatePage",
    "Donate.jsx"
  ), "utf8");

  assert.match(routes, /router\.get\("\/donate\.html"[\s\S]*?res\.redirect\("\/donate"\)/);
  assert.doesNotMatch(routes, /"\/donate\.html"\s*\]/);
  assert.match(main, /"\/donate": Donate/);
  assert.match(donatePage, /does[\s\S]*?not process payments, collect card details, or record donations/i);
  assert.match(donatePage, /No payment was processed and no donation was received/i);
});
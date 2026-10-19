"use strict";

const express = require("express");
const path = require("path");
const db = require("../conf/database");

const router = express.Router();
const publicDirectory = path.join(__dirname, "..", "public");

// Check the server and database connection.
router.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ server: "ok", db: "ok" });
  } catch (err) {
    res.status(503).json({
      server: "ok",
      db: "down",
      reason: err.code || err.message
    });
  }
});

// Preserve the homepage route added by the team.
router.get("/home", (req, res) => {
  res.sendFile(path.join(publicDirectory, "home.html"));
});

// Connect the existing navigation address to the team's React login.
router.get("/signin.html", (req, res) => {
  res.redirect("/sign-in");
});

// Temporary destinations for unfinished pages.
const placeholderRoutes = [
  "/programs.html",
  "/volunteer.html",
  "/rent.html",
  "/about.html",
  "/blog.html",
  "/donate.html"
];

router.get(placeholderRoutes, (req, res) => {
  res.sendFile(path.join(publicDirectory, "coming-soon.html"));
});

// The incoming account route contained unfinished example code.
// Return an explicit response until its owner implements it.
router.post("/addaccount", (req, res) => {
  res.status(501).json({
    error: "Account creation is not implemented on this endpoint."
  });
});

module.exports = router;
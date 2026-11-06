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
router.get(["/", "/home", "/home.html"], (req, res) => {
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
// HOW-141: Shared loader for published classes, used by the calendar and class pages.
router.get("/js/class-schedule.js", (req, res) => {
  res.sendFile(path.join(publicDirectory, "js", "class-schedule.js"));
});

// Serve the existing class page and its required assets.
const classPageFiles = [
  "/classes/ClassPage.html",
  "/classes/ClassPageStyle.css",
  "/classes/ViewClassesButtons.js",
  "/classes/style.css",
  "/classes/FilterButtons.js"
];

// HOW-141: Public list of upcoming classes.
router.get("/classes/upcoming.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "Upcoming Classes Practice", "Header & Section.html")
  );
});

// HOW-141: Public calendar and its assets.
const calendarFiles = [
  "/calendar/Calendar.html",
  "/calendar/Calendar.css",
  "/calendar/calendar.js",
  "/calendar/FilterCalendar.js"
];

router.get(calendarFiles, (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "Calendar", path.basename(req.path))
  );
});

router.get("/calendar", (req, res) => {
  res.redirect("/calendar/Calendar.html");
});

router.get(classPageFiles, (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "Upcoming Classes Practice",
      path.basename(req.path)
    )
  );
});

// Preserve old links to the deleted duplicate.
router.get("/classes.html", (req, res) => {
  res.redirect("/classes/ClassPage.html");
});

// Serve the shared HTML header used by the homepage.
router.get("/components/header.html", (req, res) => {
  res.sendFile(
    path.join(publicDirectory, "components", "header.html")
  );
});
module.exports = router;
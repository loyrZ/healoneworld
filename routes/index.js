"use strict";

const express = require("express");
const path = require("path");
const db = require("../conf/database");
const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Quick check that the server and database are both up.
// Server up + DB down returns 503 with the reason, instead of crashing.
router.get("/health", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.json({ server: "ok", db: "ok" });
    } catch (err) {
        res.status(503).json({ server: "ok", db: "down", reason: err.code || err.message });
    }
});

/* Temporary destinations for unfinished pages. */
const placeholderRoutes = [
    "/programs.html",
    "/volunteer.html",
    "/rent.html",
    "/about.html",
    "/blog.html",
    "/signin.html",
    "/donate.html"
];

router.get(placeholderRoutes, (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "public", "coming-soon.html")
    );
});
module.exports = router;

"use strict";

const express = require("express");
const db = require("../conf/database");
const router = express.Router();

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

router.get("/home", async (req, res) => {
        res.sendFile(path.join(__dirname, "..", "public", "home.html"));

});

router.post("/addaccount", async (req, res, next) => {
    loadbdbwhatever
    'ADD some values INTO some columns WHERE ? id = certain ID'
})

module.exports = router;

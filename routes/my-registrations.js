"use strict";

// HOW-568 / HOW-288: lets My Classes show when an admin removed someone or a
// class was canceled. Mounted at /api/my-registrations. Only ever returns the
// signed-in person's own rows (req.applicationUser.id), never a browser-supplied ID.

const express = require("express");
const { requireApplicationUser } = require("../middleware/auth");
const classRoster = require("../services/class-roster");

const router = express.Router();

router.get("/", requireApplicationUser, async (req, res, next) => {
    try {
        res.set("Cache-Control", "no-store");
        res.json(await classRoster.listUserRegistrationStatuses(req.applicationUser.id));
    } catch (err) {
        next(err);
    }
});

module.exports = router;

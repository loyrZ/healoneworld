"use strict";

// HOW-568 / HOW-288: lets My Classes show when an admin removed someone or a
// class was canceled. Mounted at /api/my-registrations. Only ever reads or
// writes the signed-in person's own rows (req.applicationUser.id), never a
// browser-supplied user ID.

const express = require("express");
const { requireApplicationUser } = require("../middleware/auth");
const classRoster = require("../services/class-roster");
const classRegistrations = require("../services/class-registrations");

const router = express.Router();

router.use(requireApplicationUser, (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

router.get("/", async (req, res, next) => {
    try {
        res.json(await classRoster.listUserRegistrationStatuses(req.applicationUser.id));
    } catch (err) {
        next(err);
    }
});

// HOW-228 / HOW-379: register the signed-in person for a class.
//class registration never hit database, resolved it -gates
const REJECTIONS = {
    not_found: [404, "This class could not be found."],
    canceled: [409, "This class was canceled, so registration is closed."],
    started: [409, "This class has already started, so registration is closed."],
    full: [409, "This class is currently full."],
    already_registered: [409, "You have already registered for this class."],
    removed: [403, "An organizer removed you from this class. Contact us if you think this is a mistake."],
};

router.post("/", async (req, res, next) => {
    try {
        const input = classRegistrations.validateRegistrationInput(req.body);

        if (input.errors) {
            return res.status(400).json({ error: "Please fix the highlighted fields.", errors: input.errors });
        }

        const result = await classRegistrations.registerForClass(req.applicationUser.id, input.values);

        if (result.rejected) {
            const [status, message] = REJECTIONS[result.rejected];
            return res.status(status).json({ error: message, code: result.rejected });
        }

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

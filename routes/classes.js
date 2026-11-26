"use strict";

// HOW-132, HOW-140, HOW-166: Class data endpoints, mounted at /api/classes.
// Admin endpoints include pending classes and meeting links.
// Public endpoints only return published classes and never meeting links.
//  Claude Revised 

const express = require("express");
const { requireRole } = require("../middleware/auth");
const classes = require("../services/classes");
const classRoster = require("../services/class-roster");
const attendeeExport = require("../services/attendee-export");

const router = express.Router();

// Accepts positive whole-number IDs only; anything else is treated as not found.
function parseId(value) {
    return /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
}

// Shared by create and edit. Returns { values, options } when the body is
// valid; otherwise sends a 400 response and returns null.
function readClassBody(req, res) {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ error: "Invalid request." });
        return null;
    }

    const { confirmCapacityReduction, ...fields } = body;
    const rejected = Object.keys(fields).filter(
        (key) => !classes.EDITABLE_FIELDS.includes(key)
    );

    if (rejected.length) {
        res.status(400).json({
            error: "Some of these fields cannot be set.",
            rejected,
        });
        return null;
    }

    const { values, errors } = classes.validateClassInput(fields);

    if (Object.keys(errors).length) {
        res.status(400).json({
            error: "Please fix the highlighted fields. Nothing was saved.",
            errors,
        });
        return null;
    }

    return {
        values,
        options: { confirmCapacityReduction: confirmCapacityReduction === true },
    };
}

// --- Admin (HOW-104, HOW-113) ---

// Signed out: 401. Signed in without admin permission: 403.
router.use("/admin", requireRole("administrator"), (req, res, next) => {
    // Admin responses include private meeting links: never cache them.
    res.set("Cache-Control", "no-store");
    next();
});

router.get("/admin", async (req, res, next) => {
    try {
        res.json(await classes.listAdminClasses());
    } catch (err) {
        next(err);
    }
});

// HOW-140: Create a scheduled session.
router.post("/admin", async (req, res, next) => {
    try {
        const input = readClassBody(req, res);
        if (!input) return;

        const created = await classes.createClass(input.values);
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

router.get("/admin/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const record = id && await classes.getAdminClass(id);

        if (!record) {
            return res.status(404).json({ error: "Class not found." });
        }

        res.json(record);
    } catch (err) {
        next(err);
    }
});

router.put("/admin/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        if (!id) {
            return res.status(404).json({ error: "Class not found." });
        }

        const input = readClassBody(req, res);
        if (!input) return;

        const result = await classes.updateClass(id, input.values, input.options);

        if (result.notFound) {
            return res.status(404).json({ error: "Class not found." });
        }

        if (result.capacityConflict) {
            return res.status(409).json({
                error: "Lowering capacity needs confirmation. Nothing was saved.",
                code: "capacity_confirmation_required",
                ...result.capacityConflict,
            });
        }

        res.json(result.class);
    } catch (err) {
        next(err);
    }
});

// --- Admin roster, cancel, remove, export (Sprint 4) ---
// All of these are under /admin, so requireRole("administrator") above already
// runs and responses are no-store.

// HOW-148: class + roster for the Admin / Class Roster page
router.get("/admin/:id/roster", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const record = id && await classes.getAdminClass(id);

        if (!record) {
            return res.status(404).json({ error: "Class not found." });
        }

        const attendees = await classRoster.listRoster(id);
        const activeCount = attendees.filter((person) => person.status === "active").length;

        // The roster rows are the saved registrations, so their active count is
        // known even while the shared count service still returns unknown.
        res.json({
            class: { ...record, registrationCount: record.registrationCount ?? activeCount },
            attendees,
        });
    } catch (err) {
        next(err);
    }
});

// HOW-156: CSV download, active attendees only
router.get("/admin/:id/roster.csv", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const record = id && await classes.getAdminClass(id);

        if (!record) {
            return res.status(404).json({ error: "Class not found." });
        }

        const attendees = await classRoster.listActiveAttendees(id);

        res.set("Content-Type", "text/csv; charset=utf-8");
        res.attachment(attendeeExport.csvFileName(record));
        // The byte-order mark makes Excel read accented names as UTF-8.
        res.send(`﻿${attendeeExport.toAttendeeCsv(attendees)}`);
    } catch (err) {
        next(err);
    }
});

// HOW-287: cancel the class
router.post("/admin/:id/cancel", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        if (!id) {
            return res.status(404).json({ error: "Class not found." });
        }

        const result = await classes.cancelClass(id, req.applicationUser.id);

        if (result.notFound) {
            return res.status(404).json({ error: "Class not found." });
        }

        // A repeated cancel is reported as success, not an error: result.class
        // is the already-canceled session (HOW-279 #5).
        res.json(result.class);
    } catch (err) {
        next(err);
    }
});

// HOW-567: admin removes one registration from this class
router.post("/admin/:id/registrations/:registrationId/remove", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const registrationId = parseId(req.params.registrationId);

        if (!id || !registrationId) {
            return res.status(404).json({ error: "Registration not found." });
        }

        const result = await classRoster.removeAttendee(id, registrationId, req.applicationUser.id);

        if (result.notFound) {
            return res.status(404).json({ error: "Registration not found." });
        }

        // 409 so the page never shows a second "removed" success (HOW-540 #6).
        if (result.alreadyInactive) {
            return res.status(409).json({
                error: "This person is no longer registered for this class.",
                code: "registration_inactive",
                registration: result.registration,
            });
        }

        res.json({
            registration: result.registration,
            registrationCount: result.registrationCount,
        });
    } catch (err) {
        next(err);
    }
});

// --- Public (calendar and class details) ---

router.get("/", async (req, res, next) => {
    try {
        res.json(await classes.listPublicClasses());
    } catch (err) {
        next(err);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const record = id && await classes.getPublicClass(id);

        if (!record) {
            return res.status(404).json({ error: "Class not found." });
        }

        res.json(record);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

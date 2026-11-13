"use strict";

// HOW-132, HOW-140, HOW-166: Class data endpoints, mounted at /api/classes.
// Admin endpoints include pending classes and meeting links.
// Public endpoints only return published classes and never meeting links.
//  Claude Revised 

const express = require("express");
const { requireRole } = require("../middleware/auth");
const classes = require("../services/classes");

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

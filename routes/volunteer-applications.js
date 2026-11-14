"use strict";

const express = require("express");
const { requireRole } = require("../middleware/auth");
const applications = require("../services/volunteer-applications");

const router = express.Router();

function parseId(value) {
    return /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
}

router.use(requireRole("administrator"));

router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

router.get("/", async (req, res, next) => {
    try {
        const { status } = req.query;

        if (status && !applications.STATUSES.includes(status)) {
            return res.status(400).json({
                error: "Invalid application status."
            });
        }

        res.json(await applications.listAdminApplications(status));
    } catch (error) {
        next(error);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const application = id
            ? await applications.getAdminApplication(id)
            : null;

        if (!application) {
            return res.status(404).json({
                error: "Volunteer application not found."
            });
        }

        res.json(application);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
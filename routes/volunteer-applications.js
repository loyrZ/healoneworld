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

router.post("/:id/decision", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const { decision, reason = "" } = req.body || {};

        if (!id) {
            return res.status(404).json({ error: "Volunteer application not found." });
        }

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ error: "Decision must be approved or rejected." });
        }

        if (typeof reason !== "string" || reason.length > 2000) {
            return res.status(400).json({ error: "The decline reason is invalid." });
        }

        const result = await applications.decideApplication({
            id,
            decision,
            reason: reason.trim(),
            reviewerId: req.applicationUser.id
        });

        try {
            await applications.sendDecisionEmail(result);
            return res.json({ ...result, emailSent: true });
        } catch (emailError) {
            console.error("Resend volunteer decision email failed:", emailError);
            return res.status(202).json({
                ...result,
                emailSent: false,
                warning: "The decision was saved, but the email could not be sent."
            });
        }
    } catch (error) {
        if (error.status === 409) {
            return res.status(409).json({
                code: error.code,
                error: error.message,
                currentStatus: error.currentStatus
            });
        }
        next(error);
    }
});

module.exports = router;

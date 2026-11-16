"use strict";

const express = require("express");
const db = require("../conf/database");
const { requireAccount } = require("../middleware/volunteer");
const {
    getOrCreateApplicationUser
} = require("../services/application-user");

const router = express.Router();

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

// Signed-in users may apply.
// Do not use requireApprovedVolunteer here.
router.use(requireAccount);

function sendRouteError(err, res, next) {
    if (err.status) {
        return res.status(err.status).json({
            error: err.message
        });
    }

    next(err);
}

// GET /api/volunteer/application/me
router.get("/me", async (req, res, next) => {
    try {
        // This verifies the email and links the Clerk account to users.id_pk.
        const user = await getOrCreateApplicationUser(req);

        const [applications] = await db.query(
            `SELECT id_pk, status, created_at
             FROM volunteer_applications
             WHERE user_id = ?
               AND status = 'pending_review'
             ORDER BY created_at DESC
             LIMIT 1`,
            [user.id]
        );

        res.json({
            user: {
                name: user.name,
                email: user.email
            },
            verifiedEmail: true,
            application: applications.length > 0
                ? applications[0]
                : null
        });
    } catch (err) {
        sendRouteError(err, res, next);
    }
});

// POST /api/volunteer/application
router.post("/", async (req, res, next) => {
    try {
        // This verifies the email and returns the local users.id_pk.
        const user = await getOrCreateApplicationUser(req);

        const {
            phone,
            opportunity,
            availability,
            interests_skills,
            reason,
            request_id
        } = req.body ?? {};

        const fields = {
            phone,
            opportunity,
            availability,
            interests_skills,
            reason,
            request_id
        };

        const missingFields = Object.entries(fields)
            .filter(([, value]) => {
                return typeof value !== "string" || !value.trim();
            })
            .map(([field]) => field);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(", ")}.`
            });
        }

        const cleanPhone = phone.trim();
        const cleanOpportunity = opportunity.trim();
        const cleanAvailability = availability.trim();
        const cleanInterestsSkills = interests_skills.trim();
        const cleanReason = reason.trim();
        const cleanRequestId = request_id.trim();

        const phonePattern = /^[0-9+()\\-\\s.]{7,20}$/;

        if (!phonePattern.test(cleanPhone)) {
            return res.status(400).json({
                error: "Please enter a valid phone number."
            });
        }

        const maxLength = 500;

        if (
            cleanOpportunity.length > maxLength ||
            cleanAvailability.length > maxLength ||
            cleanInterestsSkills.length > maxLength ||
            cleanReason.length > maxLength
        ) {
            return res.status(400).json({
                error: "Application fields must be 500 characters or fewer."
            });
        }

        const [existingRequest] = await db.query(
            `SELECT id_pk
             FROM volunteer_applications
             WHERE request_id = ?`,
            [cleanRequestId]
        );

        if (existingRequest.length > 0) {
            return res.status(200).json({
                message: "Your volunteer application was already received."
            });
        }

        const [pendingApplications] = await db.query(
            `SELECT id_pk
             FROM volunteer_applications
             WHERE user_id = ?
               AND status = 'pending_review'
             LIMIT 1`,
            [user.id]
        );

        if (pendingApplications.length > 0) {
            return res.status(409).json({
                error: "You already have an application awaiting review."
            });
        }

        // The server assigns both user_id and status.
        // The browser cannot submit as another user or choose approval status.
        await db.query(
            `INSERT INTO volunteer_applications
                (
                    user_id,
                    phone,
                    opportunity,
                    availability,
                    interests_skills,
                    reason,
                    status,
                    request_id
                )
             VALUES (?, ?, ?, ?, ?, ?, 'pending_review', ?)`,
            [
                user.id,
                cleanPhone,
                cleanOpportunity,
                cleanAvailability,
                cleanInterestsSkills,
                cleanReason,
                cleanRequestId
            ]
        );

        res.status(201).json({
            message:
                "Your volunteer application was received and is awaiting review."
        });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(200).json({
                message: "Your volunteer application was already received."
            });
        }

        sendRouteError(err, res, next);
    }
});

module.exports = router;
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

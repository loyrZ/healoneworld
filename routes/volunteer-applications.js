"use strict";

const express = require("express");
const db = require("../conf/database");
const { requireAccount } = require("../middleware/volunteer");
const {
    getOrCreateApplicationUser
} = require("../services/application-user");

const router = express.Router();

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
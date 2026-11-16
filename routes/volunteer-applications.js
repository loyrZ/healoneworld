"use strict";

const express = require("express");
const db = require("../conf/database");
const { requireAccount } = require("../middleware/volunteer");

const router = express.Router();

router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Users must be signed in, but they do not need to be approved volunteers.
router.use(requireAccount);

function getVerifiedEmail(req) {
    return (
        req.clerkUser?.primaryEmailAddress?.verification?.status ===
        "verified"
    );
}

// GET /api/volunteer/application/me
router.get("/me", async (req, res, next) => {
    try {
        if (!getVerifiedEmail(req)) {
            return res.status(403).json({
                error: "Your email must be verified before applying.",
                verifiedEmail: false
            });
        }

        const [rows] = await db.query(
            `SELECT
                u.id_pk,
                u.name,
                u.email,
                va.status
             FROM users u
             LEFT JOIN volunteer_applications va
                ON va.user_id = u.id_pk
               AND va.status = 'pending_review'
             WHERE u.clerk_user_id = ?
             LIMIT 1`,
            [req.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Your account could not be found."
            });
        }

        const user = rows[0];

        res.json({
            user: {
                name: user.name,
                email: user.email
            },
            verifiedEmail: true,
            application: user.status
                ? { status: user.status }
                : null
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/volunteer/application
router.post("/", async (req, res, next) => {
    try {
        if (!getVerifiedEmail(req)) {
            return res.status(403).json({
                error: "Your email must be verified before applying."
            });
        }

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
            cleanAvailability.length > maxLength ||
            cleanInterestsSkills.length > maxLength ||
            cleanReason.length > maxLength
        ) {
            return res.status(400).json({
                error: "Availability, interests, and reason must be 500 characters or fewer."
            });
        }

        // The Clerk user ID comes from the authenticated request.
        // The browser cannot choose the applicant.
        const [users] = await db.query(
            `SELECT id_pk
             FROM users
             WHERE clerk_user_id = ?`,
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: "Your account could not be linked to an application."
            });
        }

        const userId = users[0].id_pk;

        // Prevent duplicate retries of the same request.
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

        // Prevent a user from submitting multiple pending applications.
        const [pendingApplications] = await db.query(
            `SELECT id_pk
             FROM volunteer_applications
             WHERE user_id = ?
               AND status = 'pending_review'
             LIMIT 1`,
            [userId]
        );

        if (pendingApplications.length > 0) {
            return res.status(409).json({
                error: "You already have an application awaiting review."
            });
        }

        // Status is always assigned by the server.
        // The client cannot choose approved or rejected.
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
                userId,
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
        // Duplicate request_id protection at the database level.
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(200).json({
                message: "Your volunteer application was already received."
            });
        }

        next(err);
    }
});

module.exports = router;
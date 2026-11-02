"use strict";

const db = require("../conf/database");
const express = require("express");
const { requireAccount, requireApprovedVolunteer } = require("../middleware/volunteer");
const router = express.Router();

// Personal data: never let the browser cache these responses.
router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Make sure user is a signed in approved volunteer
router.use(requireAccount, requireApprovedVolunteer);

// Get the name and email of the volunteer
router.get("/dashboard", (req, res) => {
    const u = req.clerkUser;
    res.json({
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        email: u.primaryEmailAddress?.emailAddress ?? null,
    });
});

const ALLOWED_FIELDS = ["phone", "interests", "availability"];
const PHONE_RE = /^[0-9+()\-\s.]{7,20}$/;
const MAX_TEXT = 500;

function validate({phone, interests, availability}) {
    const errors = {};
    if (phone && !PHONE_RE.test(phone)) errors.phone = "Enter a valid phone number.";
    if (interests.length >MAX_TEXT) errors.interests = `Max ${MAX_TEXT} characters.`;
    if (availability.length > MAX_TEXT) errors.availability = `Max ${MAX_TEXT} characters.`;
    return errors;
}

// Get the phone, interests, availability of the user for the profile
router.get("/profile", async(req,res, next) => {
    try {
        const [rows] = await db.query(
            "SELECT phone, interests, availability FROM volunteer_profiles WHERE clerk_user_id = ?",
            [req.userId]
        );
        res.json(rows[0] ?? {phone: "", interests: "", availability: ""});
    } catch (err) {
        next(err);
    }
});

// receive, check, and write volunteer's data and write to database
router.put("/profile", async (req, res, next) => {
    try {
        const body = req.body ?? {};
        if (typeof body !== "object" || Array.isArray(body)) {
            return res.status(400).json({error: "Invalid request."});
        }
        const unexpected = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key));
        if (unexpected.length) {
            return res.status(400).json({
                error: "Only phone, interests and availability can be updated.",
                rejected: unexpected,
            });
        }

        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined && typeof body[key] !== "string") {
                return res.status(400).json({ errors: { [key]: "Must be text." } });
            }
        }

        const phone = (body.phone ?? "").trim();
        const interests = (body.interests ?? "").trim();
        const availability = (body.availability ?? "").trim();

        const errors = validate({phone, interests, availability});
        if (Object.keys(errors).length) {
            return res.status(400).json({errors});
        }
        await db.query(
            `INSERT INTO volunteer_profiles (clerk_user_id, phone, interests, availability)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE phone = VALUES(phone),
                 interests = VALUES(interests), availability = VALUES(availability)`,
            [req.userId, phone, interests, availability]
        );
        res.json({ok:true});
    } catch (err) {
        next(err);
    }
});

module.exports = router;
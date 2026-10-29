"use strict";

const db = require("../conf/database");
const express = require("express");
const { requireAccount, requireApprovedVolunteer } = require("../middleware/volunteer");
const router = express.Router();

router.use(requireAccount, requireApprovedVolunteer);

router.get("/dashboard", (req, res) => {
    const u = req.clerkUser;
    res.json({
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        email: u.primaryEmailAddress?.emailAddress ?? null,
    });
});


const PHONE_RE = /^[0-9+()\-\s.]{7,20}$/;
const MAX_TEXT = 500;

function validate({phone, interests, availability}) {
    const errors = {};
    if (phone && !PHONE_RE.test(phone)) errors.phone = "Enter a valid phone number.";
    if (interests.length >MAX_TEXT) errors.interests - 'Max ${MAX_TEXT} characters.';
    if (availability.length > MAX_TEXT) errors.availability = 'Max ${MAX_TEXT} characters.';
    return errors;
}

router.get("/profile", async (req,res, next) => {
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

router.put("/profile", async (req, res, next) => {
    try {
        const body = req.body ?? {};
        const phone = String(body.phone ?? "").trim();
        const interests = String(body.interests ?? "").trim();
        const availability = String(body.availability ?? "").trim();

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
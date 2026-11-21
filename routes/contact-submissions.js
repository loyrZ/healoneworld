"use strict";

const express = require("express");
const contactSubmissions = require("../services/contact-submissions");

const router = express.Router();

router.post("/", async (req, res, next) => {
    try {
        const body = req.body;

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return res.status(400).json({ error: "Invalid request." });
        }

        const rejected = Object.keys(body).filter(
            (field) => !contactSubmissions.ALLOWED_FIELDS.includes(field)
        );

        if (rejected.length) {
            return res.status(400).json({
                error: "Some fields cannot be submitted.",
                rejected
            });
        }

        const { values, errors } = contactSubmissions.validateContactSubmission(body);

        if (Object.keys(errors).length) {
            return res.status(400).json({
                error: "Please fix the highlighted fields. Nothing was sent.",
                errors
            });
        }

        await contactSubmissions.createContactSubmission(values);
        return res.status(201).json({ ok: true });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
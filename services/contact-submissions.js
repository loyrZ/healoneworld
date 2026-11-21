"use strict";

const db = require("../conf/database");

const ALLOWED_FIELDS = ["name", "email", "subject", "message"];
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactSubmission(input) {
    const errors = {};
    const values = {};

    for (const field of ALLOWED_FIELDS) {
        const value = input[field];

        if (typeof value !== "string") {
            errors[field] = "Must be text.";
            values[field] = "";
            continue;
        }

        values[field] = value.trim();
    }

    if (!values.name) errors.name ??= "Enter your name.";
    else if (values.name.length > MAX_NAME_LENGTH) {
        errors.name = `Use ${MAX_NAME_LENGTH} characters or fewer.`;
    }

    if (!values.email) errors.email ??= "Enter your email address.";
    else if (values.email.length > MAX_EMAIL_LENGTH) {
        errors.email = `Use ${MAX_EMAIL_LENGTH} characters or fewer.`;
    } else if (!EMAIL_PATTERN.test(values.email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.subject) errors.subject ??= "Enter a subject.";
    else if (values.subject.length > MAX_SUBJECT_LENGTH) {
        errors.subject = `Use ${MAX_SUBJECT_LENGTH} characters or fewer.`;
    }

    if (!values.message) errors.message ??= "Enter a message.";
    else if (values.message.length > MAX_MESSAGE_LENGTH) {
        errors.message = `Use ${MAX_MESSAGE_LENGTH} characters or fewer.`;
    }

    return { values, errors };
}

async function createContactSubmission(values) {
    await db.execute(
        `INSERT INTO contact_submissions
            (name, email, subject, message, status)
         VALUES (?, ?, ?, ?, 'new')`,
        [values.name, values.email, values.subject, values.message]
    );
}

module.exports = {
    ALLOWED_FIELDS,
    MAX_NAME_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_SUBJECT_LENGTH,
    MAX_MESSAGE_LENGTH,
    validateContactSubmission,
    createContactSubmission
};
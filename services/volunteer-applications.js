"use strict";

const db = require("../conf/database");

const STATUSES = ["pending_review", "approved", "rejected"];

function mapApplication(row) {
    return {
        id: row.id_pk,
        applicantName: row.applicant_name,
        applicantEmail: row.email,
        opportunity: row.opportunity,
        phone: row.phone,
        interestsSkills: row.interests_skills,
        availability: row.availability,
        reason: row.reason,
        status: row.status,
        submittedAt: row.created_at
    };
}

async function listAdminApplications(status) {
    const validStatus = status && STATUSES.includes(status)
        ? status
        : null;

    const [rows] = await db.query(
        `SELECT
            va.id_pk,
            u.name AS applicant_name,
            u.email,
            va.opportunity,
            va.phone,
            va.interests_skills,
            va.availability,
            va.reason,
            va.status,
            va.created_at
         FROM volunteer_applications va
         JOIN users u ON u.id_pk = va.user_id
         ${validStatus ? "WHERE va.status = ?" : ""}
         ORDER BY va.created_at DESC, va.id_pk DESC`,
        validStatus ? [validStatus] : []
    );

    return rows.map(mapApplication);
}

async function getAdminApplication(id) {
    const [rows] = await db.query(
        `SELECT
            va.id_pk,
            u.name AS applicant_name,
            u.email,
            va.opportunity,
            va.phone,
            va.interests_skills,
            va.availability,
            va.reason,
            va.status,
            va.created_at
         FROM volunteer_applications va
         JOIN users u ON u.id_pk = va.user_id
         WHERE va.id_pk = ?`,
        [id]
    );

    return rows[0] ? mapApplication(rows[0]) : null;
}

module.exports = {
    STATUSES,
    listAdminApplications,
    getAdminApplication
};
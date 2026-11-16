"use strict";

const db = require("../conf/database");
const { sendVolunteerDecisionEmail } = require("./resend");

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
        reviewReason: row.review_reason,
        reviewedBy: row.reviewer_name ?? null,
        reviewedAt: row.reviewed_at,
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
            va.review_reason,
            va.reviewed_at,
            reviewer.name AS reviewer_name,
            va.created_at
         FROM volunteer_applications va
         JOIN users u ON u.id_pk = va.user_id
         LEFT JOIN users reviewer ON reviewer.id_pk = va.reviewed_by
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
            va.review_reason,
            va.reviewed_at,
            reviewer.name AS reviewer_name,
            va.created_at
         FROM volunteer_applications va
         JOIN users u ON u.id_pk = va.user_id
         LEFT JOIN users reviewer ON reviewer.id_pk = va.reviewed_by
         WHERE va.id_pk = ?`,
        [id]
    );

    return rows[0] ? mapApplication(rows[0]) : null;
}

async function decideApplication({ id, decision, reason, reviewerId }) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT va.id_pk, va.user_id, va.status,
                    u.name AS applicant_name, u.email
             FROM volunteer_applications va
             JOIN users u ON u.id_pk = va.user_id
             WHERE va.id_pk = ?
             FOR UPDATE`,
            [id]
        );

        if (rows.length !== 1) {
            const error = new Error("Volunteer application not found.");
            error.status = 404;
            throw error;
        }

        const application = rows[0];

        if (application.status !== "pending_review") {
            const error = new Error("This application has already been decided.");
            error.status = 409;
            error.code = "application_already_decided";
            error.currentStatus = application.status;
            throw error;
        }

        const [updated] = await connection.execute(
            `UPDATE volunteer_applications
             SET status = ?,
                 review_reason = ?,
                 reviewed_by = ?,
                 reviewed_at = CURRENT_TIMESTAMP
             WHERE id_pk = ? AND status = 'pending_review'`,
            [
                decision,
                decision === "rejected" ? reason || null : null,
                reviewerId,
                id
            ]
        );

        if (updated.affectedRows !== 1) {
            const error = new Error("This application has already been decided.");
            error.status = 409;
            error.code = "application_already_decided";
            throw error;
        }

        if (decision === "approved") {
            await connection.execute(
                `UPDATE permission
                 SET volunteer = TRUE
                 WHERE id_fk = ?`,
                [application.user_id]
            );
        }

        await connection.commit();

        return {
            id,
            decision,
            applicantName: application.applicant_name,
            applicantEmail: application.email,
            reason: decision === "rejected" ? reason || null : null
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function sendDecisionEmail(decision) {
    return sendVolunteerDecisionEmail(decision);
}

module.exports = {
    STATUSES,
    listAdminApplications,
    getAdminApplication,
    decideApplication,
    sendDecisionEmail
};

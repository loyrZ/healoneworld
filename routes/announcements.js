"use strict";

const express = require("express");
const db = require("../conf/database");

const router = express.Router();

// Public announcements
router.get("/", async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT id_pk, title, message, published_at
            FROM announcements
            WHERE status = 'published'
              AND visibility = 'public'
            ORDER BY published_at DESC
        `);

        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// Admin list: includes drafts and published announcements
router.get("/admin", async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM announcements
            ORDER BY updated_at DESC
        `);

        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// Create an announcement
router.post("/", async (req, res, next) => {
    try {
        const { title, message, action } = req.body;

        const cleanTitle = title?.trim() || "";
        const cleanMessage = message?.trim() || "";

        if (action === "publish" && (!cleanTitle || !cleanMessage)) {
            return res.status(400).json({
                error: "A title and message are required before publishing."
            });
        }

        const status = action === "publish" ? "published" : "draft";
        const publishedAt = status === "published"
            ? new Date()
            : null;

        const [result] = await db.query(
            `INSERT INTO announcements
                (title, message, status, visibility, published_at)
             VALUES (?, ?, ?, ?, ?)`,
            [cleanTitle, cleanMessage, status, "public", publishedAt]
        );

        res.status(201).json({
            id_pk: result.insertId,
            status
        });
    } catch (err) {
        next(err);
    }
});

// Edit or publish an existing announcement
router.put("/:id", async (req, res, next) => {
    try {
        const { title, message, action } = req.body;
        const cleanTitle = title?.trim() || "";
        const cleanMessage = message?.trim() || "";

        if (action === "publish" && (!cleanTitle || !cleanMessage)) {
            return res.status(400).json({
                error: "A title and message are required before publishing."
            });
        }

        const status = action === "publish" ? "published" : "draft";

        const [result] = await db.query(
            `UPDATE announcements
             SET title = ?,
                 message = ?,
                 status = ?,
                 published_at = CASE
                     WHEN ? = 'published' AND published_at IS NULL
                     THEN CURRENT_TIMESTAMP
                     WHEN ? = 'draft'
                     THEN NULL
                     ELSE published_at
                 END
             WHERE id_pk = ?`,
            [
                cleanTitle,
                cleanMessage,
                status,
                status,
                status,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Announcement not found."
            });
        }

        res.json({ status });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
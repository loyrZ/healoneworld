"use strict";

const express = require("express");
const db = require("../conf/database");
const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT * FROM classes ORDER BY id_pk");
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const [result] = await db.query(
            "INSERT INTO classes (class_name) VALUES (?)",
            [req.body.class_name]
        );
        res.status(201).json({ id_pk: result.insertId });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const logger = require("morgan");

const app = express();

// --- Middleware ---
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- Static assets ---
app.use(express.static(path.join(__dirname, "public")));

// --- Routes ---
app.use("/", require("./routes/index"));
// Add new route files here, e.g. app.use("/classes", require("./routes/classes"));

// --- 404 ---
app.use((req, res, next) => {
    const err = new Error(`The route ${req.method} ${req.url} does not exist.`);
    err.status = 404;
    next(err);
});

// --- Error handler ---
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    if (req.accepts("json") && !req.accepts("html")) {
        return res.status(status).json({ error: err.message || "Server error" });
    }
    res.status(status).type("text").send(`Error ${status}: ${err.message || "Server error"}`);
});

module.exports = app;

"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const logger = require("morgan");
const { clerkMiddleware } = require("@clerk/express");

const app = express();

// --- Middleware ---
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Same key the React side uses; npx clerk env pull names it VITE_CLERK_PUBLISHABLE_KEY.
app.use(
    clerkMiddleware({
        publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
    })
);

// --- Routes ---
app.use("/", require("./routes/index"));
app.use("/signup", require("./routes/signup"));
app.use("/api/account", require("./routes/account"));
// Add new route files here, e.g. app.use("/classes", require("./routes/classes"));

// --- React website (public/) ---
// Page URLs like /login are set in public/main.jsx, not here.
// Any browser page request that no route above handled gets the React app.


/**
 * AI-generated (Claude), reviewed by <your name>.
 * Serves the React website in public/ through Vite:
 *  - dev: Vite compiles .jsx on the fly (npm run dev)
 *  - production: serves the built files in dist/ (npm run build first, NODE_ENV=production)
 * Page URLs like /login are set in public/main.jsx, not here.
 */

function isPageRequest(req) {
    return req.method === "GET" && (req.headers.accept || "").includes("text/html");
}

if (process.env.NODE_ENV === "production") {
    // Serves the files made by npm run build.
    const dist = path.join(__dirname, "dist");
    app.use(express.static(dist, { index: false }));
    app.use((req, res, next) => {
        if (!isPageRequest(req)) return next();
        res.sendFile(path.join(dist, "index.html"));
    });
} else {
    // Dev: Vite turns the .jsx into browser code on the fly.
    const fs = require("fs/promises");
    const vitePromise = import("vite").then(({ createServer }) =>
        createServer({
            configFile: path.join(__dirname, "vite.config.mjs"),
            server: { middlewareMode: true },
            appType: "custom",
        })
    );
    app.use(async (req, res, next) => {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
    });
    app.use(async (req, res, next) => {
        if (!isPageRequest(req)) return next();
        const vite = await vitePromise;
        const html = await fs.readFile(path.join(__dirname, "public", "index.html"), "utf8");
        res.type("html").send(await vite.transformIndexHtml(req.originalUrl, html));
    });
}

/**
 * End of flag.
 */

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

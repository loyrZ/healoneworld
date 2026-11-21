"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const path = require("node:path");

const root = path.join(__dirname, "..");

function stub(relative, exports) {
    const filename = require.resolve(path.join(root, relative));
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

const inserted = [];
let databaseFailure = false;

stub("conf/database", {
    async execute(sql, values) {
        if (databaseFailure) throw new Error("Database unavailable");

        assert.match(sql, /INSERT INTO contact_submissions/);
        assert.match(sql, /'new'/);
        inserted.push({ sql, values });
        return [{ insertId: inserted.length, affectedRows: 1 }];
    }
});

const contactSubmissions = require("../services/contact-submissions");

let baseUrl;
let server;

test.before(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/contact-submissions", require("../routes/contact-submissions"));
    app.use((error, req, res, next) => {
        res.status(500).json({ error: "We could not save your message. Please try again." });
    });

    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test.beforeEach(() => {
    inserted.length = 0;
    databaseFailure = false;
});

function validSubmission(overrides = {}) {
    return {
        name: "Jamie Rivera",
        email: "jamie@example.com",
        subject: "Class question",
        message: "Could you tell me which beginner classes are available?",
        ...overrides
    };
}

async function request(method, url, body) {
    const response = await fetch(`${baseUrl}${url}`, {
        method,
        headers: body === undefined ? { Accept: "application/json" } : {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    return { status: response.status, body: responseBody };
}

test("contact validation trims valid values and enforces required fields, format, and limits", () => {
    const valid = contactSubmissions.validateContactSubmission(validSubmission({
        name: " Jamie Rivera ",
        email: " jamie@example.com "
    }));

    assert.deepEqual(valid.errors, {});
    assert.equal(valid.values.name, "Jamie Rivera");
    assert.equal(valid.values.email, "jamie@example.com");

    const invalid = contactSubmissions.validateContactSubmission(validSubmission({
        name: " ",
        email: "not-an-email",
        subject: "x".repeat(201),
        message: " "
    }));

    assert.ok(invalid.errors.name);
    assert.ok(invalid.errors.email);
    assert.ok(invalid.errors.subject);
    assert.ok(invalid.errors.message);
});

test("a valid contact submission is saved with the server-controlled new status", async () => {
    const result = await request("POST", "/api/contact-submissions", validSubmission());

    assert.equal(result.status, 201);
    assert.deepEqual(result.body, { ok: true });
    assert.equal(inserted.length, 1);
    assert.deepEqual(inserted[0].values, [
        "Jamie Rivera",
        "jamie@example.com",
        "Class question",
        "Could you tell me which beginner classes are available?"
    ]);
});

test("invalid or unexpected contact fields are rejected before saving", async () => {
    const invalid = await request("POST", "/api/contact-submissions", validSubmission({ email: "bad" }));
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.errors.email);
    assert.equal(inserted.length, 0);

    const unexpected = await request("POST", "/api/contact-submissions", {
        ...validSubmission(),
        status: "closed"
    });
    assert.equal(unexpected.status, 400);
    assert.deepEqual(unexpected.body.rejected, ["status"]);
    assert.equal(inserted.length, 0);
});

test("database failures do not report a successful contact submission", async () => {
    databaseFailure = true;

    const result = await request("POST", "/api/contact-submissions", validSubmission());

    assert.equal(result.status, 500);
    assert.match(result.body.error, /could not save/i);
});

test("contact submissions have no public listing or detail endpoint", async () => {
    const result = await request("GET", "/api/contact-submissions");

    assert.equal(result.status, 404);
});
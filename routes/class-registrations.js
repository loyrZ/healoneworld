"use strict";

const express = require("express");
const { requireApplicationUser, requireRole } = require("../middleware/auth");
const registrations = require("../services/class-registrations");

const router = express.Router();

function parseId(value) {
  return /^[1-9]\d{0,9}$/.test(String(value)) ? Number(value) : null;
}

function sendRegistrationError(error, res, next) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message, code: error.code });
  }

  // The registration feature requires migration 003. Do not expose a MySQL
  // table name to visitors while the shared database rollout is incomplete.
  if (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146) {
    return res.status(503).json({
      error: "Class registration is temporarily unavailable. Please try again later.",
      code: "registration_storage_unavailable"
    });
  }

  return next(error);
}

function readRegistrationBody(req, res) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    res.status(400).json({ error: "Invalid request." });
    return null;
  }
  const rejected = Object.keys(req.body).filter((key) => !["phone", "accessibilityNotes"].includes(key));
  if (rejected.length) {
    res.status(400).json({ error: "Some of these fields cannot be set.", rejected });
    return null;
  }
  const input = registrations.validateRegistrationInput(req.body);
  if (Object.keys(input.errors).length) {
    res.status(400).json({ error: "Please fix the highlighted fields.", errors: input.errors });
    return null;
  }
  return input.values;
}

router.get("/mine", requireApplicationUser, async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await registrations.listUserRegistrations(req.applicationUser.id));
  } catch (error) {
    sendRegistrationError(error, res, next);
  }
});

router.post("/class/:classId", requireApplicationUser, async (req, res, next) => {
  try {
    const classId = parseId(req.params.classId);
    if (!classId) return res.status(404).json({ error: "Class not found." });
    const values = readRegistrationBody(req, res);
    if (!values) return;
    const id = await registrations.createRegistration({ classId, userId: req.applicationUser.id, ...values });
    const mine = await registrations.listUserRegistrations(req.applicationUser.id);
    res.status(201).json(mine.find((registration) => registration.id === id));
  } catch (error) {
    sendRegistrationError(error, res, next);
  }
});

router.get("/class/:classId/meeting", requireApplicationUser, async (req, res, next) => {
  try {
    const classId = parseId(req.params.classId);
    if (!classId) return res.status(404).json({ error: "This class is not available." });
    const meeting = await registrations.getMeetingAccess({
      classId,
      userId: req.applicationUser.id
    });
    res.set("Cache-Control", "no-store");
    res.json(meeting);
  } catch (error) {
    sendRegistrationError(error, res, next);
  }
});

router.post("/:id/cancel", requireApplicationUser, async (req, res, next) => {
  try {
    const registrationId = parseId(req.params.id);
    if (!registrationId) return res.status(404).json({ error: "Registration not found." });
    const result = await registrations.cancelRegistration({ registrationId, userId: req.applicationUser.id });
    res.set("Cache-Control", "no-store");
    res.json(result);
  } catch (error) {
    sendRegistrationError(error, res, next);
  }
});

router.post("/:id/restore", requireApplicationUser, async (req, res, next) => {
  try {
    const registrationId = parseId(req.params.id);
    if (!registrationId) return res.status(404).json({ error: "Registration not found." });
    const mine = await registrations.listUserRegistrations(req.applicationUser.id);
    const registration = mine.find((item) => item.id === registrationId);
    if (!registration) return res.status(404).json({ error: "Registration not found." });
    if (registration.status === registrations.REGISTRATION_STATUS) return res.json(registration);
    const id = await registrations.createRegistration({
      classId: registration.classId,
      userId: req.applicationUser.id,
      phone: registration.phone,
      accessibilityNotes: registration.accessibilityNotes
    });
    const updated = (await registrations.listUserRegistrations(req.applicationUser.id)).find((item) => item.id === id);
    res.json(updated);
  } catch (error) {
    sendRegistrationError(error, res, next);
  }
});

router.get("/admin/class/:classId", requireRole("administrator"), async (req, res, next) => {
  try {
    const classId = parseId(req.params.classId);
    if (!classId) return res.status(404).json({ error: "Class not found." });
    res.set("Cache-Control", "no-store");
    res.json(await registrations.listClassRoster(classId));
  } catch (error) {
    sendRegistrationError(error, res, next);
  }
});

module.exports = router;
"use strict";

const express = require("express");
const {
  requireApplicationUser
} = require("../middleware/auth");

const router = express.Router();

router.get("/", requireApplicationUser, (req, res) => {
  res.json({
    user: req.applicationUser,
    permissions: req.applicationPermissions
  });
});

module.exports = router;
"use strict";

const express = require("express");
const requireAccount = require("../middleware/account");

const router = express.Router();

router.get("/", requireAccount, (req, res) => {
    res.json({
        userId: req.userId,
        message: "Protected account data",
    });
});

module.exports = router;
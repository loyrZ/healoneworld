"use strict";

const { requireAccount } = require("../middleware/account");

// verifies if a user is authenticated
// rejects unauthenticated users
function requireAccount(req, res, next) {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    req.userId = userId;
    next();
}

module.exports = requireAccount;

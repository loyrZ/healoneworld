const { getAuth, clerkClient } = require("@clerk/express");

function requireAccount(req, res, next) { 
    const { userId } = getAuth(req);
    if(!userId) {
        return res.status(401).json({ error: "Please sign in." });
    }
    req.userId = userId;
    next();
}

//check if person is an approved volunteer
async function requireApprovedVolunteer(req, res, next) {
    try {
        const user = await clerkClient.users.getUser(req.userId);
        if (user.publicMetadata?.approved !== true) {
            return res.status(403).json({ error: "Approved volunteer access required." });
        }
        req.clerkUser = user;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { requireAccount, requireApprovedVolunteer };
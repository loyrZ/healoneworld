const { getAuth, clerkClient } = require("@clerk/express");

// Check to see if a user is signed in. If not, display "sign in" message
function requireAccount(req, res, next) { 
    const { userId } = getAuth(req);
    if(!userId) {
        return res.status(401).json({ error: "Please sign in." });
    }
    req.userId = userId;
    next();
}

//Check if user is an approved volunteer. If not, display "approval required" message
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

// goes to routes/volunteer.js
module.exports = { requireAccount, requireApprovedVolunteer };
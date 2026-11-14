const { getAuth } = require("@clerk/express");
const db = require("../conf/database");

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
        const [rows] = await db.query(
            `SELECT u.id_pk, u.name, u.email, u.clerk_user_id, p.volunteer
             FROM users u
             JOIN permission p ON p.id_fk = u.id_pk
             WHERE u.clerk_user_id = ?`,
            [req.userId]
        );

        if (rows.length !== 1 || rows[0].volunteer !== 1) {
            return res.status(403).json({ error: "Approved volunteer access required." });
        }

        req.applicationUser = {
            id: rows[0].id_pk,
            name: rows[0].name,
            email: rows[0].email,
            clerkUserId: rows[0].clerk_user_id
        };
        next();
    } catch (err) {
        next(err);
    }
}

// goes to routes/volunteer.js
module.exports = { requireAccount, requireApprovedVolunteer };

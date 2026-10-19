const db = require('../conf/database');

const { exec } = require('child_process');
const pathToFFMPEG = require('ffmpeg-static');
const path = require('path'); // Import path module

module.exports = {
        isLoggedIn: function (req, res, next) {
        if (req.session.userID) { // was req.session.user
            next();
        } else {
            req.flash("ERROR", "Must be logged in to do certain log-in functions");
            return req.session.save((err) => {
                if (err) return next(err); 
                res.redirect("/");
            });
        }
    },

    isAdmin: async function (req, res, next) {
        try {
            const userId = req.session.userID; // was req.session.user?.id
            if (!userId) return res.status(401).json({ error: "Not logged in" });

            const [rows] = await db.query(
                "SELECT admin FROM permission WHERE id_fk = ?",
                [userId]
            );
            if (rows.length && rows[0].admin) {
                return next();
            }
            return res.status(403).json({ error: "Requires higher elevation, please contact website admins" });
        } catch (err) {
            next(err);
        }
    }, 
}
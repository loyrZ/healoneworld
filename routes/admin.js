// routes/admin.js
"use strict";


const express = require("express");
const path = require("path");
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const { getAllUsers } = require("../middleware/account");
const router = express.Router();

router.use(isLoggedIn, isAdmin);         

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "admin.html"));
});
/**
 router.post("/viewUsersAndStaff", isLoggedIn, isAdmin, getAllUsers, getAllStaff, getAllVolunteer,
    async function(req, res, next){
        req.session.userID = req.body.userID;

})
 */

/**
 * FLAG: idk why but isLoggedIn and isAdmin is not doing its job, debug later. 
 * authentication is just letting anyone pass, future problem.
 * AI says:
        app.js: add app.use("/admin", require("./routes/admin"));.
        routes/admin.js:
        Add module.exports = router; at the end.
        Change "/admin/users" to "/users", because the /admin prefix comes from step 1.
        Remove router.use(isLoggedIn, isAdmin) on line 11, or it will block the /admin/viewusers page itself.
        Remove the extra async function after getAllUsers on line 35, since getAllUsers already sends the response.
        middleware/auth.js:
        Remove the ffmpeg-static, child_process and path requires.
        Replace req.session and req.flash. The app has no session system; logins go through Clerk, so it should use getAuth(req) from @clerk/express.
        Make isLoggedIn return a 401 error instead of redirecting.
        middleware/account.js: remove the same ffmpeg and child_process requires.

        ====
    For now just leave it as it is because users login is not fully setup yet.
    For now just leave it as is so we can still access the page without signing in, it will get confusing. 

    Access: http://localhost:3000/admin/viewusers
 */
router.get("/viewUsers", (req, res) => {
  res.redirect("/admin/viewusers");
});


//    Access: http://localhost:3000/admin/viewusers

router.get("/admin/users", isLoggedIn, isAdmin, getAllUsers, 
    async function(req, res, next){
        console.log("This shouldnt be able to pass now.")
});

// Dashboard page: public/admin/dashboard/Dashboard.jsx (React, uses mock data for now).
// next() hands the request on to the React app, which shows the dashboard.
// Once this file is mounted at "/admin" in app.js, this is /admin/dashboard.
router.get("/dashboard", isLoggedIn, isAdmin, (req, res, next) => next());
/* i dont even need thse 2 cause getAllUsers pulls every single user in the db so staff/volunteer 
is already apart of that
router.get("/admin/staff", isLoggedIn, isAdmin, getAllStaff);
router.get("/admin/volunteers", isLoggedIn, isAdmin, getAllVolunteer);
*/


//www.healoneworld.com/admindashboard
// routes/admin.js
"use strict";


const express = require("express");
const path = require("path");
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const { getAllUsers, getAllStaff, getAllVolunteer } = require("../middleware/account");
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


router.get("/viewUsers", (req, res) => {
  res.redirect("/admin/viewusers");
});



router.get("/admin/users", isLoggedIn, isAdmin, getAllUsers);
/* i dont even need thse 2 cause getAllUsers pulls every single user in the db so staff/volunteer 
is already apart of that
router.get("/admin/staff", isLoggedIn, isAdmin, getAllStaff);
router.get("/admin/volunteers", isLoggedIn, isAdmin, getAllVolunteer);
*/


//www.healoneworld.com/admindashboard
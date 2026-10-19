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

router.post("/viewUsersAndStaff", isLoggedIn, isAdmin, getAllUsers, getAllStaff, getAllVolunteer,
    async function(req, res, next){
        req.session.userID = req.body.userID;

})



//www.healoneworld.com/admindashboard
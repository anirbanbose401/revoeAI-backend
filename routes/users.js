const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Ensure this is the correct path to your User model

// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.json(users); // Respond with the list of users
    } catch (err) {
        res.status(500).json({ message: "Server Error" }); // Handle server errors
    }
});

module.exports = router;
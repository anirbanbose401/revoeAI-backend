const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // ✅ Middleware to check authentication

// ✅ Dashboard route, protected by authMiddleware
router.get("/", authMiddleware, (req, res) => {
    res.json({ message: "Welcome to the Dashboard", user: req.user }); // ✅ Respond with a welcome message and user info
});

module.exports = router;
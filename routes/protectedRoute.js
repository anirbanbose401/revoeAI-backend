const express = require("express");
const authMiddleware = require("../middleware/authMiddleware"); // ✅ Middleware to check authentication

const router = express.Router();

// ✅ Protected route, accessible only to authenticated users
router.get("/", authMiddleware, (req, res) => {
    res.json({ message: `Welcome, user ID: ${req.user.id}` }); // ✅ Respond with a welcome message and user ID
});

module.exports = router;
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ Middleware to check authentication from HTTP-only cookie
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; // ✅ Read token from HTTP-only cookie
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    req.user = decoded; // Attach decoded user ID to request
    next();
  });
};

// ✅ REGISTER ROUTE
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance and save to the database
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found!");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password incorrect!");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("User authenticated successfully! Sending response.");

    // ✅ Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ Secure in production
      sameSite: "Strict",
      maxAge: 3600000 // ✅ 1 hour
    });

    res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });

  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET LOGGED-IN USER DATA (NEW)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // Fetch user data excluding the password
    const user = await User.findById(req.user.id).select("-password"); // ✅ Exclude password
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ LOGOUT ROUTE
router.post("/logout", (req, res) => {
  res.clearCookie("token"); // ✅ Remove JWT cookie
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
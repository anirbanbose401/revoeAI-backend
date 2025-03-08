const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.cookies.token; // ✅ Get JWT from cookies

    if (!token) {
        return res.status(401).json({ message: "Unauthorized, no token" }); // ✅ Respond with 401 if no token is found
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ Verify the token
        req.user = decoded; // Attach user info to request
        next(); // ✅ Proceed to the next middleware or route handler
    } catch (err) {
        console.error("JWT Verification Error:", err.message); // ✅ Log the error for debugging
        res.status(403).json({ message: "Invalid token" }); // ✅ Respond with 403 if token is invalid
    }
};
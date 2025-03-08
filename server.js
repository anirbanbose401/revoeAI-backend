// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app); // Creating an HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Allow frontend origin
        credentials: true, // Allow cookies and authentication headers
    },
});

// Google Sheets API Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID; // Google Sheet ID from environment variables
const API_KEY = process.env.GOOGLE_API_KEY; // API key for Google Sheets API
const RANGE = "Sheet1!A1:Z100"; // Sheet range to fetch data from

// Middleware setup
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies
app.use(helmet()); // Security middleware to protect HTTP headers

// CORS (Cross-Origin Resource Sharing) setup to allow frontend requests
app.use(
    cors({
        origin: "http://localhost:5173", // Allow frontend to access API
        credentials: true, // Allow credentials (cookies, authorization headers)
        methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
        allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    })
);

// Rate Limiter to prevent abuse (limits each IP to 100 requests per 15 minutes)
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Max requests per IP
    })
);

// MongoDB Connection with automatic retry in case of failure
const connectWithRetry = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
    }
};
connectWithRetry(); // Initial MongoDB connection attempt

let cachedData = []; // Cache to store the last fetched Google Sheets data

// Function to Fetch Google Sheet Data
const fetchGoogleSheetData = async () => {
    try {
        // Fetch data from Google Sheets API
        const response = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
        );
        const rows = response.data.values;
        if (!rows) return [];

        // Extract headers from the first row
        const headers = rows[0];

        // Convert remaining rows into JSON objects using headers as keys
        const data = rows.slice(1).map((row) =>
            headers.reduce((acc, header, index) => {
                acc[header] = row[index] || ""; // Assign values, default to empty string if missing
                return acc;
            }, {})
        );

        return data;
    } catch (error) {
        console.error("❌ Error fetching Google Sheets data:", error.message);
        return cachedData; // Return cached data in case of an error
    }
};

// WebSocket Connection Setup
io.on("connection", async (socket) => {
    console.log("⚡ Client connected:", socket.id);

    // Send initial data when the client connects
    const initialData = await fetchGoogleSheetData();
    socket.emit("sheetData", initialData);
    cachedData = initialData; // Update cache with the latest data

    // Periodically fetch and update data only if it has changed
    const interval = setInterval(async () => {
        try {
            const newData = await fetchGoogleSheetData();

            if (JSON.stringify(newData) !== JSON.stringify(cachedData)) {
                console.log("🔄 Data changed, sending update...");
                socket.emit("sheetData", newData);
                cachedData = newData; // Update cache
            } else {
                socket.emit("sheetData", cachedData);
                // console.log("✅ No changes detected.");
            }
        } catch (error) {
            console.error("❌ Error checking Google Sheets updates:", error.message);
        }
    }, 5000); // Check every 5 seconds

    // Handle client disconnection
    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
        clearInterval(interval); // Stop checking for updates
    });
});

// API Routes
app.use("/api/auth", require("./routes/auth")); // Authentication routes
app.use("/api/dashboard", require("./routes/dashboard")); // Dashboard-related routes
app.use("/api/users", require("./routes/users")); // User management routes
app.use("/api/protected", require("./routes/protectedRoute")); // Protected API routes (requires authentication)
app.use("/api", require("./routes/dynamicDataRoutes")); // Other dynamic data routes

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Graceful shutdown handler (closes WebSocket & MongoDB connection on exit)
process.on("SIGINT", async () => {
    console.log("⚠️ Shutting down...");
    io.close(() => console.log("🛑 WebSocket Server Closed"));
    await mongoose.connection.close(); // Close MongoDB connection
    process.exit(0); // Exit the process
});
const express = require("express");
const axios = require("axios");

require("dotenv").config();
const router = express.Router();

// Google Sheets API details
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const API_KEY = process.env.GOOGLE_API_KEY;
const RANGE = "Sheet1!A1:Z100"; // Adjust range as needed

// Fetch Google Sheet Data
router.get("/", async (req, res) => {
    try {
        const response = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
        );

        const rows = response.data.values;
        if (!rows || rows.length === 0) return res.json([]); // Return empty array if no data

        // Convert array into JSON object
        const headers = rows[0]; // First row as headers
        const data = rows.slice(1).map((row) =>
            headers.reduce((acc, header, index) => {
                acc[header] = row[index] || ""; // Map each row to an object
                return acc;
            }, {})
        );

        res.json(data); // Respond with the formatted data
    } catch (error) {
        console.error("❌ Error fetching Google Sheet data:", error.message);
        res.status(500).json({ error: "Failed to fetch data" }); // Handle errors
    }
});

module.exports = router;
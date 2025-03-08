const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Define a schema for dynamic data
const DynamicDataSchema = new mongoose.Schema({
    rowIndex: Number, // Row index of the data
    colName: String,  // Column name of the data
    value: String     // Value of the data
});

const DynamicData = mongoose.model("DynamicData", DynamicDataSchema);

// Save dynamic column data
router.post("/saveDynamicData", async (req, res) => {
    try {
        const { rowIndex, colName, value } = req.body;
        const existingData = await DynamicData.findOne({ rowIndex, colName });

        if (existingData) {
            // Update existing data
            existingData.value = value;
            await existingData.save();
        } else {
            // Create new data entry
            const newData = new DynamicData({ rowIndex, colName, value });
            await newData.save();
        }

        res.json({ message: "Data saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch stored data
router.get("/getDynamicData", async (req, res) => {
    try {
        const data = await DynamicData.find(); // Retrieve all dynamic data
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
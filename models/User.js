const mongoose = require("mongoose");

// Defining the schema for the User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's name, required field
  email: { type: String, required: true, unique: true }, // User's email, required and must be unique
  password: { type: String, required: true }, // User's password, required field
}, { timestamps: true }); // Automatically add createdAt and updatedAt timestamps

// Export the User model based on the schema
module.exports = mongoose.model("User", userSchema);
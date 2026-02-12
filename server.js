const express = require("express");
const tickets = require("./api/tickets.js");
require("dotenv").config();

const app = express();

// Serve static files (index.html, etc.)
app.use(express.static(__dirname));

// API route
app.get("/api/tickets", tickets);

// Export the app for Vercel
module.exports = app;

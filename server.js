const express = require("express");
const tickets = require("./api/tickets.js");
const path = require("path");

const app = express();

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// API route
app.get("/api/tickets", tickets);

// Catch-all route to serve index.html for SPA
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

module.exports = app;

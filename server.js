const express = require("express");
const tickets = require("./api/tickets.js");
require("dotenv").config();

const app = express();
const port = 3000;

app.get("/api/tickets", tickets);
app.use(express.static(__dirname));

app.listen(port, () => console.log(`MCM Board running at http://localhost:${port}`));

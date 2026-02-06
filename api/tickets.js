const axios = require("axios");

// On Vercel, process.env variables are automatically available
// No need to require('dotenv') in production
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); // Only load .env locally
}

// Read Jira credentials from environment variables
const baseUrl = process.env.JIRA_BASE_URL.replace(/\/$/, "");
const email = process.env.JIRA_EMAIL;
const apiToken = process.env.JIRA_API_TOKEN;
const projectKey = process.env.JIRA_PROJECT_KEY || "MCM";

module.exports = async (req, res) => {
  try {
    const assignee = req.query.assignee || "";
    const timeFilter = req.query.timeFilter || "all";

    // Base JQL parts
    let dateClause = "";
    if (timeFilter === "past") {
      dateClause = "AND duedate < startOfDay()";
    } else if (timeFilter === "upcoming") {
      dateClause = "AND duedate >= startOfDay()";
    } else {
      dateClause = "AND duedate >= \"-90d\""; // last 90 days + future
    }

    let jql = `
      project = "${projectKey}"
      AND status NOT IN ("Invalid/ Dispose", "Launched")
      ${dateClause}
    `;
    if (assignee && assignee !== "All") {
      jql = `assignee = "${assignee}" AND ` + jql;
    }
    jql += " ORDER BY duedate ASC";

    const url = `${baseUrl}/rest/api/3/search/jql`;
    const body = {
      jql,
      fields: ["summary", "assignee", "duedate", "status"],
      maxResults: 100
    };

    const response = await axios.post(url, body, {
      auth: { username: email, password: apiToken },
      headers: { "Accept": "application/json" }
    });

    // Collect all assignees
    const assigneesSet = new Set();
    response.data.issues.forEach(issue => {
      if (issue.fields.assignee?.displayName) {
        assigneesSet.add(issue.fields.assignee.displayName);
      }
    });
    const assignees = Array.from(assigneesSet);

    // Map issues to simplified objects
    const issues = response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      assignee: issue.fields.assignee?.displayName || "Unassigned",
      duedate: issue.fields.duedate || "No due date",
      status: issue.fields.status.name,
      url: `${baseUrl}/browse/${issue.key}`
    }));

    res.json({ issues, assignees });
  } catch (error) {
    console.error("Jira fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch Jira tickets" });
  }
};
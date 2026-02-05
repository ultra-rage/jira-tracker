import axios from "axios";

export default async function handler(req, res) {
  try {
    // Read values from Vercel environment variables
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;

    // Optional query params from the browser
    const assignee = req.query.assignee || "";
    const days = req.query.days || 7;

    // Build JQL
    let jql = `
      duedate <= ${days}d
      AND status NOT IN (Done, Closed)
    `;

    if (assignee && assignee !== "All") {
      jql += ` AND assignee = "${assignee}"`;
    }

    // Call Jira API
    const response = await axios.get(
      `${baseUrl}/rest/api/3/search`,
      {
        params: {
          jql,
          fields: "summary,assignee,duedate,status",
          maxResults: 50
        },
        auth: {
          username: email,
          password: token
        }
      }
    );

    // Send only what the UI needs
    const issues = response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      assignee: issue.fields.assignee?.displayName || "Unassigned",
      duedate: issue.fields.duedate,
      status: issue.fields.status.name,
      url: `${baseUrl}/browse/${issue.key}`
    }));

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Jira tickets" });
  }
}
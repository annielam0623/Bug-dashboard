require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

const CLICKUP_TOKEN = process.env.CLICKUP_TOKEN;
const LIST_ID = process.env.CLICKUP_LIST_ID;

app.get("/api/tasks", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${LIST_ID}/task?include_closed=true&subtasks=true`,
      { headers: { Authorization: CLICKUP_TOKEN } },
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/task/:taskId/comment", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.clickup.com/api/v2/task/${req.params.taskId}/comment`,
      { headers: { Authorization: CLICKUP_TOKEN } },
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/task/:taskId/comment", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.clickup.com/api/v2/task/${req.params.taskId}/comment`,
      {
        method: "POST",
        headers: {
          Authorization: CLICKUP_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment_text: req.body.comment_text }),
      },
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () =>
  console.log("✅ Proxy running on http://localhost:3001"),
);

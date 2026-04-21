require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const CLICKUP_TOKEN = "pk_95663353_5ACO21J32JACKIEELO9IZX4N7Z6M23GG";
const LIST_ID = "901814891310";

app.get("/api/tasks", async (req, res) => {
  try {
    console.log("Sending request with token:", CLICKUP_TOKEN);
console.log("List ID:", LIST_ID);
    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${LIST_ID}/task?include_closed=true&subtasks=true`,
      { headers: { "Authorization": "pk_95663353_5ACO21J32JACKIEELO9IZX4N7Z6M23GG" } },
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${LIST_ID}/task`,
      {
        method: "POST",
        headers: {
          Authorization: CLICKUP_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
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

app.post("/api/task/:taskId/attachment", upload.single("file"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("attachment", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    const response = await fetch(
      `https://api.clickup.com/api/v2/task/${req.params.taskId}/attachment`,
      {
        method: "POST",
        headers: { Authorization: CLICKUP_TOKEN, ...form.getHeaders() },
        body: form,
      }
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

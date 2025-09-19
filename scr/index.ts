import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { pool } from "./db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check database connection on startup
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection alive ✅");
  } catch (err) {
    console.error("Database not awake ❌", err);
  }
})();

// Ping periodically to keep Neon alive
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database pinged to stay awake");
  } catch (err) {
    console.error("Database ping failed", err);
  }
}, 5 * 60 * 1000);

// Serve static assets
app.use(express.static(path.join(__dirname, "../public")));

// Utility routes
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow:\n");
});

// Form submission route (CSV for now — later DB)
app.post("/submit_form", (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  const file = path.join(__dirname, "../database.csv");

  try {
    fs.appendFileSync(file, `${name},${email},${subject},${message}\n`);
    res.redirect("/thankyou.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Unable to save to database");
  }
});

// --- ROUTES ORDER MATTERS ---

// 1. Root route
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/index.html", (req, res) => {
  res.redirect("/");  // always force root
});

// 2. Events routes (before generic `/:page`)
app.get("/events/:eventName", (req: Request, res: Response, next) => {
  const eventName = req.params.eventName;
  const filePath = path.join(__dirname, "../public/events", `${eventName}.html`);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next(); // Pass to 404 or other middleware
  }
});

// 3. Generic single-page routes
app.get("/:page", (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "../public", `${page}.html`);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next();
  }
});

// 4. Fallback 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../public/404.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

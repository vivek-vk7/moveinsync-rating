// Dashboard server.  Run: npm run dashboard  -> http://localhost:3000
import "dotenv/config";
import express from "express";
import { load, filterReviews, everything, topQuotes, summaryMarkdown } from "./src/analyze.js";
import { PATHS, readJSON } from "./src/store.js";

const app = express();
app.use(express.static("public"));

const filtered = (q) => filterReviews(load(), { app: q.app || undefined, from: q.from, to: q.to });

app.get("/api/summary", (req, res) => {
  const df = filtered(req.query);
  if (!df.length) return res.json({ empty: true });
  res.json({ ...everything(df), snapshots: readJSON(PATHS.snapshots, []) });
});
app.get("/api/quotes", (req, res) => res.json(topQuotes(filtered(req.query), req.query.theme, 8)));
app.get("/api/report.md", (req, res) => res.type("text/markdown").send(summaryMarkdown(filtered(req.query))));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Dashboard: http://localhost:${port}`));

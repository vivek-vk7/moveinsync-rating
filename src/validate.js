// Measure tagging accuracy by hand-checking a random sample.
// 1) npm run validate:sample  -> data/validation_sample.csv
// 2) open it in Excel/Sheets, fill the human_theme column (theme names from config.js)
// 3) npm run validate:score   -> prints accuracy + confusions
import fs from "node:fs";
import { TAXONOMY } from "../config.js";
import { PATHS, readJSON, toCSV, parseCSV } from "./store.js";

function sample(n = 100) {
  const tags = new Map(readJSON(PATHS.tagged, []).map((t) => [t.reviewId, t]));
  const rows = readJSON(PATHS.reviews, []).filter((r) => tags.has(r.reviewId));
  // deterministic shuffle so the sample is reproducible
  let seed = 42; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const picked = rows.map((r) => [rnd(), r]).sort((a, b) => a[0] - b[0]).slice(0, n).map(([, r]) => ({
    reviewId: r.reviewId, score: r.score, content: r.content,
    primary_theme: tags.get(r.reviewId).primary_theme, human_theme: "",
  }));
  fs.writeFileSync(PATHS.validation, toCSV(picked, ["reviewId", "score", "content", "primary_theme", "human_theme"]));
  console.log(`Wrote ${PATHS.validation}. Fill human_theme, then run: npm run validate:score`);
}

function score() {
  const rows = parseCSV(fs.readFileSync(PATHS.validation, "utf8")).filter((r) => r.human_theme);
  const bad = [...new Set(rows.map((r) => r.human_theme))].filter((t) => !TAXONOMY[t]);
  if (bad.length) return console.log("Unknown theme names:", bad.join(", "));
  const ok = rows.filter((r) => r.human_theme === r.primary_theme).length;
  console.log(`Checked ${rows.length} reviews. Tagging accuracy: ${Math.round((100 * ok) / rows.length)}%`);
  const miss = {};
  rows.filter((r) => r.human_theme !== r.primary_theme)
    .forEach((r) => { const k = `${r.human_theme} -> tagged as ${r.primary_theme}`; miss[k] = (miss[k] || 0) + 1; });
  console.table(miss);
}

const cmd = process.argv[2];
if (cmd === "sample") sample(); else if (cmd === "score") score(); else console.log("Usage: validate.js sample|score");

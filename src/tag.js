
/*
// Tag each review with a theme from the fixed taxonomy.
// Uses Google Gemini if GEMINI_API_KEY is set, otherwise a keyword fallback.
// Only untagged reviews are processed, so re-runs are cheap.  Run: npm run tag
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { TAXONOMY } from "../config.js";
import { PATHS, readJSON, writeJSON } from "./store.js";

const MODEL = process.env.TAG_MODEL || "gemini-3.8-flash";
const BATCH = 20;
const THEMES = Object.keys(TAXONOMY);

const SYSTEM = `You classify Google Play reviews of MoveInSync, an employee commute app (cab/shuttle booking,
live tracking, OTP boarding, support). Reviews may be English, Hindi, or Hinglish.
Assign each review a primary theme and an optional secondary theme from this fixed list:
${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t, TAXONOMY[t].desc])), null, 1)}
Rules:
- Pick the theme describing the MAIN complaint. Use positive_or_other only for praise/vague/unrelated.
- A late cab is late_or_no_cab (operational), even if the user blames the app.
- secondary_theme may be null.
Return ONLY a JSON array, no prose, no markdown fences:
[{"id": "<id>", "primary_theme": "...", "secondary_theme": "..." or null}]`;

// keyword fallback (English + common Hinglish)
const KEYWORDS = {
  login_onboarding:    ["login", "log in", "sign in", "otp not", "password", "register", "account", "employee id"],
  booking_failure:     ["book", "cancel", "roster", "schedule", "shift", "unable to request", "not able to"],
  eta_pickup_time:     ["pickup time", "pick up time", "eta", "timing", "time change"],
  late_or_no_cab:      ["late", "delay", "no cab", "not came", "didn't come", "no show", "waiting", "wait", "der ", "nahi aaya"],
  live_tracking:       ["track", "location", "map", "gps", "vehicle change"],
  safety_verification: ["safety", "sos", "unsafe", "security", "verification", "driver otp", "women"],
  route_driver:        ["route", "driver", "rude", "rash", "behaviour", "behavior", "ac ", "dirty"],
  crash_performance:   ["crash", "freez", "white screen", "slow", "hang", "not opening", "lag", "update"],
  notifications:       ["notification", "alert", "reminder"],
  support_escalation:  ["support", "complaint", "no response", "customer care", "feedback", "helpline"],
  ui_ux:               ["ui", "interface", "confusing", "feature", "design", "useless"],
};

export function keywordTag(text) {
  const t = ` ${String(text).toLowerCase()} `;
  const ranked = Object.entries(KEYWORDS)
    .map(([th, kws]) => [th, kws.filter((k) => t.includes(k)).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([th]) => th);
  return ranked.length ? [ranked[0], ranked[1] ?? null] : ["positive_or_other", null];
}

async function llmBatch(ai, rows) {
  const payload = rows.map((r) => ({ id: r.reviewId, stars: r.score, text: String(r.content).slice(0, 600) }));
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: JSON.stringify(payload),
    config: { systemInstruction: SYSTEM, responseMimeType: "application/json", temperature: 0 },
  });
  const text = (res.text || "").replace(/```(?:json)?/g, "").trim();
  return Object.fromEntries(JSON.parse(text).map((d) => [d.id, d]));
}

export async function main() {
  const reviews = readJSON(PATHS.reviews, []);
  const done = readJSON(PATHS.tagged, []);
  const doneIds = new Set(done.map((d) => d.reviewId));
  const todo = reviews.filter((r) => !doneIds.has(r.reviewId));
  console.log(`${todo.length} reviews to tag`);
  const useLLM = Boolean(process.env.GEMINI_API_KEY);
  console.log("Tagger:", useLLM ? `LLM (${MODEL})` : "keyword fallback (set GEMINI_API_KEY for better accuracy)");
  const ai = useLLM ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    let result = null;
    if (useLLM) {
      for (let attempt = 0; attempt < 2 && !result; attempt++) {
        try { result = await llmBatch(ai, chunk); }
        catch (e) { console.error("LLM batch failed:", e.message); }
      }
    }
    for (const r of chunk) {
      const d = result?.[r.reviewId];
      if (d) {
        done.push({
          reviewId: r.reviewId,
          primary_theme: THEMES.includes(d.primary_theme) ? d.primary_theme : "positive_or_other",
          secondary_theme: THEMES.includes(d.secondary_theme) ? d.secondary_theme : null,
          tagger: "llm",
        });
      } else {
        const [p, s] = keywordTag(r.content);
        done.push({ reviewId: r.reviewId, primary_theme: p, secondary_theme: s, tagger: "keyword" });
      }
    }
    writeJSON(PATHS.tagged, done); // save progress after every batch
    console.log(`  tagged ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
  }
  console.log("Saved ->", PATHS.tagged);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
*/






// Tag each review with a theme from the fixed taxonomy.
// Uses Google Gemini if GEMINI_API_KEY is set, otherwise a keyword fallback.
// Only untagged reviews are processed, so re-runs are cheap.  Run: npm run tag
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { TAXONOMY } from "../config.js";
import { PATHS, readJSON, writeJSON } from "./store.js";

const MODEL = process.env.TAG_MODEL || "gemini-3.8-flash";
const BATCH = 5;
const THEMES = Object.keys(TAXONOMY);

const SYSTEM = `You classify Google Play reviews of MoveInSync, an employee commute app (cab/shuttle booking,
live tracking, OTP boarding, support). Reviews may be English, Hindi, or Hinglish.
Assign each review a primary theme and an optional secondary theme from this fixed list:
${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t, TAXONOMY[t].desc])), null, 1)}
Rules:
- Pick the theme describing the MAIN complaint. Use positive_or_other only for praise/vague/unrelated.
- A late cab is late_or_no_cab (operational), even if the user blames the app.
- secondary_theme may be null.
Return ONLY a JSON array, no prose, no markdown fences:
[{"id": "<id>", "primary_theme": "...", "secondary_theme": "..." or null}]`;

// Helper function to pause execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// keyword fallback (English + common Hinglish)
const KEYWORDS = {
  login_onboarding:    ["login", "log in", "sign in", "otp not", "password", "register", "account", "employee id"],
  booking_failure:     ["book", "cancel", "roster", "schedule", "shift", "unable to request", "not able to"],
  eta_pickup_time:     ["pickup time", "pick up time", "eta", "timing", "time change"],
  late_or_no_cab:      ["late", "delay", "no cab", "not came", "didn't come", "no show", "waiting", "wait", "der ", "nahi aaya"],
  live_tracking:       ["track", "location", "map", "gps", "vehicle change"],
  safety_verification: ["safety", "sos", "unsafe", "security", "verification", "driver otp", "women"],
  route_driver:        ["route", "driver", "rude", "rash", "behaviour", "behavior", "ac ", "dirty"],
  crash_performance:   ["crash", "freez", "white screen", "slow", "hang", "not opening", "lag", "update"],
  notifications:       ["notification", "alert", "reminder"],
  support_escalation:  ["support", "complaint", "no response", "customer care", "feedback", "helpline"],
  ui_ux:               ["ui", "interface", "confusing", "feature", "design", "useless"],
};

export function keywordTag(text) {
  const t = ` ${String(text).toLowerCase()} `;
  const ranked = Object.entries(KEYWORDS)
    .map(([th, kws]) => [th, kws.filter((k) => t.includes(k)).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([th]) => th);
  return ranked.length ? [ranked[0], ranked[1] ?? null] : ["positive_or_other", null];
}

async function llmBatch(ai, rows) {
  const payload = rows.map((r) => ({ id: r.reviewId, stars: r.score, text: String(r.content).slice(0, 600) }));
  
  let maxRetries = 4;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add a baseline delay between sequential batches to lower concurrency pressure
      await sleep(500);

      const res = await ai.models.generateContent({
        model: MODEL,
        contents: JSON.stringify(payload),
        config: { systemInstruction: SYSTEM, responseMimeType: "application/json", temperature: 0 },
      });
      const text = (res.text || "").replace(/```(?:json)?/g, "").trim();
      return Object.fromEntries(JSON.parse(text).map((d) => [d.id, d]));
    } catch (e) {
      const errorMsg = e.message || String(e);
      if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") && attempt < maxRetries) {
        const backoffDelay = Math.pow(2, attempt) * 2000; 
        console.warn(`    [503 Overload] Gemini busy. Retrying batch in ${backoffDelay / 1000}s...`);
        await sleep(backoffDelay);
      } else {
        throw e;
      }
    }
  }
}

export async function main() {
  const reviews = readJSON(PATHS.reviews, []);
  const done = readJSON(PATHS.tagged, []);
  const doneIds = new Set(done.map((d) => d.reviewId));
  
  // Filter out completed reviews, then slice down to exactly 100 items maximum
  const allTodo = reviews.filter((r) => !doneIds.has(r.reviewId));
  const todo = allTodo.slice(0, 10);
  
  console.log(`${allTodo.length} total untagged reviews found. Processing a cap of ${todo.length} for this run.`);
  const useLLM = Boolean(process.env.GEMINI_API_KEY);
  console.log("Tagger:", useLLM ? `LLM (${MODEL})` : "keyword fallback (set GEMINI_API_KEY for better accuracy)");
  const ai = useLLM ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    let result = null;
    if (useLLM) {
      try { 
        result = await llmBatch(ai, chunk); 
      } catch (e) { 
        console.error("  LLM batch permanently failed:", e.message); 
      }
    }
    for (const r of chunk) {
      const d = result?.[r.reviewId];
      if (d) {
        done.push({
          reviewId: r.reviewId,
          primary_theme: THEMES.includes(d.primary_theme) ? d.primary_theme : "positive_or_other",
          secondary_theme: THEMES.includes(d.secondary_theme) ? d.secondary_theme : null,
          tagger: "llm",
        });
      } else {
        const [p, s] = keywordTag(r.content);
        done.push({ reviewId: r.reviewId, primary_theme: p, secondary_theme: s, tagger: "keyword" });
      }
    }
    writeJSON(PATHS.tagged, done); // save progress after every batch
    console.log(`  tagged ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
  }
  console.log("Saved ->", PATHS.tagged);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

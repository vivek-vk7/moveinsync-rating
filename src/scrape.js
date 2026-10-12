// Pull Play Store reviews + a daily rating snapshot. Incremental: only fetches new reviews.
// Run: npm run scrape
import { fileURLToPath } from "node:url";
import gplay from "google-play-scraper";
import { APPS, LANG, COUNTRY, MAX_REVIEWS_PER_RUN, SINCE } from "../config.js";
import { PATHS, readJSON, writeJSON } from "./store.js";

async function fetchNew(appId, known, max, since) {
  const out = [];
  let token;
  const sinceMs = since ? new Date(since).getTime() : null;
  while (out.length < max) {
    const res = await gplay.reviews({
      appId, lang: LANG, country: COUNTRY, sort: gplay.sort.NEWEST,
      num: 150, paginate: true, nextPaginationToken: token,
    });
    const batch = res.data || [];
    if (!batch.length) break;
    let fresh = batch.filter((r) => !known.has(r.id));
    if (sinceMs) fresh = fresh.filter((r) => new Date(r.date).getTime() >= sinceMs);
    out.push(...fresh);
    if (!fresh.length) break; // whole page already known (or too old) -> caught up
    token = res.nextPaginationToken;
    if (!token) break;
  }
  return out;
}

async function snapshot(label, appId) {
  const a = await gplay.app({ appId, lang: LANG, country: COUNTRY });
  const h = a.histogram || {};
  return {
    date: new Date().toISOString().slice(0, 10), app: label, score: a.score,
    ratings: a.ratings, reviews: a.reviews, installs: a.installs,
    star1: h[1], star2: h[2], star3: h[3], star4: h[4], star5: h[5],
  };
}

export async function main() {
  const existing = readJSON(PATHS.reviews, []);
  const known = new Set(existing.map((r) => r.reviewId));
  const snaps = readJSON(PATHS.snapshots, []);
  const all = [...existing];

  for (const [label, appId] of Object.entries(APPS)) {
    console.log(`[${label}] ${appId}: fetching...`);
    try {
      const s = await snapshot(label, appId);
      const i = snaps.findIndex((x) => x.date === s.date && x.app === label);
      if (i >= 0) snaps[i] = s; else snaps.push(s);
    } catch (e) {
      console.error(`[${label}] snapshot failed (check the package ID in config.js):`, e.message);
    }
    const rows = await fetchNew(appId, known, MAX_REVIEWS_PER_RUN, SINCE);
    console.log(`[${label}] ${rows.length} new reviews`);
    for (const r of rows) {
      if (!r.text || !r.text.trim()) continue; // drop empty text
      known.add(r.id);
      all.push({
        reviewId: r.id, app: label, score: r.score, content: r.text,
        thumbsUp: r.thumbsUp ?? 0, version: r.version || "unknown",
        at: new Date(r.date).toISOString(),
        replyContent: r.replyText || "", repliedAt: r.replyDate ? new Date(r.replyDate).toISOString() : "",
      });
    }
  }
  writeJSON(PATHS.reviews, all);
  writeJSON(PATHS.snapshots, snaps);
  console.log(`Saved ${all.length} total reviews -> ${PATHS.reviews}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

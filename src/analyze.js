// Metrics. Used by server.js (dashboard) and report.js (weekly summary).
import { TAXONOMY, OWNER_LABEL } from "../config.js";
import { PATHS, readJSON } from "./store.js";

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const round = (n, d = 2) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const countBy = (arr, fn) => arr.reduce((m, x) => ((m[fn(x)] = (m[fn(x)] || 0) + 1), m), {});

export function load() {
  const tags = new Map(readJSON(PATHS.tagged, []).map((t) => [t.reviewId, t]));
  return readJSON(PATHS.reviews, [])
    .filter((r) => tags.has(r.reviewId))
    .map((r) => {
      const t = tags.get(r.reviewId);
      const owner = TAXONOMY[t.primary_theme]?.owner ?? "none";
      return {
        ...r, primary_theme: t.primary_theme, secondary_theme: t.secondary_theme,
        month: r.at.slice(0, 7), low: r.score <= 2, owner, owner_label: OWNER_LABEL[owner],
        replied: Boolean(r.replyContent && r.replyContent.trim()),
      };
    });
}

export function overview(df) {
  const dist = [1, 2, 3, 4, 5].map((s) => df.filter((r) => r.score === s).length);
  return {
    reviews: df.length, avg: round(mean(df.map((r) => r.score))),
    pctLow: round((100 * df.filter((r) => r.low).length) / (df.length || 1), 1), dist,
    from: df.map((r) => r.at).sort()[0]?.slice(0, 10), to: df.map((r) => r.at).sort().at(-1)?.slice(0, 10),
  };
}

// ratingDrag = how much the average would rise if this theme's reviews vanished
export function themeTable(df) {
  const avg = mean(df.map((r) => r.score));
  const totalLow = df.filter((r) => r.low).length || 1;
  return Object.keys(TAXONOMY).map((theme) => {
    const g = df.filter((r) => r.primary_theme === theme);
    const rest = df.filter((r) => r.primary_theme !== theme);
    return {
      theme, owner: OWNER_LABEL[TAXONOMY[theme].owner], reviews: g.length,
      shareOfAllPct: round((100 * g.length) / (df.length || 1), 1),
      shareOfLowPct: round((100 * g.filter((r) => r.low).length) / totalLow, 1),
      avgStars: g.length ? round(mean(g.map((r) => r.score))) : null,
      ratingDrag: g.length && rest.length ? round(mean(rest.map((r) => r.score)) - avg, 3) : 0,
    };
  }).filter((t) => t.reviews > 0).sort((a, b) => b.shareOfLowPct - a.shareOfLowPct);
}

export function ownerSplit(df) {
  const low = df.filter((r) => r.low);
  const c = countBy(low, (r) => r.owner_label);
  return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, round((100 * v) / (low.length || 1), 1)]));
}

export function monthly(df) {
  const by = {};
  df.forEach((r) => (by[r.month] ||= []).push(r));
  return Object.keys(by).sort().map((month) => ({
    month, reviews: by[month].length, avgStars: round(mean(by[month].map((r) => r.score))),
    pctLow: round((100 * by[month].filter((r) => r.low).length) / by[month].length, 1),
  }));
}

export function versions(df, minN = 20) {
  const by = {};
  df.forEach((r) => (by[r.version] ||= []).push(r));
  const rows = Object.entries(by).filter(([, g]) => g.length >= minN).map(([version, g]) => {
    const themes = countBy(g, (r) => r.primary_theme);
    return {
      version, firstSeen: g.map((r) => r.at).sort()[0].slice(0, 10), reviews: g.length,
      avgStars: round(mean(g.map((r) => r.score))),
      pctLow: round((100 * g.filter((r) => r.low).length) / g.length, 1),
      topTheme: Object.entries(themes).sort((a, b) => b[1] - a[1])[0][0],
    };
  }).sort((a, b) => a.firstSeen.localeCompare(b.firstSeen));
  rows.forEach((r, i) => (r.deltaVsPrev = i ? round(r.avgStars - rows[i - 1].avgStars) : null));
  return rows;
}
export const regressions = (df, minN = 20, drop = 0.3) =>
  versions(df, minN).filter((v) => v.deltaVsPrev != null && v.deltaVsPrev <= -drop);

export function replyStats(df) {
  const low = df.filter((r) => r.low);
  const hrs = df.filter((r) => r.replied && r.repliedAt)
    .map((r) => (new Date(r.repliedAt) - new Date(r.at)) / 36e5).sort((a, b) => a - b);
  return {
    replyRateAllPct: round((100 * df.filter((r) => r.replied).length) / (df.length || 1), 1),
    replyRateLowPct: round((100 * low.filter((r) => r.replied).length) / (low.length || 1), 1),
    medianReplyHours: hrs.length ? round(hrs[Math.floor(hrs.length / 2)], 1) : null,
  };
}

export function topQuotes(df, theme, n = 5) {
  return df.filter((r) => r.primary_theme === theme && r.low)
    .sort((a, b) => b.thumbsUp - a.thumbsUp).slice(0, n)
    .map((r) => ({ stars: r.score, thumbsUp: r.thumbsUp, text: String(r.content).slice(0, 220), version: r.version }));
}

export function filterReviews(df, { app, from, to } = {}) {
  return df.filter((r) => (!app || r.app === app) && (!from || r.at.slice(0, 10) >= from) && (!to || r.at.slice(0, 10) <= to));
}

export function everything(df) {
  return {
    overview: overview(df), themes: themeTable(df), owners: ownerSplit(df), monthly: monthly(df),
    versions: versions(df), regressions: regressions(df), replies: replyStats(df),
    apps: [...new Set(df.map((r) => r.app))],
  };
}

const mdTable = (rows, cols) =>
  rows.length
    ? [`| ${cols.join(" | ")} |`, `|${cols.map(() => "---").join("|")}|`,
       ...rows.map((r) => `| ${cols.map((c) => r[c] ?? "").join(" | ")} |`)].join("\n")
    : "None detected.";

export function summaryMarkdown(df) {
  const o = overview(df), themes = themeTable(df);
  const snaps = readJSON(PATHS.snapshots, []).sort((a, b) => a.date.localeCompare(b.date));
  const L = [
    "# MoveInSync Play Store: weekly summary",
    `Data: ${o.from} to ${o.to} | ${o.reviews} reviews`, "",
    `**Average rating in sample:** ${o.avg} | **1-2 star share:** ${o.pctLow}%`, "",
    "## Star distribution", ...o.dist.map((n, i) => `- ${i + 1} star: ${n}`), "",
    "## Top complaint themes (by share of 1-2 star reviews)",
    mdTable(themes.slice(0, 6), ["theme", "owner", "reviews", "shareOfAllPct", "shareOfLowPct", "avgStars", "ratingDrag"]), "",
    "## Who owns the problem (1-2 star reviews)", ...Object.entries(ownerSplit(df)).map(([k, v]) => `- ${k}: ${v}%`), "",
    "## Last 3 months", mdTable(monthly(df).slice(-3), ["month", "reviews", "avgStars", "pctLow"]), "",
    "## Version regressions (avg stars dropped >= 0.3 vs previous version)",
    mdTable(regressions(df), ["version", "firstSeen", "reviews", "avgStars", "deltaVsPrev", "topTheme"]), "",
    "## Developer replies", ...Object.entries(replyStats(df)).map(([k, v]) => `- ${k}: ${v}`), "",
    "## Example complaints",
  ];
  for (const t of themes.slice(0, 3)) {
    L.push(`**${t.theme}**`, ...topQuotes(df, t.theme, 3).map((q) => `- (${q.stars}★, ${q.thumbsUp} 👍) ${q.text}`));
  }
  if (snaps.length) {
    const s = snaps.at(-1);
    L.push("", `## Official Play Store rating on ${s.date}: ${Number(s.score).toFixed(2)} (${Number(s.ratings).toLocaleString()} ratings)`);
  }
  return L.join("\n");
}

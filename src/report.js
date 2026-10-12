// Write reports/weekly_summary.md.  Run: npm run report
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { load, summaryMarkdown } from "./analyze.js";
import { PATHS } from "./store.js";

export function main() {
  const md = summaryMarkdown(load());
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync(PATHS.summary, md);
  console.log(md);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main();

// One command to refresh everything.  Run: npm run pipeline
import { main as scrape } from "./scrape.js";
import { main as tag } from "./tag.js";
import { main as report } from "./report.js";

await scrape();
await tag();
report();
console.log("\nDone. See reports/weekly_summary.md or run: npm run dashboard");

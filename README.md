# MoveInSync Play Store Ratings Tracker (Node.js)

Answers **"How are our Play Store ratings?"** with one command or one link, and shows *why* they are where they are.

**Pipeline:** scrape reviews -> tag each with a theme (Gemini, or keyword fallback) -> metrics -> dashboard + weekly summary.

## Run it
```bash
npm install
cp .env.example .env        # optional: add GEMINI_API_KEY for accurate tagging

# 1. Verify the package ID in config.js (Play Store URL -> ?id=<package>)
npm run pipeline            # scrape + tag + write reports/weekly_summary.md
npm run dashboard           # open http://localhost:3000
```
Run `npm run pipeline` again any time for the latest answer. Only new reviews are scraped and tagged.
Requires Node 18+.

## What it measures
| Metric | Why |
|---|---|
| Star distribution, 1-2 star share | Baseline health |
| Theme table with **ratingDrag** | How much the average would rise if that theme disappeared: tells you what to fix first |
| Owner split (App / Ops / Mixed) | Separates bugs we can fix from service problems the app gets blamed for |
| Monthly trend, per-version table, regression flag | Did a release hurt ratings? |
| Developer reply rate and latency | Are unhappy users heard? |
| Daily snapshot of the official Play Store rating | Builds a true rating history over time |

## Validate the tagging
```bash
npm run validate:sample     # 100 random reviews -> data/validation_sample.csv
# open in Excel/Sheets, fill the human_theme column with theme names from config.js
npm run validate:score      # prints accuracy + the most common mistakes
```

## Automate weekly
`.github/workflows/weekly.yml` refreshes data every Monday and commits the results. Add `GEMINI_API_KEY` under repo Settings -> Secrets -> Actions.

## Files
- `config.js`: apps to track + the theme taxonomy (edit this to tune tagging)
- `src/scrape.js`, `src/tag.js`, `src/analyze.js`, `src/report.js`, `src/validate.js`, `src/pipeline.js`
- `server.js` + `public/index.html`: Express API and dashboard (Chart.js)
- `data/`: reviews, tags, daily snapshots (JSON) | `reports/`: weekly summary
- `docs/`: templates for the recommendation and methodology note

## Limitations
- Play Store reviews skew negative (unhappy users review more); treat the sample average as a signal, not true satisfaction.
- Themes are tagged by an LLM and can be wrong; see the validation accuracy in the methodology note.
- The scraper reads public review data; the store may rate-limit or change its page structure.
- Correlation is not causation: a low-rated version may coincide with an operational issue.

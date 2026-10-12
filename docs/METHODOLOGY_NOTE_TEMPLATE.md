# Methodology note

- **Data source:** Google Play Store public reviews for [app name / package id], scraped with `google-play-scraper` (language [en], country [in]) on [date].
- **Sample:** [N] reviews from [start date] to [end date] after removing duplicates and empty reviews. Official rating at scrape time: [X.XX] from [N] ratings.
- **Tagging:** each review assigned one primary theme from a fixed 12-theme taxonomy that mirrors the employee journey (login, booking, ETA, late cab, tracking, safety, route/driver, crashes, notifications, support, UI, other). Tagged with [Gemini model, e.g. gemini-2.5-flash] in batches of 20 with a JSON-only prompt; handles English, Hindi and Hinglish.
- **Validation:** hand-checked [100] random reviews; tagging accuracy was [XX]% (details: `python validate.py score`).
- **Metrics:** share of 1-2 star reviews by theme; rating drag = rise in average if that theme's reviews were removed; monthly and per-version trends; developer reply rate.
- **Tools:** Python, pandas, google-play-scraper, [Gemini], Streamlit, GitHub Actions. AI was also used for [code scaffolding / drafting]; all numbers and conclusions were checked by me.
- **Assumptions and limitations:** reviews skew negative; one primary theme per review simplifies multi-issue reviews; review text can't prove root cause, so recommendations are hypotheses to confirm with logs/crash data; [anything else].
- **Repeatability:** `python pipeline.py` (or the weekly GitHub Action) refreshes everything; the dashboard shows the latest answer.

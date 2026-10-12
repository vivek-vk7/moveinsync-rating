# Improving MoveInSync's Play Store Rating: Recommendation

*(2-3 pages. Replace every [bracket] with your real numbers and quotes. Delete anything the data doesn't support.)*

## 1. Verdict
The employee app is rated [X.X] ([N] ratings). [Y]% of 1-2 star reviews are about [theme A], [theme B] and [theme C]. About [Z]% of low ratings come from problems the app team can fix; [W]% are operational issues (late cabs, drivers) that the app gets blamed for.

**Top 3 actions:** 1) [..]  2) [..]  3) [..]

## 2. Why ratings are low (evidence)
| Theme | % of 1-2 star | Rating drag | Owner |
|---|---|---|---|
| [crash_performance] | [..] | [..] | App |
| ... | | | |

- Trend: [e.g. rating fell from 3.9 to 3.2 after v10.42.6; the app crashed on launch]
- Representative quotes: "[quote]" (1★, [n] likes) ...
- Developer reply rate on 1-2 star reviews: [..]%. Median reply time: [..] hours.

## 3. Recommendations (in priority order)
For each:
**[#] [Title]**
- Problem and evidence: [theme, % of reviews, quote]
- Fix: [specific change an engineer could start tomorrow]
- Owner: [Product / Engineering / Ops / Support]
- Effort vs impact: [S/M/L] vs [low/med/high]
- Success metric: [e.g. crash-related 1-star share from 18% to under 8% within 2 releases]

Ideas to include **only if your data supports them:**
- Fix the top crash / booking-failure bug and add release monitoring with a rollback rule
- Ask for a rating only after a successful trip; send unhappy users to in-app feedback first
- Reply to every 1-2 star review within [48h] using templates by theme
- Proactive delay notifications and honest ETAs, to take pressure off operational problems
- In-app complaint tracking so users can see their issue's status

## 4. Do first (next 2 weeks) / next (30-60 days) / later
| When | Action | Owner |
|---|---|---|

## 5. How we track this
"How are our ratings?" is answered by [dashboard/repo link]. It refreshes weekly and flags version regressions. Targets: [overall 1-2 star share, reply rate, crash share].

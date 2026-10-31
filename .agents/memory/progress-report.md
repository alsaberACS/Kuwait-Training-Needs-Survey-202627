---
name: Progress reports to the Chamber
description: Editorial and sourcing rules for the periodic progress reports sent to KCCI under contract ASIA-KCCI-2026/001, plus how the report PDF is produced
---

# Progress reports to the Chamber

Rule: a progress report is a formal letter from ASIA to the Chamber's Director General, short (4–5 pages), and every number in it must come from a primary source on the report date — production database for field figures, the delivered PDFs for document facts, the API's curated focus-group report for qualitative counts. Never use the dev database.

**Why:** the user asked for "formal and attractive", "simple with few information, 4 to 5 pages", and the report is sent to the client against a contract — a wrong figure or an invented date is a contractual problem, not a typo.

**How to apply (content):**
- Frame the report under Article 6 of the contract (periodic follow-up reports). Requests to the Chamber (liaison officer, documents, member access, 5-working-day review) cite Article 7. Do not cite Article 4 as an entitlement and omit payment terms entirely.
- Do not invent delay reasons or future dates; write «في موعد يُتفق عليه مع الغرفة» and ask for an updated schedule instead.
- Status board = completion of each phase's contractual deliverable, never a time percentage; say so on the page. First report (Oct 2026): phase 1 done, 2 advanced, 3–5 active, 6 started, 7–10 upcoming.
- Logos: ASIA transparent PNG for the sender; no standalone KCCI logo exists in the project, so the gold ASDC/KCCI seal used on all deliverables stands in (offer a swap if the user supplies one).
- Reuse the questionnaire conventions: Arabic RTL, Western digits, «استبانة» never «استبيان», navy-and-gold identity.

**How to apply (production):** generator in the survey package (`report` script, `--preview` for PNGs) shares the questionnaire PDF pipeline and its caveats — see print-pdf-generation.md. Letter page has no running header (its letterhead is the header); the audit cannot see overlap between absolutely positioned footers, so always look at the page-1 PNG. The build also drops a copy into the API's document library, where the manifest entry must exist first (missing files are skipped with a startup log, not an error).

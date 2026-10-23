---
name: Admin dashboard conventions and pitfalls
description: Non-obvious rules for the /admin results dashboard — RTL chart quirks, layout traps, how to preview with realistic data, and what must stay separate.
---

**Preview with synthetic data, then delete it.** Real responses are few, so to judge charts insert temporary rows with `source_tag='synthetic-preview'` (ids `syn-###`) and delete them by that tag before finishing. Verify the row count returns to the real figure; never leave them in the dev DB.
**Why:** empty/low-n states hide layout problems, but synthetic rows would corrupt every aggregate if forgotten.

**Headless verification route.** The screenshot tool cannot pass the key gate; drive system Chromium over CDP from Node (global WebSocket), set `sessionStorage.adminKey` from the env var inside the script without printing it, click `tab-*` buttons, and capture viewport-sized chunks. `/tmp` can be wiped mid-session (container restart) — keep helper scripts trivially recreatable and re-check workflows are up (502 = not running) before trusting a diag run.

**RTL numerals.** Negative numbers (skill gaps, deltas) rendered inside RTL text show as `0.15-`; wrap numeric cells in `dir="ltr"`. Recharts stays `dir="ltr"` with `XAxis reversed` / `YAxis orientation="right"`.

**Grid-item overflow trap.** Any wide table (`min-w-[...]` inside `overflow-x-auto`) placed in a CSS grid item stretches the whole column on phones unless the grid item has `min-w-0` — `Reveal` and `Panel` carry it for that reason; do not remove.

**Keep separate:** legacy track answers (T1–T6 cohort) are shown on record, never ranked with the six current tracks; segments under 5 respondents are tagged «للاستئناس» rather than hidden; no significance tests for the voluntary sample. The summary API returns raw option ids for single-choice demographics — label them on the client via `optionLabel`.

**Study framing.** Desk-study constants (reports, programmes, shortlist, trends) live in `study-context.ts` and are fixed facts from SURVEY_SPEC, not survey data; chapter titles are research questions, one per tab.

**Infographic chapter.** The "results page" the client means is `/admin`; the infographic tab reproduces the client's reference image (glassmorphism poster: ring + callouts, icon bars, mini line charts, nested bars, tag cards + timeline) mirrored for RTL. Palette comes from the ASDC logo (gold #D0A734 / silver #A1A29D), not from the navy dashboard tokens, and the backdrop is a generated blurred teamwork photo. Keep that fidelity if the layout is revised; `backdrop-filter` glass means a DOM-to-image export would lose the effect, so prefer screenshots/print for sharing.
**Why:** the user asked for "almost similar" to the reference and logo-aligned colours. When asked for "more results, tables and figures" the poster was extended as additional pages in the same shell (one blurred backdrop per page — a single very tall poster over-zooms the backdrop) rather than as plain panels.

**Catalogue joins from the client.** Matching items list every linked survey item (courses, skills, tracks, retired R-items), so joining a course to "its" workshop needs the primary link, exposed as primaryItems on the matching DTO; do not guess from linkedItems. Field need in the matching report also comes from skills and tracks, so "workshops the field confirmed" can exceed the number of courses actually shown.

**Separate visual references.** The training-pathway board follows the newer city-photo references with connected circles, fine lines and motion; it is not a replacement or redesign of the existing infographic.
**Why:** the user explicitly asked to retain the existing infographic and supplied separate references for the additional board.
**How to apply:** keep the two views' visual treatments separate when revising either one.

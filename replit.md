# Kuwait Training Needs Survey 2026/27

Arabic (RTL) field survey "استبانة دراسة التموضع التنافسي والاحتياجات التدريبية في الكويت 2026/2027" with smart branching (B2B / B2C paths), autosave/resume, and a protected analyst dashboard that aggregates results and matches field demand against the ASDC Training Catalogue (70 workshops) from the desk study.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (Express, `/api/*`)
- `pnpm --filter @workspace/survey run dev` — survey web app (Vite, preview path `/`; `/admin` is the dashboard)
- `pnpm run typecheck` — full typecheck; `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` (managed), `ADMIN_ACCESS_KEY` (secret; shared research-team key for `/admin` — sent as `Authorization: Bearer <key>` or `X-Admin-Key`). Without it every admin endpoint returns 503.

## Structure

- `SURVEY_SPEC.md` — authoritative question text, branching rules, data model and matching framework (from the questionnaire + desk study). `attached_assets/extracted/` holds the extracted desk-study and catalogue text.
- `artifacts/survey/src/lib/survey-definition.ts` — frontend question definitions (ids, Arabic labels, options, groups). Stable ids: skills S1–S10, courses C1–C70 (groups G1–G6), tracks T1–T6. C1–C23 retain the original survey choices; C24–C70 add the remaining workshops from catalogue pages 4–29.
- `artifacts/api-server/src/data/survey-items.ts` — server-side labels + item → catalogue workshop mapping; `data/catalogue.ts` — 70 workshops extracted from the catalogue PDF (approximate figures where the PDF text was ambiguous).
- `artifacts/api-server/src/lib/analytics.ts` — summary, drop-off, skills gap (importance vs performance), course need index (mean of 0/1/2 ÷ 2 × 100), track Borda scores, preferences, matching engine (4-cell grid + composite 40/30/20/10 with ±10 sensitivity), CSV export.
- `lib/db/src/schema/responses.ts` — single `responses` table; all answers live in the `answers` JSONB keyed by question id. Aggregates are computed in Node from JSONB (no derived tables).

## Answer shape (answers JSONB)

Q1–Q4, Q6–Q9, Q19–Q23 → option id string · Q5 → `{ sector, sub, other }` · Q10, Q11, Q15, Q26 → option id array · Q14/Q18 → `{ S1: { importance, performance }, … }` · Q24 → ordered track id array · Q25G → selected course-group id array (G1–G6, the "المسارات التدريبية" gate) · Q25 → `{ C1: 0|1|2, … }` (0 غير مهتم, 1 مهتم مستقبلاً, 2 أرغب بالحجز فوراً) **only for courses in the selected groups** — the client prunes answers when a group is deselected.

## Conventions

- Display numbering is sequential per path; original question ids (which skip Q12/13/16/17) are kept internally.
- Never treat not-shown or dropped-off responses as "no need" — course rates use only respondents who saw the course (i.e. whose Q25 contains it). Track-selection shares (`groups` in the course-demand report) use only respondents who answered Q25G.
- Keep the six survey tracks and original course ids/wording stable when expanding the catalogue, to avoid reinterpreting historical responses. Assign new workshops by topic rather than copying the PDF's category structure (e.g. HR analytics belongs under HR). Every catalogue workshop now has a primary course link; legacy secondary links remain for interpretation.
- Participant navigation advances after single answers or fully rated matrix rows. Multi-select, ranking and free-text follow-ups require confirmation so choices are not cut short. Before opening optional contact, validate all required sections and mark the survey complete. Optional contact is a separate contact-only update; leaving or skipping that section must never lose the submitted response.
- Keep the questionnaire's navy-and-gold identity and restrained transitions. Mobile skill ratings show one skill at a time with review navigation and neutral explanations. Course selection must have equal-detail expandable descriptions, no recommended/popular badges, and no preselected ratings.
- In the mobile “فجوة المهارات لفرق العمل” section, selecting ratings must not advance automatically; users click Next to move between skills and Continue after completing all ratings.
- Use English digits (0–9) throughout the questionnaire, including ratings, progress, and results; preserve Arabic text and RTL layout.
- Personalized summaries appear only after submission and never require contact details. They summarize self-reported answers, not validated assessments. Course descriptions are introductory explanations, not promises of verified syllabi or qualifications.
- Required-survey progress excludes optional contact and follows the active branch. Show “saved” only after the server confirms the latest answers; draft autosave and section navigation share one serialized writer.

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
- `artifacts/survey/src/lib/survey-definition.ts` — frontend question definitions (ids, Arabic labels, options, groups). Stable ids: skills S1–S10, courses C1–C23 (groups G1–G6), tracks T1–T6.
- `artifacts/api-server/src/data/survey-items.ts` — server-side labels + item → catalogue workshop mapping; `data/catalogue.ts` — 70 workshops extracted from the catalogue PDF (approximate figures where the PDF text was ambiguous).
- `artifacts/api-server/src/lib/analytics.ts` — summary, drop-off, skills gap (importance vs performance), course need index (mean of 0/1/2 ÷ 2 × 100), track Borda scores, preferences, matching engine (4-cell grid + composite 40/30/20/10 with ±10 sensitivity), CSV export.
- `lib/db/src/schema/responses.ts` — single `responses` table; all answers live in the `answers` JSONB keyed by question id. Aggregates are computed in Node from JSONB (no derived tables).

## Answer shape (answers JSONB)

Q1–Q4, Q6–Q9, Q19–Q23 → option id string · Q5 → `{ sector, sub, other }` · Q10, Q11, Q15, Q26 → option id array · Q14/Q18 → `{ S1: { importance, performance }, … }` · Q24 → ordered track id array · Q25 → `{ C1: 0|1|2, … }` (0 غير مهتم, 1 مهتم مستقبلاً, 2 أرغب بالحجز فوراً).

## Conventions

- Display numbering is sequential per path; original question ids (which skip Q12/13/16/17) are kept internally.
- Never treat not-shown or dropped-off responses as "no need" — course rates use only respondents who saw the course.

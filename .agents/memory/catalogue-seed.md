---
name: Catalogue seed caveats
description: Provenance and known inaccuracies of the 70-workshop catalogue data used by the matching engine.
---
The catalogue module in the API server was produced by an LLM structured extraction over the PDF text of the ASDC Training Catalogue 2026/27 (text copy in attached_assets/extracted/). Category counts matched the PDF (9/13/7/20/13/8 = 70), but the summed training days came out 279 vs the PDF's 258 and only 18 cards were flagged "shortlisted" vs the desk study's 34.

**Why it matters:** matching grid cells use evidenceScore / shortlisted / top50Rank; a wrong flag can move a workshop between "confirmed priority" and "new demand".

**How to apply:** before the research team quotes catalogue-level numbers, re-check tier/days/shortlist against the PDF pages (render pages with the pdf-processing skill) and fix the module by hand; the item→workshop mapping lives in a separate server data module.

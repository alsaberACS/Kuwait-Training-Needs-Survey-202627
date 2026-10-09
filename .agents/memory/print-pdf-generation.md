---
name: Printable questionnaire PDF
description: How the print edition of the survey is produced and the layout rules that must hold when regenerating it
---

# Printable questionnaire PDF

Rule: the print edition is generated, never hand-edited. Regenerate with the survey package's `pdf` script and only ship it when the overflow audit passes and the page previews have been looked at.

**Why:** pages are fixed A4 boxes with `overflow:hidden`; anything that no longer fits is clipped silently in the PDF. The first run overflowed on three pages (B2B section needed two pages) and this was only visible through the audit + PNG previews, not through Chromium's exit status.

**How to apply:**
- Run `pnpm --filter @workspace/survey run pdf -- --preview`; the audit prints free mm per page and throws on overflow (`--force` renders anyway, for layout debugging only).
- Chromium binary: system `chromium` is on PATH in this workspace (`/repl/tools/bin/chromium`); override with `CHROMIUM_BIN`. No puppeteer/npm deps; `pdfinfo`/`pdftoppm`/`pdffonts` (poppler) are available for checks.
- Fonts (IBM Plex Sans Arabic + Readex Pro TTFs) are checked in under the tool's `assets/fonts`. Avoid Unicode symbol glyphs (▼, ◆…) in print HTML: they fall back to DejaVu/Liberation and get embedded as extra fonts; use CSS shapes or inline SVG instead.
- The tool runs with plain `node` type-stripping (no tsx): relative imports need `.ts` extensions, erasable TS syntax only. It lives in `tools/`, not `scripts/`, because `scripts/tsconfig.json` has `rootDir: src` which breaks cross-package typecheck.
- Delivery decision (Oct 2026): course descriptions were omitted from the print edition for length; a separate appendix was offered, not built.

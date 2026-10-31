/**
 * Builds the progress report PDF for the Chamber.
 *
 *   pnpm --filter @workspace/survey run report              → exports/progress-report-2026-10-31.pdf
 *                                                             + artifacts/api-server/documents/07-progress-report-2026-10-31.pdf
 *   pnpm --filter @workspace/survey run report -- --preview → also renders PNG previews into /tmp/progress-report
 *
 * Same rendering pipeline as the questionnaire PDF: system Chromium in headless
 * mode, fixed A4 pages, and an overflow audit that fails loudly instead of
 * silently clipping content. Fonts and logos are shared with the questionnaire.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stylesheet } from "./styles.ts";
import { buildPages, TOTAL_PAGES } from "./pages.ts";
import { REPORT } from "./content.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(here, "../../../..");
const assetsDir = path.resolve(here, "../questionnaire-pdf/assets");
const outDir = path.join(workspaceRoot, "exports");
const libraryDir = path.join(workspaceRoot, "artifacts/api-server/documents");
const workDir = path.join(os.tmpdir(), "progress-report");
const outPdf = path.join(outDir, `progress-report-${REPORT.dateIso}.pdf`);
const libraryPdf = path.join(libraryDir, `0${6 + REPORT.number}-progress-report-${REPORT.dateIso}.pdf`);
const wantPreview = process.argv.includes("--preview");
const force = process.argv.includes("--force"); // layout debugging only: render despite overflow

const chromium = process.env.CHROMIUM_BIN ?? "chromium";
const CHROME_FLAGS = [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars",
  "--allow-file-access-from-files", "--run-all-compositor-stages-before-draw", "--virtual-time-budget=10000",
];

const PX_PER_MM = 96 / 25.4;
const AUDIT_SCRIPT = `
document.fonts.ready.then(() => {
  const rows = [];
  document.querySelectorAll('.page').forEach((page, i) => {
    const box = page.querySelector('.sheet') ?? page;
    const top = box.getBoundingClientRect().top;
    let used = 0;
    box.querySelectorAll('*').forEach((el) => { used = Math.max(used, el.getBoundingClientRect().bottom - top); });
    rows.push({ page: i + 1, id: page.id, freePx: Math.round(box.clientHeight - used) });
  });
  const el = document.createElement('script'); el.type = 'application/json'; el.id = 'audit';
  el.textContent = JSON.stringify({ fontsLoaded: document.fonts.size, rows });
  document.body.appendChild(el);
});`;

function renderHtml(): string {
  const assets = {
    emblem: pathToFileURL(path.join(assetsDir, "al-sagar-logo.jpg")).href,
    asia: pathToFileURL(path.join(assetsDir, "asia-data-science.png")).href,
  };
  const pages = buildPages(assets);
  if (pages.length !== TOTAL_PAGES || pages.length !== REPORT.pages) throw new Error(`page plan mismatch: ${pages.length} rendered vs ${TOTAL_PAGES}/${REPORT.pages} planned`);
  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${REPORT.reportTitle} — ${REPORT.dateLabel}</title>
<style>${stylesheet(pathToFileURL(path.join(assetsDir, "fonts")).href)}</style></head>
<body>${pages.map((p) => p.html).join("\n")}<script>${AUDIT_SCRIPT}</script></body></html>`;
}

function run(args: string[]): string {
  return execFileSync(chromium, [...CHROME_FLAGS, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
}

function audit(url: string): void {
  const dom = run(["--dump-dom", url]);
  const match = dom.match(/<script type="application\/json" id="audit">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("overflow audit did not run (fonts never became ready?)");
  const { fontsLoaded, rows } = JSON.parse(match[1]) as { fontsLoaded: number; rows: { page: number; id: string; freePx: number }[] };
  if (fontsLoaded < 8) throw new Error(`expected 8 embedded font faces, found ${fontsLoaded}`);
  const mm = (px: number) => `${(px / PX_PER_MM).toFixed(1)} mm`;
  for (const r of rows) console.log(`  page ${r.page}  ${r.id.padEnd(12)} ${r.freePx < 0 ? `OVERFLOW ${mm(-r.freePx)}` : `free ${mm(r.freePx)}`}`);
  const bad = rows.filter((r) => r.freePx < 0);
  if (bad.length) {
    const msg = `content overflows on page(s): ${bad.map((r) => `${r.page} (${r.id}, +${mm(-r.freePx)})`).join(", ")}`;
    if (!force) throw new Error(msg);
    console.warn(`WARNING (ignored because of --force): ${msg}`);
  }
}

function main(): void {
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const htmlPath = path.join(workDir, "progress-report.html");
  writeFileSync(htmlPath, renderHtml());
  const url = pathToFileURL(htmlPath).href;

  console.log("Auditing page layout…");
  audit(url);

  console.log("Printing PDF…");
  run(["--no-pdf-header-footer", `--print-to-pdf=${outPdf}`, url]);
  if (!existsSync(outPdf)) throw new Error("Chromium produced no PDF");
  const info = execFileSync("pdfinfo", [outPdf], { encoding: "utf8" });
  const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1] ?? 0);
  if (pages !== TOTAL_PAGES) throw new Error(`PDF has ${pages} pages, expected ${TOTAL_PAGES}`);
  console.log(`✓ ${path.relative(workspaceRoot, outPdf)} (${pages} pages)`);

  if (existsSync(libraryDir)) {
    copyFileSync(outPdf, libraryPdf);
    console.log(`✓ ${path.relative(workspaceRoot, libraryPdf)} (document library copy)`);
  } else {
    console.warn(`document library folder not found at ${libraryDir}; skipped the library copy`);
  }

  if (wantPreview) {
    execFileSync("pdftoppm", ["-r", "70", "-png", outPdf, path.join(workDir, "page")]);
    const previews = readdirSync(workDir).filter((f) => f.endsWith(".png")).sort();
    console.log(`✓ ${previews.length} previews in ${workDir}`);
  }
}

main();

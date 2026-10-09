/**
 * Print stylesheet for the questionnaire PDF.
 * Fixed A4 pages (210 × 297 mm) composed like a brochure; colours follow the
 * questionnaire's navy-and-gold identity.
 */

const SADU_TILE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'>` +
    `<path d='M10 1.5 L18.5 10 L10 18.5 L1.5 10 Z' fill='none' stroke='#dd9c2c' stroke-width='1.3'/>` +
    `<path d='M10 6.2 L13.8 10 L10 13.8 L6.2 10 Z' fill='#dd9c2c'/>` +
    `</svg>`,
);

const GRID_TILE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>` +
    `<path d='M0 .5H28M.5 0V28' stroke='#f3e3bd' stroke-opacity='.16' stroke-width='1'/>` +
    `<rect x='10' y='10' width='8' height='8' fill='#f3e3bd' fill-opacity='.05'/>` +
    `</svg>`,
);

export function stylesheet(fontsUrl: string): string {
  const face = (family: string, file: string, weight: number) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url('${fontsUrl}/${file}') format('truetype');}`;

  return `
${face("IBM Plex Sans Arabic", "IBMPlexSansArabic-400.ttf", 400)}
${face("IBM Plex Sans Arabic", "IBMPlexSansArabic-500.ttf", 500)}
${face("IBM Plex Sans Arabic", "IBMPlexSansArabic-600.ttf", 600)}
${face("IBM Plex Sans Arabic", "IBMPlexSansArabic-700.ttf", 700)}
${face("Readex Pro", "ReadexPro-400.ttf", 400)}
${face("Readex Pro", "ReadexPro-500.ttf", 500)}
${face("Readex Pro", "ReadexPro-600.ttf", 600)}
${face("Readex Pro", "ReadexPro-700.ttf", 700)}

:root{
  --navy:hsl(206 62% 17%);--navy-2:hsl(196 60% 11%);--navy-soft:hsl(206 62% 17% / .08);
  --gold:hsl(38 72% 52%);--gold-deep:hsl(32 70% 36%);--gold-soft:hsl(38 72% 52% / .14);
  --teal:hsl(178 45% 32%);--teal-soft:hsl(178 45% 32% / .10);
  --paper:hsl(40 33% 96%);--card:#fff;--ink:hsl(206 55% 13%);--muted:hsl(206 18% 42%);
  --line:hsl(206 22% 85%);--line-soft:hsl(206 22% 91%);--cream:hsl(40 40% 97%);
}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;color:var(--ink);font-size:10pt;line-height:1.7;direction:rtl;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;font-feature-settings:"ss01"}
h1,h2,h3,.display{font-family:'Readex Pro','IBM Plex Sans Arabic',sans-serif;margin:0}
p,ul,ol{margin:0;padding:0}
ul,ol{list-style:none}
img{display:block}
.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
.num-ltr{direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}

/* ---------- page shell ---------- */
.page{position:relative;width:210mm;height:297mm;overflow:hidden;background:var(--paper);break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.spine{position:absolute;top:0;bottom:0;right:0;width:5mm;background:var(--navy)}
.spine::after{content:"";position:absolute;inset:0;background-image:url("data:image/svg+xml,${SADU_TILE}");background-size:4.2mm 4.2mm;background-position:center top;background-repeat:repeat-y;opacity:.85}
.run-head{position:absolute;top:9mm;right:15mm;left:13mm;height:7mm;display:flex;align-items:center;justify-content:space-between;
  border-bottom:.3mm solid var(--line);padding-bottom:1.5mm;font-size:8.2pt;color:var(--muted)}
.run-head .rh-title{display:flex;align-items:center;gap:2mm;font-weight:600;color:var(--navy)}
.run-head .rh-title::before{content:"";width:2.4mm;height:2.4mm;background:var(--gold);transform:rotate(45deg);display:inline-block}
.sheet{position:absolute;top:21mm;right:15mm;left:13mm;bottom:19mm}
.run-foot{position:absolute;bottom:7mm;right:15mm;left:13mm;height:9mm;display:flex;align-items:center;justify-content:space-between;
  border-top:.3mm solid var(--line);padding-top:1.5mm;font-size:7.8pt;color:var(--muted)}
.run-foot .brand{display:flex;align-items:center;gap:2.2mm}
.run-foot .brand img{height:7mm;width:7mm;border-radius:50%;object-fit:cover}
.run-foot .brand span{line-height:1.3}
.run-foot .brand strong{display:block;color:var(--navy);font-weight:600;font-size:7.8pt}
.run-foot .pageno{display:flex;align-items:center;gap:1.5mm;font-family:'Readex Pro',sans-serif;font-weight:600;color:var(--navy);font-size:9pt}
.run-foot .pageno i{width:5.5mm;height:5.5mm;background:var(--navy);color:var(--gold);display:inline-flex;align-items:center;justify-content:center;font-style:normal;border-radius:1mm;font-size:8pt}
.run-foot .partner img{height:4.6mm;width:auto}

/* ---------- section band ---------- */
.band{position:relative;overflow:hidden;border-radius:3mm;background:linear-gradient(160deg,hsl(206 62% 15%),hsl(196 60% 11%));color:hsl(40 30% 94%);
  padding:4.5mm 6mm 4.5mm 6mm;margin-bottom:4.5mm;display:grid;grid-template-columns:auto 1fr;gap:5mm;align-items:center}
.band::after{content:"";position:absolute;left:0;top:0;bottom:0;width:9mm;background-image:url("data:image/svg+xml,${SADU_TILE}");background-size:4.5mm 4.5mm;background-repeat:repeat;opacity:.35}
.band .kicker{font-family:'Readex Pro',sans-serif;font-weight:700;font-size:20pt;color:var(--gold);line-height:1;letter-spacing:.02em;
  border-left:.4mm solid hsl(38 72% 52% / .5);padding-left:5mm}
.band h2{font-size:15.5pt;font-weight:600;line-height:1.35}
.band p{font-size:9pt;color:hsl(40 30% 94% / .78);margin-top:1mm;line-height:1.6}
.band .tag{position:absolute;left:12mm;top:4mm;font-size:7.5pt;font-weight:600;color:var(--gold);letter-spacing:.08em}

/* ---------- layout helpers ---------- */
.grid{display:grid;gap:4mm}
.cols-2{grid-template-columns:1fr 1fr}
.cols-3{grid-template-columns:1fr 1fr 1fr}
.stack>*+*{margin-top:4mm}
.span-2{grid-column:span 2}
.fill{display:flex;flex-direction:column;height:100%}
.fill .grow{flex:1;display:flex;flex-direction:column}
.fill .grow>*+*{margin-top:4mm}
.fill .thanks{flex:1;display:flex;flex-direction:column;justify-content:center}

/* ---------- question card ---------- */
.q{background:var(--card);border:.3mm solid var(--line);border-radius:3mm;padding:3.6mm 4.2mm 3.8mm;break-inside:avoid;position:relative}
.q-head{display:flex;align-items:flex-start;gap:3mm;margin-bottom:2.4mm}
.q-num{flex:none;width:7.2mm;height:7.2mm;border-radius:1.6mm;background:var(--navy);color:var(--gold);display:flex;align-items:center;justify-content:center;
  font-family:'Readex Pro',sans-serif;font-weight:700;font-size:10.5pt;margin-top:.4mm}
.q-title{flex:1;min-width:0}
.q-title h3{font-size:11.5pt;font-weight:600;line-height:1.45;color:var(--navy)}
.q-title .hint{font-size:8.3pt;color:var(--muted);line-height:1.55;margin-top:.6mm}
.q-type{flex:none;align-self:flex-start;font-size:7.4pt;font-weight:600;color:var(--gold-deep);background:var(--gold-soft);border-radius:10mm;padding:.6mm 2.6mm;margin-top:1.2mm;white-space:nowrap}
.q-type.multi{color:var(--teal);background:var(--teal-soft)}
.q-type.scale{color:hsl(40 30% 97%);background:var(--navy)}

/* options */
.opts{display:grid;gap:1.2mm 5mm}
.opts li{display:flex;align-items:flex-start;gap:2.2mm;font-size:9.4pt;line-height:1.5;padding:.9mm 0;border-bottom:.2mm dashed var(--line-soft)}
.opts.plain li{border-bottom:0}
.opts li .lbl{flex:1;min-width:0}
.opts li small{display:block;font-size:7.6pt;color:var(--muted);line-height:1.5}
.mk{flex:none;width:4.1mm;height:4.1mm;border:.38mm solid hsl(206 40% 35%);background:#fff;margin-top:1.3mm}
.mk.radio{border-radius:50%}
.mk.check{border-radius:.9mm}
.write{flex:1;border-bottom:.3mm solid hsl(206 40% 35%);min-height:5mm;margin-right:1mm}
.chip{display:inline-block;font-size:7pt;font-weight:600;color:var(--gold-deep);background:var(--gold-soft);border-radius:10mm;padding:0 2mm;margin-right:1.5mm;vertical-align:middle;line-height:1.7}

/* sub panels (Q5) */
.sub{margin-top:3mm;display:grid;grid-template-columns:1fr 1fr;gap:3.5mm}
.sub .panel{border:.3mm solid var(--line-soft);background:var(--paper);border-radius:2.4mm;padding:2.6mm 3.2mm}
.sub .panel h4{margin:0 0 1.5mm;font-size:8.8pt;font-weight:600;color:var(--navy);display:flex;align-items:center;gap:1.6mm}
.sub .panel h4::before{content:"";width:1.8mm;height:1.8mm;background:var(--gold);transform:rotate(45deg)}
.sub .opts li{font-size:8.6pt;padding:.5mm 0;border-bottom:0}
.sub .mk{width:3.6mm;height:3.6mm;margin-top:1.2mm}

/* path cards (Q7) */
.paths{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:1mm}
.path{border:.4mm solid var(--line);border-radius:3mm;padding:3.6mm 4mm;background:var(--card);position:relative;overflow:hidden}
.path.b2b{border-color:hsl(206 62% 17% / .45)}
.path.b2c{border-color:hsl(38 72% 52% / .6)}
.path .pt{display:flex;align-items:center;justify-content:space-between;margin-bottom:2.8mm}
.path .pic{width:9.5mm;height:9.5mm;border-radius:2.4mm;background:var(--navy);color:var(--gold);display:inline-flex;align-items:center;justify-content:center}
.path .pic svg{width:5mm;height:5mm}
.path.b2c .pic{background:var(--gold-deep);color:#fff}
.path .code{font-family:'Readex Pro',sans-serif;font-weight:700;font-size:17pt;color:hsl(206 62% 17% / .2);direction:ltr}
.path .ph{display:flex;align-items:flex-start;gap:2.6mm}
.path .ph .mk{margin-top:1.6mm}
.path .ph h4{margin:0;font-size:10.5pt;font-weight:600;line-height:1.45;color:var(--navy)}
.path .ph p{font-size:8.4pt;color:var(--muted);line-height:1.55;margin-top:.8mm}
.path .next{margin-top:3mm;border-top:.25mm dashed var(--line);padding-top:2.4mm}
.path .next strong{display:block;font-size:8.2pt;color:var(--gold-deep);font-weight:600;margin-bottom:1mm}
.path .next ol{counter-reset:nx}
.path .next li{font-size:8.4pt;line-height:1.55;display:flex;gap:2mm;align-items:baseline;color:var(--ink)}
.path .next li::before{counter-increment:nx;content:counter(nx);flex:none;width:4.2mm;height:4.2mm;border-radius:1mm;background:var(--navy-soft);color:var(--navy);font-size:7pt;font-weight:600;display:inline-flex;align-items:center;justify-content:center;transform:translateY(.6mm)}
.path .goto{margin-top:2.6mm;display:inline-flex;align-items:center;gap:1.6mm;font-size:8.4pt;font-weight:600;color:#fff;background:var(--navy);border-radius:10mm;padding:.8mm 3.2mm .8mm 2.4mm}
.path.b2c .goto{background:var(--gold-deep)}
.path .goto svg{width:3.4mm;height:3.4mm}
.path .ribbon{position:absolute;left:-7mm;top:-7mm;width:22mm;height:22mm;background-image:url("data:image/svg+xml,${SADU_TILE}");background-size:5.5mm 5.5mm;opacity:.12;transform:rotate(12deg)}

/* note box */
.note{display:flex;gap:2.6mm;align-items:flex-start;background:var(--gold-soft);border-radius:2.4mm;padding:2.4mm 3.2mm;font-size:8.4pt;line-height:1.6;color:hsl(32 70% 26%)}
.note::before{content:"!";flex:none;width:4.4mm;height:4.4mm;border-radius:50%;background:var(--gold);color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-size:8pt;margin-top:.8mm}
.note.teal{background:var(--teal-soft);color:hsl(178 45% 22%)}
.note.teal::before{background:var(--teal);content:"i";font-family:'Readex Pro',sans-serif}

/* ---------- skill matrix ---------- */
.legend{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-bottom:2.6mm}
.legend div{display:flex;gap:2.2mm;align-items:flex-start;font-size:8.3pt;line-height:1.5;padding:2mm 2.8mm;border-radius:2.2mm;background:var(--paper);border:.25mm solid var(--line-soft)}
.legend div::before{content:"";flex:none;width:3.2mm;height:3.2mm;border-radius:.8mm;margin-top:1.2mm}
.legend .imp::before{background:var(--navy)}
.legend .perf::before{background:var(--gold)}
.legend strong{display:block;font-weight:600;color:var(--navy)}
.legend span{color:var(--muted)}
table.matrix{width:100%;border-collapse:separate;border-spacing:0;font-size:9pt}
table.matrix th{font-weight:600;font-size:7.8pt;color:var(--muted);padding:1.2mm 1mm;text-align:center;vertical-align:bottom;border-bottom:.35mm solid var(--line)}
table.matrix th.skill{text-align:start;padding-right:1mm}
table.matrix th.grp{padding:1.2mm 0 .8mm;border-bottom:0}
table.matrix th.grp span{display:block;border-radius:10mm;padding:.5mm 2mm;color:#fff;font-size:7.8pt;letter-spacing:.01em}
table.matrix th.grp.imp span{background:var(--navy)}
table.matrix th.grp.perf span{background:var(--gold-deep)}
.roomy table.matrix td{padding:2.3mm 1mm}
table.matrix td{padding:1.1mm 1mm;border-bottom:.22mm solid var(--line-soft);vertical-align:middle;text-align:center}
table.matrix tr:nth-child(even) td{background:hsl(40 33% 96% / .7)}
table.matrix td.idx{width:6mm;color:var(--muted);font-family:'Readex Pro',sans-serif;font-weight:600;font-size:8.5pt}
table.matrix td.skill{text-align:start;line-height:1.4}
table.matrix td.skill b{display:block;font-weight:600;font-size:9pt;color:var(--ink)}
table.matrix td.skill small{display:block;font-size:7.4pt;color:var(--muted);line-height:1.45;margin-top:.3mm}
table.matrix td.gap{width:3mm;border-bottom:0;background:transparent!important}
.cell{display:inline-flex;align-items:center;justify-content:center;width:5.6mm;height:5.6mm;border-radius:50%;border:.32mm solid hsl(206 40% 35% / .75);font-size:7.6pt;color:var(--muted);background:#fff;font-family:'Readex Pro',sans-serif}
.cell.perf{border-color:hsl(32 70% 36% / .75)}
.scale-ends{display:flex;justify-content:space-between;font-size:7pt;color:var(--muted);padding:0 .5mm;line-height:1.3}

/* ---------- ranking ---------- */
.rank{display:grid;grid-template-columns:1fr;gap:1.2mm}
.rank li{display:flex;align-items:center;gap:2.6mm;font-size:9.4pt;line-height:1.45;padding:.9mm 0;border-bottom:.2mm dashed var(--line-soft)}
.rank .box{flex:none;width:8mm;height:6.6mm;border:.38mm solid hsl(206 40% 35%);border-radius:1.4mm;background:#fff}
.rank .tid{flex:none;font-size:7pt;font-weight:600;color:var(--gold-deep)}

/* ---------- course blocks ---------- */
.course-intro{display:grid;grid-template-columns:1fr auto;gap:4mm;align-items:center}
.levels{display:flex;gap:2.6mm}
.levels span{display:inline-flex;align-items:center;gap:1.4mm;font-size:8pt;color:var(--muted)}
.levels .mk{margin-top:0;width:3.6mm;height:3.6mm}
table.courses{width:100%;border-collapse:separate;border-spacing:0;font-size:8.9pt;margin-top:3mm;break-inside:avoid}
table.courses th{text-align:center;font-weight:600;font-size:7.4pt;color:var(--muted);padding:.4mm .5mm 1mm;vertical-align:bottom;width:19mm;line-height:1.3}
table.courses th.ghead{text-align:start;padding:0 0 1mm;width:auto}
table.courses th.ghead div{display:flex;align-items:center;gap:2.4mm;background:var(--navy);color:#fff;border-radius:2mm;padding:1.3mm 3mm;font-size:9.4pt;font-weight:600}
table.courses th.ghead div i{font-style:normal;font-family:'Readex Pro',sans-serif;color:var(--gold);font-weight:700;font-size:9pt}
table.courses th.ghead div em{font-style:normal;font-weight:400;font-size:7.6pt;color:hsl(40 30% 94% / .7);margin-right:auto}
table.courses td{padding:.5mm 1mm;border-bottom:.22mm solid var(--line-soft);vertical-align:middle;line-height:1.4}
table.courses tr:nth-child(even) td{background:hsl(40 33% 96% / .75)}
table.courses td.cid{width:8mm;color:var(--muted);font-size:7.4pt;font-family:'Readex Pro',sans-serif;font-weight:600;text-align:center}
table.courses td.c{text-align:center}
table.courses td.c .mk{display:inline-block;margin:0;width:3.9mm;height:3.9mm;vertical-align:middle}
.cont{display:flex;align-items:center;gap:3mm;font-size:8.6pt;color:var(--muted);margin-bottom:2mm}
.cont b{color:var(--navy);font-weight:600}
.cont::after{content:"";flex:1;border-top:.3mm dashed var(--line)}

/* ---------- guide page ---------- */
.card{background:var(--card);border:.3mm solid var(--line);border-radius:3mm;padding:3.8mm 4.2mm;break-inside:avoid}
.card h3{font-size:11pt;font-weight:600;color:var(--navy);margin-bottom:2.4mm;display:flex;align-items:center;gap:2.2mm}
.card h3 .ic{width:6.4mm;height:6.4mm;border-radius:1.6mm;background:var(--gold-soft);color:var(--gold-deep);display:inline-flex;align-items:center;justify-content:center}
.card h3 .ic svg{width:3.8mm;height:3.8mm}
.facts{display:grid;grid-template-columns:auto 1fr;gap:1.4mm 4mm;font-size:8.8pt;line-height:1.55}
.facts dt{color:var(--muted);font-weight:500;white-space:nowrap}
.facts dd{margin:0;font-weight:500;color:var(--ink)}
.keys li{display:grid;grid-template-columns:22mm 1fr;align-items:center;gap:3mm;font-size:8.8pt;padding:1.5mm 0;border-bottom:.2mm dashed var(--line-soft)}
.keys li:last-child{border-bottom:0}
.keys .demo{display:flex;gap:1.2mm;align-items:center;justify-content:center}
.keys .demo .mk{margin:0}
.keys .demo .cell{width:4.6mm;height:4.6mm;font-size:6.5pt}
.keys .demo .box{width:6mm;height:5.4mm;border:.38mm solid hsl(206 40% 35%);border-radius:1.2mm;background:#fff}
.flow{display:grid;gap:2.2mm}
.flow .step{display:grid;grid-template-columns:auto 1fr;gap:3mm;align-items:center;background:var(--paper);border:.3mm solid var(--line-soft);border-radius:2.4mm;padding:2.2mm 3mm}
.flow .step .n{width:6.4mm;height:6.4mm;border-radius:1.4mm;background:var(--navy);color:var(--gold);font-family:'Readex Pro',sans-serif;font-weight:700;font-size:9pt;display:flex;align-items:center;justify-content:center}
.flow .step b{display:block;font-size:9pt;font-weight:600;color:var(--navy);line-height:1.4}
.flow .step span{display:block;font-size:7.8pt;color:var(--muted);line-height:1.5}
.flow .fork{display:grid;grid-template-columns:1fr 1fr;gap:2.2mm;position:relative}
.flow .fork .step{border-color:hsl(206 62% 17% / .35)}
.flow .fork .step.alt{border-color:hsl(38 72% 52% / .55)}
.flow .fork .step.alt .n{background:var(--gold-deep);color:#fff}
.flow .arrow{display:flex;justify-content:center;color:var(--gold);margin:-1mm 0}
.flow .arrow svg{width:4.6mm;height:4.6mm;stroke-width:2.6}
.consent{display:flex;gap:3mm;align-items:flex-start;background:var(--navy-soft);border-radius:2.4mm;padding:3mm 3.4mm;font-size:9.2pt;line-height:1.65}
.consent .mk{width:4.6mm;height:4.6mm;margin-top:1.4mm}
.consent b{display:block;font-weight:600;color:var(--navy)}

/* ---------- contact ---------- */
.fields{display:grid;gap:3.2mm}
.field{display:grid;grid-template-columns:38mm 1fr;align-items:end;gap:3mm;font-size:9.4pt}
.field label{font-weight:600;color:var(--navy);padding-bottom:1mm}
.field .line{border-bottom:.35mm solid hsl(206 40% 35%);height:8mm;display:flex;align-items:flex-end;padding-bottom:.6mm;color:var(--muted);font-size:8.5pt}
.field .line .ltr{color:var(--muted)}

/* ---------- cover ---------- */
.cover{background:linear-gradient(160deg,hsl(206 62% 15%),hsl(196 60% 11%));color:hsl(40 30% 94%)}
.cover .glow{position:absolute;inset:0;background:
  radial-gradient(120mm 70mm at 100% 0%,hsl(38 72% 52% / .22),transparent 65%),
  radial-gradient(110mm 80mm at 0% 55%,hsl(178 45% 32% / .22),transparent 65%)}
.cover .mesh{position:absolute;inset:0;background-image:url("data:image/svg+xml,${GRID_TILE}");background-size:7.4mm 7.4mm;
  -webkit-mask-image:linear-gradient(to bottom,transparent 38%,#000 70%,#000 100%);mask-image:linear-gradient(to bottom,transparent 38%,#000 70%,#000 100%)}
.cover .edge{position:absolute;top:0;bottom:0;right:0;width:7mm;background:var(--navy-2)}
.cover .edge::after{content:"";position:absolute;inset:0;background-image:url("data:image/svg+xml,${SADU_TILE}");background-size:5.2mm 5.2mm;background-position:center top;background-repeat:repeat-y;opacity:.9}
.cover .top{position:absolute;top:14mm;right:20mm;left:16mm;display:flex;align-items:center;gap:6mm}
.cover .medallion{flex:none;width:36mm;height:36mm;border-radius:50%;background:#fff;padding:2.6mm;box-shadow:0 0 0 1.2mm hsl(38 72% 52% / .55),0 0 0 2.6mm hsl(38 72% 52% / .18)}
.cover .medallion img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.cover .org strong{display:block;font-family:'Readex Pro',sans-serif;font-size:14pt;font-weight:600;line-height:1.4}
.cover .org span{display:block;font-size:10.5pt;color:hsl(40 30% 94% / .78);line-height:1.5}
.cover .org em{display:inline-block;font-style:normal;margin-top:2.2mm;font-size:8pt;letter-spacing:.14em;color:var(--gold);font-weight:600}
.cover .main{position:absolute;top:70mm;right:20mm;left:16mm}
.cover .kicker{display:inline-flex;align-items:center;gap:2.4mm;font-size:9.5pt;font-weight:600;color:var(--gold);letter-spacing:.06em;margin-bottom:5mm}
.cover .kicker::before{content:"";width:12mm;height:.5mm;background:var(--gold)}
.cover h1{font-size:30pt;font-weight:700;line-height:1.3;letter-spacing:-.005em;max-width:160mm}
.cover h1 em{font-style:normal;color:var(--gold)}
.cover .lead{margin-top:6mm;font-size:11pt;line-height:1.95;color:hsl(40 30% 94% / .86);max-width:158mm}
.cover .badges{display:flex;gap:3mm;margin-top:7mm;flex-wrap:wrap}
.cover .badges li{display:inline-flex;align-items:center;gap:2.2mm;border:.3mm solid hsl(40 30% 94% / .28);background:hsl(40 30% 94% / .06);border-radius:10mm;padding:1.6mm 4mm 1.6mm 3mm;font-size:9pt;font-weight:500}
.cover .badges svg{width:4mm;height:4mm;color:var(--gold)}
.cover .toc{position:absolute;right:20mm;left:16mm;top:211mm}
.cover .toc h2{font-size:9.5pt;font-weight:600;color:var(--gold);letter-spacing:.08em;display:flex;align-items:center;gap:3mm;margin-bottom:3mm}
.cover .toc h2::after{content:"";flex:1;border-top:.25mm solid hsl(38 72% 52% / .35)}
.cover .toc ol{display:grid;grid-template-columns:1fr 1fr;gap:2mm 10mm}
.cover .toc li{display:flex;align-items:baseline;gap:2.4mm;font-size:8.8pt;line-height:1.5;color:hsl(40 30% 94% / .9)}
.cover .toc li i{flex:none;font-style:normal;font-family:'Readex Pro',sans-serif;font-weight:700;color:var(--gold);font-size:9pt;width:5mm;text-align:center}
.cover .toc li i.dia::before{content:"";display:inline-block;width:2.2mm;height:2.2mm;background:var(--gold);transform:rotate(45deg)}
.cover .toc li .t{white-space:nowrap}
.cover .toc li .dots{flex:1;min-width:6mm;border-bottom:.3mm dotted hsl(40 30% 94% / .35);transform:translateY(-1.4mm)}
.cover .toc li b{font-family:'Readex Pro',sans-serif;font-weight:600;color:hsl(40 30% 94% / .85);font-size:9pt;min-width:5mm;text-align:left}
.cover .foot{position:absolute;bottom:0;right:7mm;left:0;height:24mm;background:var(--cream);color:var(--ink);display:flex;align-items:center;justify-content:space-between;padding:0 13mm 0 16mm}
.cover .foot p{font-size:8.6pt;color:var(--muted);line-height:1.6;max-width:95mm}
.cover .foot p b{display:block;color:var(--navy);font-weight:600}
.cover .foot img{height:10mm;width:auto}

/* ---------- closing ---------- */
.thanks{position:relative;overflow:hidden;border-radius:3mm;background:linear-gradient(160deg,hsl(206 62% 15%),hsl(196 60% 11%));color:hsl(40 30% 94%);padding:9mm 9mm 8mm;text-align:center}
.thanks::before{content:"";position:absolute;inset:0;background-image:url("data:image/svg+xml,${GRID_TILE}");background-size:7.4mm 7.4mm;opacity:.9;
  -webkit-mask-image:radial-gradient(90mm 50mm at 50% 100%,#000,transparent 75%);mask-image:radial-gradient(90mm 50mm at 50% 100%,#000,transparent 75%)}
.thanks>*{position:relative}
.thanks .orn{display:flex;justify-content:center;gap:1.4mm;margin-bottom:5mm}
.thanks .orn i{width:2.6mm;height:2.6mm;background:var(--gold);transform:rotate(45deg);display:block;opacity:.9}
.thanks .orn i:nth-child(2){opacity:.6}.thanks .orn i:nth-child(3){opacity:.35}
.thanks h2{font-size:19pt;font-weight:600;line-height:1.5;max-width:140mm;margin:0 auto}
.thanks p{margin-top:4mm;font-size:10pt;color:var(--gold);font-weight:500}
.thanks .logos{margin-top:8mm;display:flex;align-items:center;justify-content:center;gap:9mm;padding-top:6mm;border-top:.3mm solid hsl(40 30% 94% / .18)}
.thanks .logos .round{width:20mm;height:20mm;border-radius:50%;background:#fff;padding:1.2mm;box-shadow:0 0 0 1mm hsl(38 72% 52% / .5)}
.thanks .logos .round img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.thanks .logos .plate{background:var(--cream);border-radius:2.4mm;padding:3mm 5mm}
.thanks .logos .plate img{height:9mm;width:auto}
.thanks .logos .sep{width:.3mm;height:16mm;background:hsl(40 30% 94% / .25)}
`;
}

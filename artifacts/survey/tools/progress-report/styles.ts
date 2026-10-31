/**
 * Print stylesheet for the progress report: fixed A4 pages in the study's
 * navy-and-gold identity, laid out as a formal letter followed by four brief
 * status pages.
 */

const SADU_TILE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'>` +
    `<path d='M10 1.5 L18.5 10 L10 18.5 L1.5 10 Z' fill='none' stroke='#dd9c2c' stroke-width='1.3'/>` +
    `<path d='M10 6.2 L13.8 10 L10 13.8 L6.2 10 Z' fill='#dd9c2c'/>` +
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
  --navy:hsl(206 62% 17%);--navy-2:hsl(196 60% 11%);--navy-soft:hsl(206 62% 17% / .07);
  --gold:hsl(38 72% 52%);--gold-deep:hsl(32 70% 36%);--gold-soft:hsl(38 72% 52% / .14);
  --teal:hsl(178 45% 32%);--teal-soft:hsl(178 45% 32% / .12);
  --clay:hsl(14 60% 45%);--clay-soft:hsl(14 60% 52% / .13);
  --paper:hsl(40 33% 97%);--card:#fff;--ink:hsl(206 55% 13%);--muted:hsl(206 18% 42%);
  --line:hsl(206 22% 85%);--line-soft:hsl(206 22% 91%);
}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;color:var(--ink);font-size:10pt;line-height:1.75;direction:rtl;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
h1,h2,h3,.display{font-family:'Readex Pro','IBM Plex Sans Arabic',sans-serif;margin:0}
p,ul,ol,dl,dd{margin:0;padding:0}
ul,ol{list-style:none}
img{display:block}
table{border-collapse:collapse;width:100%}
.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
.num{font-family:'Readex Pro',sans-serif;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}

/* ---------- page shell ---------- */
.page{position:relative;width:210mm;height:297mm;overflow:hidden;background:var(--paper);break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.spine{position:absolute;top:0;bottom:0;right:0;width:5mm;background:var(--navy)}
.spine::after{content:"";position:absolute;inset:0;background-image:url("data:image/svg+xml,${SADU_TILE}");background-size:4.2mm 4.2mm;background-position:center top;background-repeat:repeat-y;opacity:.85}
.run-head{position:absolute;top:9mm;right:16mm;left:14mm;height:8mm;display:flex;align-items:center;justify-content:space-between;
  border-bottom:.3mm solid var(--line);padding-bottom:1.5mm;font-size:8.2pt;color:var(--muted)}
.run-head .rh-title{display:flex;align-items:center;gap:2mm;font-weight:600;color:var(--navy)}
.run-head .rh-title::before{content:"";width:2.4mm;height:2.4mm;background:var(--gold);transform:rotate(45deg);display:inline-block}
.run-head img{height:5mm;width:auto}
.sheet{position:absolute;top:23mm;right:16mm;left:14mm;bottom:19mm}
.run-foot{position:absolute;bottom:7mm;right:16mm;left:14mm;height:9mm;display:flex;align-items:center;justify-content:space-between;
  border-top:.3mm solid var(--line);padding-top:1.5mm;font-size:7.8pt;color:var(--muted)}
.run-foot .pageno{display:flex;align-items:center;gap:1.5mm;font-family:'Readex Pro',sans-serif;font-weight:600;color:var(--navy);font-size:8.5pt}
.run-foot .pageno i{width:5.5mm;height:5.5mm;background:var(--navy);color:var(--gold);display:inline-flex;align-items:center;justify-content:center;font-style:normal;border-radius:1mm;font-size:8pt}

/* ---------- letter page ---------- */
.letter .sheet{top:16mm;bottom:19mm}
.letterhead{display:flex;align-items:center;justify-content:space-between;gap:6mm;padding-bottom:4mm;border-bottom:.5mm solid var(--navy);position:relative}
.letterhead::after{content:"";position:absolute;right:0;bottom:-1.4mm;width:38mm;height:.6mm;background:var(--gold)}
.letterhead .asia img{height:15mm;width:auto}
.letterhead .asia span{display:block;margin-top:1.4mm;font-size:8pt;color:var(--muted);line-height:1.5}
.letterhead .client{display:flex;align-items:center;gap:3.5mm;direction:rtl;text-align:right}
.letterhead .client img{width:19mm;height:19mm;border-radius:50%;object-fit:contain;background:#fff;padding:.5mm;box-shadow:0 0 0 .7mm #fff,0 0 0 1.1mm hsl(38 72% 52% / .55)}
.letterhead .client strong{display:block;font-family:'Readex Pro',sans-serif;font-size:10.5pt;font-weight:600;color:var(--navy);line-height:1.45}
.letterhead .client span{display:block;font-size:8.2pt;color:var(--muted);line-height:1.5}
.meta{display:flex;justify-content:space-between;align-items:center;margin-top:6mm;font-size:9pt;color:var(--muted)}
.meta b{color:var(--navy);font-weight:600}
.addressee{margin-top:7mm}
.addressee .to{display:flex;justify-content:space-between;align-items:baseline;font-size:12.5pt;font-weight:700;color:var(--navy)}
.addressee .to em{font-style:normal;font-weight:600;font-size:11pt}
.addressee p{font-size:10.5pt;line-height:1.7}
.greeting{margin-top:6mm;font-weight:600;font-size:10.5pt}
.subject{margin-top:4mm;background:var(--navy-soft);border-right:1mm solid var(--gold);padding:3mm 4mm;font-size:9.8pt;font-weight:600;line-height:1.75;color:var(--navy);border-radius:1.5mm}
.body{margin-top:5mm}
.body p{font-size:10.4pt;line-height:1.95;text-align:justify}
.body p+p{margin-top:3mm}
.closing{margin-top:5mm;font-size:10.4pt;font-weight:600}
.signature{margin-top:14mm;display:grid;grid-template-columns:1fr auto;align-items:end;gap:6mm}
.signature .sig{text-align:right}
.signature .sig .line{width:52mm;border-top:.35mm solid var(--navy);margin-bottom:2mm}
.signature .sig strong{display:block;font-family:'Readex Pro',sans-serif;font-size:12pt;font-weight:700;color:var(--navy)}
.signature .sig span{display:block;font-size:9.2pt;color:var(--muted);line-height:1.6}
.contents{background:var(--card);border:.3mm solid var(--line);border-radius:2.5mm;padding:3.5mm 4.5mm;width:78mm}
.contents h3{font-size:8.2pt;letter-spacing:.1em;color:var(--gold-deep);font-weight:700;margin-bottom:2mm}
.contents li{display:flex;gap:2.5mm;align-items:flex-start;font-size:8.6pt;line-height:1.5;padding:1.2mm 0;border-top:.2mm dashed var(--line-soft)}
.contents li:first-of-type{border-top:0}
.contents li i{flex:none;width:5mm;height:5mm;border-radius:1.2mm;background:var(--navy);color:var(--gold);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-family:'Readex Pro',sans-serif;font-weight:700;font-size:8pt;margin-top:.5mm}
.contents li small{display:block;color:var(--muted);font-size:7.6pt}
/* timeline */
.timeline{position:relative;display:grid;grid-template-columns:repeat(7,1fr);gap:2mm;margin-top:3mm;padding-top:1mm}
.timeline::before{content:"";position:absolute;top:2.4mm;right:7%;left:7%;height:.4mm;background:var(--line)}
.ms{position:relative;text-align:center;padding:5.5mm 1mm 0}
.ms::before{content:"";position:absolute;top:1mm;left:50%;width:2.8mm;height:2.8mm;margin-left:-1.4mm;background:var(--gold);transform:rotate(45deg);box-shadow:0 0 0 .7mm var(--card)}
.ms:last-child::before{background:var(--navy)}
.ms b{display:block;font-family:'Readex Pro',sans-serif;font-size:8.6pt;font-weight:700;color:var(--navy);line-height:1.3}
.ms span{display:block;font-size:7.5pt;color:var(--muted);line-height:1.45;margin-top:.8mm}

/* ---------- section band ---------- */
.band{position:relative;overflow:hidden;border-radius:3mm;background:linear-gradient(160deg,hsl(206 62% 15%),hsl(196 60% 11%));color:hsl(40 30% 94%);
  padding:4.5mm 6mm;margin-bottom:5mm;display:grid;grid-template-columns:auto 1fr;gap:5mm;align-items:center}
.band::after{content:"";position:absolute;left:0;top:0;bottom:0;width:9mm;background-image:url("data:image/svg+xml,${SADU_TILE}");background-size:4.5mm 4.5mm;background-repeat:repeat;opacity:.35}
.band .kicker{font-family:'Readex Pro',sans-serif;font-weight:700;font-size:20pt;color:var(--gold);line-height:1;border-left:.4mm solid hsl(38 72% 52% / .5);padding-left:5mm}
.band h2{font-size:15pt;font-weight:600;line-height:1.35}
.band p{font-size:8.8pt;color:hsl(40 30% 94% / .78);margin-top:1mm;line-height:1.6}

/* ---------- blocks ---------- */
.card{background:var(--card);border:.3mm solid var(--line);border-radius:3mm;padding:4mm 4.5mm}
.card h3{font-size:11pt;font-weight:600;color:var(--navy);line-height:1.4}
.card .sub{font-size:8.4pt;color:var(--muted);line-height:1.6;margin-top:.5mm}
.grid{display:grid;gap:4mm}
.cols-2{grid-template-columns:1fr 1fr}
.cols-3{grid-template-columns:1fr 1fr 1fr}
.cols-4{grid-template-columns:repeat(4,1fr)}
.mt{margin-top:4mm}
.note{display:flex;gap:2mm;align-items:flex-start;font-size:8pt;color:var(--muted);line-height:1.6;margin-top:3.5mm}
.note::before{content:"";flex:none;width:2.2mm;height:2.2mm;background:var(--gold);transform:rotate(45deg);margin-top:1.6mm}

/* kpi tiles */
.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:3mm}
.kpi{background:var(--card);border:.3mm solid var(--line);border-radius:2.5mm;padding:3.2mm 3mm 2.8mm;text-align:center;position:relative;overflow:hidden}
.kpi::before{content:"";position:absolute;top:0;right:0;left:0;height:1mm;background:var(--gold)}
.kpi b{display:block;font-family:'Readex Pro',sans-serif;font-size:19pt;font-weight:700;color:var(--navy);line-height:1.15;direction:ltr}
.kpi span{display:block;font-size:8.8pt;font-weight:600;color:var(--ink);margin-top:.8mm;line-height:1.4}
.kpi small{display:block;font-size:6.9pt;color:var(--muted);line-height:1.45;margin-top:.8mm}

/* status board */
.board th{font-size:8.2pt;font-weight:600;color:var(--muted);text-align:right;padding:0 2.5mm 1.8mm;border-bottom:.3mm solid var(--line)}
.board td{padding:2.1mm 2.5mm;border-bottom:.2mm solid var(--line-soft);vertical-align:top;font-size:8.8pt;line-height:1.55}
.board tr:last-child td{border-bottom:0}
.board .n{width:8mm}
.board .n i{width:6.2mm;height:6.2mm;border-radius:1.4mm;background:var(--navy);color:var(--gold);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-family:'Readex Pro',sans-serif;font-weight:700;font-size:8.5pt}
.board .t{width:52mm;font-weight:600;color:var(--navy)}
.board .d{color:var(--ink)}
.board .s{width:23mm;text-align:left}
.pill{display:inline-flex;align-items:center;gap:1.4mm;border-radius:10mm;padding:.5mm 2.6mm .5mm 2.8mm;font-size:7.6pt;font-weight:700;white-space:nowrap;line-height:1.7}
.pill::before{content:"";width:1.8mm;height:1.8mm;border-radius:50%;background:currentColor}
.pill.done{background:var(--teal-soft);color:var(--teal)}
.pill.advanced{background:hsl(178 45% 32% / .08);color:var(--teal)}
.pill.active{background:var(--gold-soft);color:var(--gold-deep)}
.pill.started{background:hsl(38 72% 52% / .08);color:var(--gold-deep)}
.pill.upcoming{background:hsl(206 22% 90%);color:var(--muted)}
.pill.partial{background:var(--gold-soft);color:var(--gold-deep)}
.pill.progress{background:var(--teal-soft);color:var(--teal)}
.legend{display:flex;gap:3mm;flex-wrap:wrap;justify-content:flex-start;margin-top:3mm;font-size:7.8pt;color:var(--muted)}

/* deliverable cards */
.deliv{position:relative;padding-right:12mm}
.deliv .badge{position:absolute;top:4mm;right:4mm;width:6.8mm;height:6.8mm;border-radius:1.6mm;background:var(--navy);color:var(--gold);display:flex;align-items:center;justify-content:center;font-family:'Readex Pro',sans-serif;font-weight:700;font-size:10pt}
.deliv .meta-row{display:flex;gap:2mm;flex-wrap:wrap;margin-top:1.6mm}
.deliv .chip{font-size:7.3pt;font-weight:600;color:var(--gold-deep);background:var(--gold-soft);border-radius:10mm;padding:0 2.4mm;line-height:1.8}
.deliv .chip.navy{color:#fff;background:var(--navy)}
.deliv ul{margin-top:2.2mm}
.deliv li{display:flex;gap:2mm;font-size:8.5pt;line-height:1.55;padding:.6mm 0}
.deliv li::before{content:"";flex:none;width:1.8mm;height:1.8mm;background:var(--gold);transform:rotate(45deg);margin-top:2.1mm}
.deliv .maps{margin-top:2mm;padding-top:1.8mm;border-top:.2mm dashed var(--line);font-size:7.9pt;color:var(--muted)}
.deliv .maps b{color:var(--navy);font-weight:600}

/* mapping table */
.map th{font-size:8.2pt;font-weight:600;color:var(--muted);text-align:right;padding:0 2.5mm 1.8mm;border-bottom:.3mm solid var(--line)}
.map td{padding:2mm 2.5mm;border-bottom:.2mm solid var(--line-soft);vertical-align:top;font-size:8.6pt;line-height:1.55}
.map tr:last-child td{border-bottom:0}
.map .d{width:62mm;font-weight:600;color:var(--navy)}
.map .s{width:24mm}

/* field page */
.split{display:grid;grid-template-columns:1.15fr 1fr;gap:4mm}
.big{display:flex;align-items:baseline;gap:3mm}
.big b{font-family:'Readex Pro',sans-serif;font-size:26pt;font-weight:700;color:var(--navy);line-height:1;direction:ltr}
.big span{font-size:9pt;color:var(--muted)}
.bar{display:flex;height:5.5mm;border-radius:1.4mm;overflow:hidden;margin-top:3mm;direction:rtl}
.bar i{display:flex;align-items:center;justify-content:center;font-style:normal;font-family:'Readex Pro',sans-serif;font-size:7.6pt;font-weight:700;color:#fff}
.bar .b2b{background:var(--navy)}
.bar .b2c{background:var(--gold);color:var(--navy-2)}
.bar-legend{display:flex;justify-content:space-between;font-size:7.8pt;color:var(--muted);margin-top:1.2mm}
.rows{margin-top:3mm}
.rows li{display:grid;grid-template-columns:1fr 46mm 11mm;align-items:center;gap:2.5mm;font-size:8.4pt;padding:1mm 0;border-top:.2mm dashed var(--line-soft)}
.rows li:first-child{border-top:0}
.rows .track{height:2.6mm;border-radius:1mm;background:var(--navy-soft);overflow:hidden;direction:rtl}
.rows .track i{display:block;height:100%;background:var(--navy);border-radius:1mm}
.rows .v{font-family:'Readex Pro',sans-serif;font-weight:600;font-size:8.2pt;color:var(--navy);text-align:left;direction:ltr}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm;margin-top:3mm}
.fact{background:var(--navy-soft);border-radius:2mm;padding:2.2mm 3mm;text-align:center}
.fact b{display:block;font-family:'Readex Pro',sans-serif;font-size:14pt;font-weight:700;color:var(--navy);line-height:1.2;direction:ltr}
.fact span{display:block;font-size:7.6pt;color:var(--muted);line-height:1.4}
.ticks{margin-top:3mm}
.ticks li{display:flex;gap:2mm;font-size:8.4pt;line-height:1.55;padding:.7mm 0}
.ticks li::before{content:"";flex:none;width:1.8mm;height:1.8mm;background:var(--teal);transform:rotate(45deg);margin-top:2.1mm}
.fg-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;margin-top:3mm}
.analyses{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:1mm}
.analysis{background:var(--card);border:.3mm solid var(--line);border-radius:2.5mm;padding:3mm 3.2mm;position:relative}
.analysis i{position:absolute;top:0;right:0;width:7mm;height:1mm;background:var(--gold);border-radius:0 3mm 0 1mm}
.analysis h4{margin:0;font-family:'Readex Pro',sans-serif;font-size:9.2pt;font-weight:600;color:var(--navy);line-height:1.4}
.analysis p{font-size:7.7pt;color:var(--muted);line-height:1.55;margin-top:1mm}

/* next steps page */
.steps li{display:grid;grid-template-columns:8mm 1fr;gap:2.5mm;align-items:start;font-size:9pt;line-height:1.6;padding:1.7mm 0;border-top:.2mm dashed var(--line-soft)}
.steps li:first-child{border-top:0}
.steps li i{width:6.8mm;height:6.8mm;border-radius:1.5mm;background:var(--navy);color:var(--gold);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-family:'Readex Pro',sans-serif;font-weight:700;font-size:8.6pt}
.steps li small{display:block;font-size:7.6pt;color:var(--muted)}
.asks li{display:flex;gap:3mm;padding:2.2mm 0;border-top:.2mm dashed var(--line-soft);align-items:flex-start}
.asks li:first-child{border-top:0}
.asks li i{flex:none;width:6mm;height:6mm;border-radius:50%;background:var(--gold-soft);color:var(--gold-deep);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-family:'Readex Pro',sans-serif;font-weight:700;font-size:8.2pt;margin-top:.6mm}
.asks li b{display:block;font-size:9.2pt;font-weight:600;color:var(--navy);line-height:1.5}
.asks li span{display:block;font-size:8.3pt;color:var(--ink);line-height:1.6}
.callout{background:linear-gradient(160deg,hsl(206 62% 15%),hsl(196 60% 11%));color:hsl(40 30% 94%);border-radius:3mm;padding:4.5mm 6mm;display:grid;grid-template-columns:1fr auto;gap:6mm;align-items:center}
.callout h3{font-size:12pt;font-weight:600;color:#fff;line-height:1.5}
.callout p{font-size:8.8pt;line-height:1.7;color:hsl(40 30% 94% / .8);margin-top:1mm}
.callout .who{text-align:left;direction:rtl;border-right:.4mm solid hsl(38 72% 52% / .6);padding-right:5mm}
.callout .who strong{display:block;font-family:'Readex Pro',sans-serif;font-size:11pt;color:var(--gold)}
.callout .who span{display:block;font-size:8.2pt;color:hsl(40 30% 94% / .8);line-height:1.6}
.callout .who .ltr{color:hsl(40 30% 94% / .8)}
`;
}

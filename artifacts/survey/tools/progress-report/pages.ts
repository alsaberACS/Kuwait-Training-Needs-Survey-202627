/**
 * Page composition for the progress report: a formal cover letter followed by
 * four brief status pages (executive position, deliverables vs contract,
 * field work and analysis, next steps).
 */
import {
  REPORT, SENDER, RECIPIENT, LETTER, KPIS, PHASES, STATUS_LABEL, DELIVERED, CONTRACT_MAP, MAP_LABEL,
  FIELD, FOCUS, ANALYSES, NEXT_STEPS, REQUESTS, MILESTONES,
} from "./content.ts";

export interface Assets { emblem: string; asia: string }
export interface Page { id: string; html: string }

const PAGE_ORDER = ["letter", "status", "deliverables", "field", "next"] as const;
export const TOTAL_PAGES = PAGE_ORDER.length;
type PageId = (typeof PAGE_ORDER)[number];
const pageNo = (id: PageId) => PAGE_ORDER.indexOf(id) + 1;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num = (n: number) => n.toLocaleString("en-US");
const pct = (n: number, of: number) => Math.round((n / of) * 100);

function shell(id: PageId, body: string, assets: Assets, opts: { cls?: string; runHead?: boolean; footLeft?: string } = {}): Page {
  const n = pageNo(id);
  const head = opts.runHead === false ? "" : `
  <div class="run-head">
    <span class="rh-title">${esc(REPORT.reportTitle)} · ${esc(REPORT.dateLabel)}</span>
    <img src="${assets.asia}" alt="ASIA">
  </div>`;
  const footLeft = opts.footLeft ?? `${esc(SENDER.company)} ← ${esc(RECIPIENT.org)} · العقد <span class="num">${esc(REPORT.contractRef)}</span>`;
  return {
    id,
    html: `<section class="page ${opts.cls ?? ""}" id="${id}">
  <div class="spine"></div>${head}
  <div class="sheet">${body}</div>
  <div class="run-foot">
    <span>${footLeft}</span>
    <span class="pageno"><i>${n}</i> من ${TOTAL_PAGES}</span>
  </div>
</section>`,
  };
}

function band(n: number, title: string, lead: string): string {
  return `<header class="band"><div class="kicker">0${n}</div><div><h2>${esc(title)}</h2><p>${esc(lead)}</p></div></header>`;
}

/* ---------- page 1: cover letter ---------- */
function letter(assets: Assets): Page {
  const body = `
<div class="letterhead">
  <div class="asia"><img src="${assets.asia}" alt="ASIA Data-Science"><span>${esc(SENDER.company)}</span></div>
  <div class="client">
    <div><strong>${esc(RECIPIENT.org)}</strong><span>${esc(RECIPIENT.centre)}</span></div>
    <img src="${assets.emblem}" alt="${esc(RECIPIENT.centre)}">
  </div>
</div>
<div class="meta">
  <span>المرجع: العقد رقم <b class="num">${esc(REPORT.contractRef)}</b></span>
  <span>التاريخ: <b>${esc(REPORT.dateLabel)}</b></span>
</div>
<div class="addressee">
  <div class="to"><span>${esc(RECIPIENT.salutation)}</span><em>${esc(RECIPIENT.honorific)}</em></div>
  <p>${esc(RECIPIENT.role)}</p>
  <p>${esc(RECIPIENT.org)}</p>
</div>
<p class="greeting">${esc(LETTER.greeting)}</p>
<p class="subject">${esc(LETTER.subject)}</p>
<div class="body">${LETTER.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
<p class="closing">${esc(LETTER.closing)}</p>
<div class="signature">
  <div class="sig">
    <div class="line"></div>
    <strong>${esc(SENDER.name)}</strong>
    <span>${esc(SENDER.role)}</span>
    <span>${esc(SENDER.company)}</span>
  </div>
  <aside class="contents">
    <h3>محتويات التقرير</h3>
    <ol>${LETTER.contents.map((c) => `<li><i>${c.n}</i><div>${esc(c.title)}<small>${esc(c.sub)}</small></div></li>`).join("")}</ol>
  </aside>
</div>`;
  return shell("letter", body, assets, {
    cls: "letter", runHead: false,
    footLeft: `${esc(SENDER.address)} · هاتف <span class="num">${esc(SENDER.phone)}</span> · <span class="ltr">${esc(SENDER.email)}</span>`,
  });
}

/* ---------- page 2: executive position ---------- */
function status(assets: Assets): Page {
  const body = `
${band(1, "الموقف التنفيذي في لمحة", `حصيلة الفترة ${REPORT.periodLabel} مقابل مراحل العقد العشر (المادة 3).`)}
<div class="kpis">${KPIS.map((k) => `<div class="kpi"><b>${esc(k.value)}</b><span>${esc(k.label)}</span><small>${esc(k.hint)}</small></div>`).join("")}</div>
<div class="card mt">
  <h3>لوحة حالة المراحل</h3>
  <p class="sub">الحالة تصف اكتمال المخرج التعاقدي لكل مرحلة لا نسبة زمنية؛ ويجيز العقد التداخل بين المراحل وفق طبيعة الأعمال.</p>
  <table class="board" style="margin-top:3mm">
    <thead><tr><th class="n">#</th><th class="t">المرحلة</th><th class="d">أبرز ما أُنجز</th><th class="s">الحالة</th></tr></thead>
    <tbody>${PHASES.map((p) => `<tr><td class="n"><i>${p.n}</i></td><td class="t">${esc(p.title)}</td><td class="d">${esc(p.done)}</td><td class="s"><span class="pill ${p.status}">${STATUS_LABEL[p.status]}</span></td></tr>`).join("")}</tbody>
  </table>
  <div class="legend">
    <span class="pill done">مكتملة</span><span class="pill advanced">متقدمة: المخرج شبه مكتمل</span><span class="pill active">قيد التنفيذ</span><span class="pill started">بدأت</span><span class="pill upcoming">لاحقة</span>
  </div>
</div>`;
  return shell("status", body, assets);
}

/* ---------- page 3: deliverables vs contract ---------- */
function deliverables(assets: Assets): Page {
  const cards = DELIVERED.map((d) => `
<article class="card deliv">
  <div class="badge">${d.n}</div>
  <h3>${esc(d.title)}</h3>
  <div class="meta-row"><span class="chip navy">${esc(d.phase)}</span><span class="chip">${esc(d.date)}</span><span class="chip"><span class="num">${d.pages}</span> صفحة</span></div>
  <ul>${d.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
  <p class="maps"><b>مخرج العقد المقابل:</b> ${esc(d.maps)}</p>
</article>`).join("");
  const body = `
${band(2, "المخرجات المسلّمة مقابل مخرجات العقد", "أربع وثائق سُلّمت إلى الغرفة، ثم موقع كل مخرج من قائمة «المخرجات المسلّمة» في المادة 3.")}
<div class="grid cols-2">${cards}</div>
<div class="card mt">
  <h3>مصفوفة المطابقة مع مخرجات العقد</h3>
  <table class="map" style="margin-top:3mm">
    <thead><tr><th class="d">مخرج العقد</th><th class="s">الحالة</th><th>ما يسنده حتى الآن</th></tr></thead>
    <tbody>${CONTRACT_MAP.map((m) => `<tr><td class="d">${esc(m.deliverable)}</td><td class="s"><span class="pill ${m.status}">${MAP_LABEL[m.status]}</span></td><td>${esc(m.evidence)}</td></tr>`).join("")}</tbody>
  </table>
</div>`;
  return shell("deliverables", body, assets);
}

/* ---------- page 4: field work and analysis ---------- */
function field(assets: Assets): Page {
  const b2bShare = pct(FIELD.b2b, FIELD.completed);
  const maxSector = Math.max(...FIELD.sectors.map((s) => s.n));
  const body = `
${band(3, "العمل الميداني والتحليل", "ما جُمع عبر المنصة الإلكترونية والمجموعات البؤرية، وما بُني عليه في لوحة التحكم التفاعلية.")}
<div class="split">
  <section class="card">
    <h3>الاستبانة الإلكترونية</h3>
    <p class="sub">إطلاقها في ${esc(FIELD.launched)}؛ الأرقام حتى ${esc(FIELD.cutoff)}.</p>
    <div class="big" style="margin-top:2.5mm"><b>${num(FIELD.completed)}</b><span>استجابة مكتملة، إضافةً إلى <span class="num">${num(FIELD.drafts)}</span> استجابة جزئية</span></div>
    <div class="bar"><i class="b2b" style="width:${b2bShare}%">${b2bShare}%</i><i class="b2c" style="width:${100 - b2bShare}%">${100 - b2bShare}%</i></div>
    <div class="bar-legend"><span>المؤسسات وأصحاب العمل (B2B): <span class="num">${num(FIELD.b2b)}</span></span><span>الأفراد (B2C): <span class="num">${num(FIELD.b2c)}</span></span></div>
    <ul class="rows">${FIELD.sectors.map((s) => `<li><span>${esc(s.label)}</span><span class="track"><i style="width:${Math.round((s.n / maxSector) * 100)}%"></i></span><span class="v">${num(s.n)}</span></li>`).join("")}</ul>
    <div class="facts">
      <div class="fact"><b>${FIELD.kuwaitiShare}%</b><span>من المستجيبين كويتيون</span></div>
      <div class="fact"><b>${FIELD.femaleShare}%</b><span>من المستجيبين إناث</span></div>
    </div>
    <ul class="ticks">${FIELD.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
  </section>
  <div class="grid" style="align-content:start">
    <section class="card">
      <h3>المجموعات البؤرية</h3>
      <p class="sub">${esc(FOCUS.languages)}؛ تحليل نوعي مستقل عن الاستبانة.</p>
      <div class="fg-stats">
        <div class="fact"><b>${FOCUS.sessions}</b><span>جلسات</span></div>
        <div class="fact"><b>${FOCUS.themes}</b><span>موضوعاً مرمّزاً</span></div>
        <div class="fact"><b>${FOCUS.excerpts}</b><span>مقتطفاً موثقاً</span></div>
      </div>
      <p style="margin-top:2.5mm;font-size:8.6pt;line-height:1.65"><b style="color:var(--navy)">${FOCUS.shared}</b> احتياجات مشتركة ظهرت صراحةً في المجموعات الثلاث، إلى جانب احتياجات خاصة بكل مجموعة.</p>
      <p class="note">${esc(FOCUS.note)}</p>
    </section>
    <section class="card">
      <h3>لوحة التحكم التفاعلية</h3>
      <p class="sub">منصة محمية بمفتاح وصول لفريق الدراسة والغرفة؛ 13 فصلاً تحليلياً يُحدَّث تلقائياً مع كل استجابة جديدة، مع تصدير كامل للبيانات.</p>
      <p class="note">عينة طوعية؛ تُقرأ النتائج وصفياً وتُفصل الشرائح الصغيرة دون تعميم إحصائي.</p>
    </section>
  </div>
</div>
<div class="card mt">
  <h3>أنواع التحليل المنجزة</h3>
  <div class="analyses mt" style="margin-top:3mm">${ANALYSES.map((a) => `<div class="analysis"><i></i><h4>${esc(a.title)}</h4><p>${esc(a.text)}</p></div>`).join("")}</div>
</div>`;
  return shell("field", body, assets);
}

/* ---------- page 5: next steps ---------- */
function next(assets: Assets): Page {
  const body = `
${band(4, "الخطوات التالية ومتطلبات التنسيق", "ما سيُنجز في المراحل المتبقية، وما نرجو من الغرفة التكرّم بتيسيره وفق المادة 7 من العقد.")}
<div class="split">
  <section class="card">
    <h3>ما سيُنجز تالياً</h3>
    <p class="sub">بحسب ترتيب مراحل العقد؛ المواعيد التفصيلية تُعتمد بالاتفاق مع الغرفة.</p>
    <ol class="steps" style="margin-top:2.5mm">${NEXT_STEPS.map((s) => `<li><i>${s.phase}</i><div>${esc(s.text)}<small>المرحلة ${s.phase}</small></div></li>`).join("")}</ol>
  </section>
  <section class="card">
    <h3>ما نرجو من الغرفة التكرّم به</h3>
    <p class="sub">خمسة متطلبات تنسيقية تُسرّع استكمال المراحل المتبقية.</p>
    <ol class="asks" style="margin-top:2.5mm">${REQUESTS.map((r, i) => `<li><i>${i + 1}</i><div><b>${esc(r.title)}</b><span>${esc(r.text)}</span></div></li>`).join("")}</ol>
  </section>
</div>
<div class="card mt">
  <h3>محطات الفترة</h3>
  <ol class="timeline">${MILESTONES.map((m) => `<li class="ms"><b>${esc(m.date)}</b><span>${esc(m.text)}</span></li>`).join("")}</ol>
</div>
<div class="callout mt">
  <div>
    <h3>نشكر للغرفة ثقتها ودعمها المتواصل</h3>
    <p>يسعدنا عرض هذا التقرير ولوحة التحكم على سعادتكم أو من ترونه من فريق الغرفة في الموعد الذي يناسبكم، والإجابة عن أي استفسار بشأن المخرجات المسلّمة أو المراحل المتبقية.</p>
  </div>
  <div class="who">
    <strong>${esc(SENDER.name)}</strong>
    <span>${esc(SENDER.role)}</span>
    <span>${esc(SENDER.company)}</span>
    <span class="ltr">${esc(SENDER.email)} · ${esc(SENDER.phone)}</span>
  </div>
</div>`;
  return shell("next", body, assets);
}

export function buildPages(assets: Assets): Page[] {
  return [letter(assets), status(assets), deliverables(assets), field(assets), next(assets)];
}

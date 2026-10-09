/**
 * Page composition for the printable questionnaire.
 * Content is read straight from the live survey definition so the PDF always
 * mirrors the online questionnaire (same wording, options, tracks and courses).
 */
import {
  Q, Q5_SUB, SKILLS, TRACKS, COURSE_GROUPS, SURVEY_TITLE, SURVEY_INTRO, CONSENT_TEXT, CONTACT_INTRO,
  THANK_YOU_TEXT, THANK_YOU_SIGN, SECTION_TITLES, CONTACT_FIELDS, type Option,
} from "../../src/lib/survey-definition.ts";
import { SKILL_EXPLANATIONS } from "../../src/lib/survey-content.ts";

export interface Assets { alSagar: string; asia: string }
export interface Page { id: string; section: string; html: string }

/* Document order: the printed questionnaire shows both participant paths, so
   questions are numbered once, in reading order (the online form numbers per path). */
const ORDER = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q14", "Q15", "Q18",
  "Q19", "Q20", "Q21", "Q22", "Q24", "Q25G", "Q25", "Q26"] as const;
const N: Record<string, number> = Object.fromEntries(ORDER.map((id, i) => [id, i + 1]));

const PAGE_ORDER = ["cover", "guide", "s1a", "s1b", "s2a", "s2b", "s3", "s4a", "c1", "c2", "c3", "s5"] as const;
type PageId = (typeof PAGE_ORDER)[number];
const pageNo = (id: PageId) => PAGE_ORDER.indexOf(id) + 1;
export const TOTAL_PAGES = PAGE_ORDER.length;

const STUDY_SHORT = "استبانة الاحتياجات التدريبية في الكويت 2026/2027";
const ORG_MAIN = "مركز عبدالعزيز حمد الصقر للتنمية";
const ORG_PARENT = "غرفة تجارة وصناعة الكويت";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mk = (kind: "radio" | "check") => `<i class="mk ${kind}"></i>`;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const ICONS: Record<string, string> = {
  clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  shield: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>`,
  sparkles: `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>`,
  arrowLeft: `<path d="m15 18-6-6 6-6"/>`,
  chevronDown: `<path d="m6 9 6 6 6-6"/>`,
  info: `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,
  key: `<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>`,
  route: `<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>`,
  building: `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>`,
  user: `<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>`,
  pen: `<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>`,
};
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

type QType = "single" | "multi" | "scale" | "rank" | "courses";
function typePill(type: QType, max?: number): string {
  const label = type === "single" ? "إجابة واحدة"
    : type === "multi" ? (max ? `حتى ${max} إجابات` : "أكثر من إجابة")
    : type === "scale" ? "تقييم من 1 إلى 5"
    : type === "rank" ? "ترتيب من 1 إلى 6" : "علامة واحدة لكل دورة";
  const cls = type === "multi" ? "multi" : type === "scale" ? "scale" : "";
  return `<span class="q-type ${cls}">${label}</span>`;
}

function options(list: Option[], kind: "radio" | "check", cols = 2, extra?: (o: Option) => string, plain = false): string {
  return `<ul class="opts${plain ? " plain" : ""}" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${list.map((o) =>
    `<li>${mk(kind)}<span class="lbl">${esc(o.label)}${extra?.(o) ?? ""}${o.description ? `<small>${esc(o.description)}</small>` : ""}</span>${o.other ? `<span class="write"></span>` : ""}</li>`,
  ).join("")}</ul>`;
}

function qcard(opts: { qid: string; title?: string; type: QType; max?: number; hint?: string; body: string; cls?: string }): string {
  const q = Q[opts.qid as keyof typeof Q] as { text: string };
  return `<article class="q ${opts.cls ?? ""}" id="${opts.qid}">
    <div class="q-head"><span class="q-num">${N[opts.qid]}</span>
      <div class="q-title"><h3>${esc(opts.title ?? q.text)}</h3>${opts.hint ? `<p class="hint">${esc(opts.hint)}</p>` : ""}</div>
      ${typePill(opts.type, opts.max)}</div>
    ${opts.body}</article>`;
}

function band(kicker: string | null, title: string, note: string, tag?: string): string {
  return `<header class="band" style="${kicker ? "" : "grid-template-columns:1fr"}">
    ${kicker ? `<span class="kicker num-ltr">${kicker}</span>` : ""}
    <div><h2>${esc(title)}</h2><p>${esc(note)}</p></div>
    ${tag ? `<span class="tag">${esc(tag)}</span>` : ""}</header>`;
}

const note = (text: string, tone: "" | "teal" = "") => `<p class="note ${tone}">${text}</p>`;
const pageLink = (id: PageId) => `صفحة ${pageNo(id)}`;

/* ---------- shared blocks ---------- */
function matrix(qid: "Q14" | "Q18"): string {
  const q = Q[qid];
  const cells = (tone: "" | "perf") => range(1, 5).map((n) => `<td><span class="cell ${tone}">${n}</span></td>`).join("");
  return `
  <div class="legend">
    <div class="imp"><span><strong>الأهمية</strong>${esc(q.importance)}</span></div>
    <div class="perf"><span><strong>الأداء الحالي</strong>${esc(q.performance)}</span></div>
  </div>
  <table class="matrix">
    <thead>
      <tr><th></th><th class="skill"></th><th class="grp imp" colspan="5"><span>الأهمية</span></th><th class="gap"></th><th class="grp perf" colspan="5"><span>الأداء الحالي</span></th></tr>
      <tr><th>#</th><th class="skill">المهارة</th>
        <th colspan="5"><div class="scale-ends"><span>1 = ضعيف</span><span>5 = مهم جداً</span></div></th><th class="gap"></th>
        <th colspan="5"><div class="scale-ends"><span>1 = ضعيف</span><span>5 = ممتاز</span></div></th></tr>
    </thead>
    <tbody>${SKILLS.map((s, i) => `<tr><td class="idx">${i + 1}</td><td class="skill"><b>${esc(s.label)}</b><small>${esc(SKILL_EXPLANATIONS[s.id] ?? "")}</small></td>${cells("")}<td class="gap"></td>${cells("perf")}</tr>`).join("")}</tbody>
  </table>`;
}

const courseCount = (n: number) => n === 1 ? "دورة واحدة" : n === 2 ? "دورتان" : n <= 10 ? `${n} دورات` : `${n} دورة`;

function courseTable(groupId: string): string {
  const g = COURSE_GROUPS.find((x) => x.id === groupId)!;
  const levels = Q.Q25.levels;
  return `<table class="courses">
    <thead><tr>
      <th class="ghead" colspan="2"><div><i>${g.id}</i>${esc(g.label)}<em>${courseCount(g.courses.length)}</em></div></th>
      ${levels.map((l) => `<th>${esc(l)}</th>`).join("")}
    </tr></thead>
    <tbody>${g.courses.map((c) => `<tr><td class="cid">${c.id}</td><td>${esc(c.label)}</td>${levels.map(() => `<td class="c">${mk("radio")}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

const courseCont = () => `<p class="cont"><b>تابع السؤال ${N.Q25}</b> ${esc(Q.Q25.text)}</p>`;

/* ---------- pages ---------- */
function cover(a: Assets): string {
  const [titleHead] = SURVEY_TITLE.split("2026/2027");
  const toc: [string, string, PageId][] = [
    ["", "دليل الإجابة وإقرار الموافقة", "guide"],
    ["1", SECTION_TITLES.s1, "s1a"], ["2", SECTION_TITLES.s2, "s2a"], ["3", SECTION_TITLES.s3, "s3"],
    ["4", SECTION_TITLES.s4, "s4a"], ["5", SECTION_TITLES.s5, "s5"],
  ];
  return `<section class="page cover" id="cover">
    <div class="glow"></div><div class="mesh"></div><div class="edge"></div>
    <div class="top">
      <div class="medallion"><img src="${a.alSagar}" alt=""></div>
      <div class="org"><strong>${ORG_PARENT}</strong><span>${ORG_MAIN}</span><em>ABDULAZIZ H. AL SAGAR DEVELOPMENT CENTER</em></div>
    </div>
    <div class="main">
      <span class="kicker">دراسة وطنية · <span class="num-ltr">2026/2027</span></span>
      <h1>${esc(titleHead.trim())} <em class="num-ltr">2026/2027</em></h1>
      <p class="lead">${esc(SURVEY_INTRO)}</p>
      <ul class="badges">
        <li>${icon("clock")}5 إلى 7 دقائق</li>
        <li>${icon("shield")}إجابات سرية تماماً</li>
        <li>${icon("sparkles")}أسئلة تتكيف مع إجاباتك</li>
      </ul>
    </div>
    <div class="toc"><h2>محتويات الاستبانة</h2>
      <ol>${toc.map(([n, t, p]) => `<li>${n ? `<i>${n}</i>` : `<i class="dia"></i>`}<span class="t">${esc(t)}</span><span class="dots"></span><b>${pageNo(p)}</b></li>`).join("")}</ol>
    </div>
    <div class="foot">
      <p><b>نسخة مطبوعة من الاستبانة الإلكترونية</b>تُطرح الأسئلة بحسب مسار المشارك: مؤسسة أو فرد. جميع الإجابات سرية وتُستخدم للتحليل الإحصائي فقط.</p>
      <img src="${a.asia}" alt="ASIA Data-Science">
    </div>
  </section>`;
}

function guide(): string {
  const key = (demo: string, text: string) => `<li><span class="demo">${demo}</span><span>${text}</span></li>`;
  return `
  ${band(null, "قبل أن تبدأ: كيف تجيب عن الاستبانة؟", "دقيقة واحدة لفهم رموز الإجابة ومسار الأسئلة. لا توجد إجابات صحيحة أو خاطئة؛ ما يهمنا هو رأيك الصريح.", "دليل الاستبانة")}
  <div class="grid cols-2">
    <div class="card"><h3><span class="ic">${icon("info")}</span>بطاقة الدراسة</h3>
      <dl class="facts">
        <dt>الجهة</dt><dd>${ORG_MAIN} — ${ORG_PARENT}</dd>
        <dt>النطاق</dt><dd>دولة الكويت · دراسة وطنية <span class="num-ltr">2026/2027</span></dd>
        <dt>الوقت المتوقع</dt><dd>5 إلى 7 دقائق</dd>
        <dt>عدد الأسئلة</dt><dd>19 سؤالاً لمسار المؤسسات، و17 سؤالاً لمسار الأفراد</dd>
        <dt>السرية</dt><dd>الإجابات سرية تماماً وتُستخدم للتحليل الإحصائي وتطوير الأعمال فقط</dd>
      </dl>
    </div>
    <div class="card"><h3><span class="ic">${icon("key")}</span>رموز الإجابة</h3>
      <ul class="keys">
        ${key(mk("radio"), "اختر إجابة واحدة فقط")}
        ${key(mk("check") + mk("check"), "يمكنك اختيار أكثر من إجابة (قد يُحدَّد حد أقصى)")}
        ${key(range(1, 5).map((n) => `<span class="cell">${n}</span>`).join(""), "مقياس من 1 إلى 5: ضع دائرة حول الرقم المناسب")}
        ${key(`<span class="box"></span>`, "اكتب رقم الترتيب داخل المربع")}
        ${key(`<span class="write" style="width:14mm;flex:none"></span>`, "اكتب إجابتك على السطر")}
      </ul>
    </div>
    <div class="card span-2"><h3><span class="ic">${icon("route")}</span>مسار الأسئلة</h3>
      <div class="flow">
        <div class="step"><span class="n">1</span><div><b>${esc(SECTION_TITLES.s1)} — الأسئلة 1 إلى 7</b><span>يجيب عنها جميع المشاركين. السؤال 7 يحدد مسارك: مؤسسة أو فرد.</span></div></div>
        <div class="arrow">${icon("chevronDown")}</div>
        <div class="fork">
          <div class="step"><span class="n">2</span><div><b>${esc(SECTION_TITLES.s2)} — الأسئلة 8 إلى 11</b><span>لمن يجيب بصفته يمثل جهة عمله (صانع قرار، صاحب عمل، أو مسؤول تدريب).</span></div></div>
          <div class="step alt"><span class="n">3</span><div><b>${esc(SECTION_TITLES.s3)} — الأسئلة 12 و13</b><span>لمن يجيب بصفته يمثل نفسه (طالب، باحث عن عمل، أو موظف).</span></div></div>
        </div>
        <div class="arrow">${icon("chevronDown")}</div>
        <div class="step"><span class="n">4</span><div><b>${esc(SECTION_TITLES.s4)} — الأسئلة 14 إلى 21</b><span>يجيب عنها جميع المشاركين: التفضيلات، ترتيب المسارات، والدورات التي تهمك.</span></div></div>
        <div class="arrow">${icon("chevronDown")}</div>
        <div class="step"><span class="n">5</span><div><b>${esc(SECTION_TITLES.s5)}</b><span>اختياري تماماً، لمن يرغب في الحجز أو تلقي جدول الدورات القادمة.</span></div></div>
      </div>
    </div>
    <div class="card span-2"><h3><span class="ic">${icon("pen")}</span>إقرار الموافقة على المشاركة</h3>
      <div class="consent">${mk("check")}<div><b>أوافق</b>${esc(CONSENT_TEXT)}</div></div>
    </div>
  </div>`;
}

function s1a(): string {
  const sub = (title: string, list: Option[]) => `<div class="panel"><h4>${title}</h4>${options(list, "radio", 3, undefined, true)}</div>`;
  return `
  ${band("01", SECTION_TITLES.s1, "أسئلة قصيرة تساعدنا على فهم موقعك المهني. يجيب عنها جميع المشاركين.")}
  <div class="grid cols-2">
    ${qcard({ qid: "Q1", type: "single", body: options(Q.Q1.options, "radio", 2) })}
    ${qcard({ qid: "Q2", type: "single", body: options(Q.Q2.options, "radio", 2) })}
    ${qcard({ qid: "Q3", type: "single", body: options(Q.Q3.options, "radio", 1) })}
    ${qcard({ qid: "Q4", type: "single", body: options(Q.Q4.options, "radio", 1) })}
    ${qcard({ qid: "Q5", type: "single", cls: "span-2", hint: "إذا اخترت القطاع الخاص أو الحكومي، حدد المجال أو الجهة من القائمة المقابلة.",
      body: options(Q.Q5.options, "radio", 3) + `<div class="sub">
        ${sub("القطاع الخاص — حدد المجال", Q5_SUB.private)}
        ${sub("القطاع الحكومي — حدد الجهة", Q5_SUB.government)}
      </div>` })}
  </div>`;
}

function s1b(): string {
  const desc = Q.Q7.descriptions;
  const [b2b, b2c] = Q.Q7.options;
  const nextList = (ids: string[]) => `<ol>${ids.map((id) => `<li>${esc((Q[id as keyof typeof Q] as { text: string }).text)}</li>`).join("")}</ol>`;
  const goto = (text: string) => `<span class="goto">${esc(text)}${icon("arrowLeft")}</span>`;
  return `
  ${band("01", SECTION_TITLES.s1, "تابع: مستواك الوظيفي، ثم اختيار المسار الذي يحدد الأسئلة التالية.", "تابع")}
  <div class="stack">
    ${qcard({ qid: "Q6", type: "single", hint: "يُطرح هذا السؤال لمن يعمل حالياً. إذا اخترت «لا أعمل حالياً» في السؤال 5 فانتقل مباشرة إلى السؤال 7.",
      body: options(Q.Q6.options, "radio", 2, (o) => o.id === "owner" ? `<span class="chip">لقطاعي ريادة الأعمال وغير الربحي</span>` : "") })}
    ${qcard({ qid: "Q7", type: "single", hint: "اختيارك هنا يحدد الأسئلة التالية: أجب عن قسم واحد فقط من القسمين الثاني والثالث، ثم تابع إلى القسم الرابع.",
      body: `<div class="paths">
        <div class="path b2b"><span class="ribbon"></span>
          <div class="pt"><span class="pic">${icon("building")}</span><span class="code">B2B</span></div>
          <div class="ph">${mk("radio")}<div><h4>${esc(b2b.label)}</h4><p>${esc(desc.B2B)}</p></div></div>
          <div class="next"><strong>ما ستجيب عنه بعد ذلك (الأسئلة 8 إلى 11):</strong>${nextList(["Q8", "Q9", "Q10", "Q14"])}</div>
          ${goto(`انتقل إلى القسم الثاني — ${pageLink("s2a")}`)}
        </div>
        <div class="path b2c"><span class="ribbon"></span>
          <div class="pt"><span class="pic">${icon("user")}</span><span class="code">B2C</span></div>
          <div class="ph">${mk("radio")}<div><h4>${esc(b2c.label)}</h4><p>${esc(desc.B2C)}</p></div></div>
          <div class="next"><strong>ما ستجيب عنه بعد ذلك (السؤالان 12 و13):</strong>${nextList(["Q15", "Q18"])}</div>
          ${goto(`انتقل إلى القسم الثالث — ${pageLink("s3")}`)}
        </div>
      </div>` })}
    ${note(`مسار المؤسسات متاح لمن يعمل حالياً. إذا اخترت «لا أعمل حالياً» في السؤال 5، فاختر مسار الأفراد. في كلتا الحالتين يلتقي المساران مجدداً في القسم الرابع (${pageLink("s4a")}).`)}
  </div>`;
}

const cont = (text: string) => `<p class="cont"><b>${esc(text)}</b></p>`;

function s2a(): string {
  return `
  ${band("02", SECTION_TITLES.s2, "أسئلة موجهة لصنّاع القرار حول احتياجات مؤسستكم وفرق العمل. يجيب عنها من اختار مسار المؤسسات في السؤال 7.", "B2B")}
  <div class="stack">
    ${qcard({ qid: "Q8", type: "single", body: options(Q.Q8.options, "radio", 2) })}
    ${qcard({ qid: "Q9", type: "single", hint: "هل تتوفر لدى مؤسستكم ميزانية معتمدة للتدريب؟", body: options(Q.Q9.options, "radio", 2) })}
    ${qcard({ qid: "Q10", type: "multi", hint: "أي الحلول المؤسسية التالية تهم جهتكم؟ يمكنك اختيار أكثر من خيار.", body: options(Q.Q10.options, "check", 1) })}
    ${note(`في الصفحة التالية (السؤال ${N.Q14}) ستقيّم عشر مهارات لفريق العمل مرتين: أهميتها لنجاح العمل، ثم مستوى أداء الفريق لها حالياً.`, "teal")}
  </div>`;
}

function s2b(): string {
  return `
  ${cont(`تابع ${SECTION_TITLES.s2}`)}
  <div class="stack">
    ${qcard({ qid: "Q14", type: "scale", cls: "roomy", hint: "قيّم كل مهارة مرتين: أهميتها لنجاح العمل، ثم مستوى أداء فريقك لها حالياً. ضع دائرة حول رقم واحد في كل مقياس.", body: matrix("Q14") })}
    ${note(`بعد إكمال هذا القسم انتقل مباشرة إلى القسم الرابع (${pageLink("s4a")}) ولا تُجب عن القسم الثالث.`, "teal")}
  </div>`;
}

function s3(): string {
  return `
  ${band("03", SECTION_TITLES.s3, `أسئلة عنك وعن طموحك المهني. لا توجد إجابة صحيحة أو خاطئة. يجيب عنها من اختار مسار الأفراد في السؤال 7، ثم ينتقل إلى القسم الرابع (${pageLink("s4a")}).`, "B2C")}
  <div class="stack">
    ${qcard({ qid: "Q15", type: "multi", hint: "أي برامج الشباب والجاهزية المهنية التالية تهمك؟ يمكنك اختيار أكثر من خيار.", body: options(Q.Q15.options, "check", 2) })}
    ${qcard({ qid: "Q18", type: "scale", hint: "قيّم كل مهارة مرتين: أهميتها لمستقبلك المهني، ثم أداؤك الفعلي لها حالياً. ضع دائرة حول رقم واحد في كل مقياس.", body: matrix("Q18") })}
  </div>`;
}

function s4a(): string {
  return `
  ${band("04", SECTION_TITLES.s4, "اقتربنا من النهاية. هنا نتعرف على تفضيلاتك والدورات التي تهمك. يجيب عنها جميع المشاركين.")}
  <div class="stack">
    <div class="grid cols-2">
      ${qcard({ qid: "Q19", type: "multi", body: options(Q.Q19.options, "check", 1) })}
      ${qcard({ qid: "Q20", type: "multi", body: options(Q.Q20.options, "check", 1) })}
      ${qcard({ qid: "Q21", type: "multi", body: options(Q.Q21.options, "check", 1) })}
      ${qcard({ qid: "Q22", type: "single", body: options(Q.Q22.options, "radio", 1) })}
    </div>
    <div class="grid cols-2">
      ${qcard({ qid: "Q24", type: "rank", hint: "اكتب في المربع رقماً من 1 (الأهم) إلى 6 (الأقل أهمية) لكل مسار، دون تكرار.",
        body: `<ul class="rank">${TRACKS.map((t) => `<li><span class="box"></span><span class="tid">${t.id}</span><span>${esc(t.label)}</span></li>`).join("")}</ul>` })}
      ${qcard({ qid: "Q25G", type: "multi", hint: `اختر مساراً واحداً أو أكثر، ثم أجب في السؤال ${N.Q25} عن دورات المسارات التي اخترتها فقط.`,
        body: options(Q.Q25G.options, "check", 1, (o) => `<span class="chip">${o.id}</span>`) })}
    </div>
  </div>`;
}

function c1(): string {
  const levels = Q.Q25.levels;
  return `
  ${cont(`تابع ${SECTION_TITLES.s4}`)}
  ${qcard({ qid: "Q25", type: "courses", hint: `الدورات مرتبة حسب المسار، وترتيبها لا يعني أي أفضلية. أجب فقط عن دورات المسارات التي اخترتها في السؤال ${N.Q25G}، وضع علامة في خانة واحدة أمام كل دورة.`,
    body: `<div class="course-intro"><div class="levels">${levels.map((l) => `<span>${mk("radio")}${esc(l)}</span>`).join("")}</div></div>${courseTable("G1")}${courseTable("G2")}` })}`;
}

function c2(): string {
  return `${courseCont()}<div class="q">${courseTable("G3")}${courseTable("G4")}</div>`;
}

function c3(): string {
  return `${courseCont()}
  <div class="stack">
    <div class="q">${courseTable("G5")}${courseTable("G6")}</div>
    ${qcard({ qid: "Q26", type: "multi", max: Q.Q26.max, hint: "ما العناصر التي تجعل جهة تدريبية خيارك الأول؟ اختر حتى 3 عناصر.", body: options(Q.Q26.options, "check", 1) })}
    ${note(`انتهت أسئلة الاستبانة. القسم الخامس في ${pageLink("s5")} اختياري لمن يرغب في الحجز أو التواصل.`, "teal")}
  </div>`;
}

function s5(a: Assets): string {
  return `
  <div class="fill">
  ${band("05", SECTION_TITLES.s5, "هذا القسم اختياري تماماً، ويمكنك تسليم الاستبانة دون تعبئته.", "اختياري")}
  <div class="stack grow">
    ${note(esc(CONTACT_INTRO), "teal")}
    <div class="q">
      <div class="fields">
        <div class="field"><label>${esc(CONTACT_FIELDS.name)}</label><div class="line"></div></div>
        <div class="field"><label>${esc(CONTACT_FIELDS.email)}</label><div class="line"><span class="ltr">@</span></div></div>
        <div class="field"><label>${esc(CONTACT_FIELDS.phone)}</label><div class="line"><span class="ltr">+965</span></div></div>
      </div>
    </div>
    <div class="thanks">
      <div class="orn"><i></i><i></i><i></i></div>
      <h2>${esc(THANK_YOU_TEXT)}</h2>
      <p>${esc(THANK_YOU_SIGN)}</p>
      <div class="logos">
        <span class="round"><img src="${a.alSagar}" alt="${ORG_MAIN}"></span>
        <span class="sep"></span>
        <span class="plate"><img src="${a.asia}" alt="ASIA Data-Science"></span>
      </div>
    </div>
  </div>
  </div>`;
}

/* ---------- assembly ---------- */
function shell(id: PageId, section: string, body: string, a: Assets): string {
  const n = pageNo(id);
  return `<section class="page" id="${id}">
    <div class="spine"></div>
    <header class="run-head"><span class="rh-title">${esc(section)}</span><span>${STUDY_SHORT}</span></header>
    <main class="sheet">${body}</main>
    <footer class="run-foot">
      <span class="brand"><img src="${a.alSagar}" alt=""><span><strong>${ORG_MAIN}</strong>${ORG_PARENT}</span></span>
      <span class="pageno num-ltr"><i>${n}</i> / ${TOTAL_PAGES}</span>
      <span class="partner"><img src="${a.asia}" alt="ASIA Data-Science"></span>
    </footer>
  </section>`;
}

export function buildPages(a: Assets): Page[] {
  const S = SECTION_TITLES;
  const defs: Record<PageId, [string, () => string]> = {
    cover: ["", () => cover(a)],
    guide: ["دليل الاستبانة", guide],
    s1a: [S.s1, s1a], s1b: [S.s1, s1b],
    s2a: [S.s2, s2a], s2b: [S.s2, s2b], s3: [S.s3, s3],
    s4a: [S.s4, s4a], c1: [S.s4, c1], c2: [S.s4, c2], c3: [S.s4, c3],
    s5: [S.s5, () => s5(a)],
  };
  return PAGE_ORDER.map((id) => {
    const [section, render] = defs[id];
    return { id, section, html: id === "cover" ? render() : shell(id, section, render(), a) };
  });
}

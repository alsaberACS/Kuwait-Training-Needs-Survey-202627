import type { ResponseRow } from "@workspace/db";
import { catalogue, CATEGORY_LABELS, type Workshop } from "../data/catalogue";
import { SKILLS, COURSES, COURSE_GROUPS, TRACKS, LEGACY_TRACKS, REPORT_TRACKS, QUESTION_LABELS, SECTION_LABELS, ITEM_WORKSHOPS } from "../data/survey-items";

type Answers = Record<string, unknown>;
type Rating = { importance?: number; performance?: number };
const r2 = (n: number) => Math.round(n * 100) / 100;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

export function answerKey(answers: Answers, q: string): string {
  const v = answers[q];
  if (q === "Q5" && v && typeof v === "object") return str((v as { sector?: unknown }).sector);
  return str(v);
}

type CountItem = { key: string; label: string; count: number; pct: number };

function countRows(rows: ResponseRow[], pick: (r: ResponseRow) => string[], labels: Record<string, string> = {}): CountItem[] {
  const counts = new Map<string, number>();
  let respondents = 0;
  for (const r of rows) {
    const vals = pick(r).filter(Boolean);
    if (!vals.length) continue;
    respondents++;
    for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count, pct: respondents ? r2((count / respondents) * 100) : 0 }));
}

function countItems(rows: ResponseRow[], pick: (a: Answers) => string[]): CountItem[] {
  return countRows(rows, (r) => pick(r.answers as Answers));
}

const single = (q: string) => (a: Answers) => [answerKey(a, q)];
// Historical single-choice preferences still count as one selected option.
const multi = (q: string) => (a: Answers) => [...new Set(Array.isArray(a[q]) ? (a[q] as unknown[]).map(str) : [str(a[q])])];

const hasBookNow = (a: Answers) => Object.values((a.Q25 as Record<string, number>) ?? {}).some((v) => Number(v) === 2);
const hasContact = (r: ResponseRow) => !!(r.contact && (r.contact.email || r.contact.phone));
const SME_SIZES = new Set(["micro", "small", "medium"]);

/**
 * Desk-study stakeholder groups: G government, P private sector, S SMEs, I individuals.
 * B2C respondents are individuals; B2B respondents are classified by sector, then organisation size.
 */
export type StakeholderGroup = "G" | "P" | "S" | "I";
export const STAKEHOLDER_LABELS: Record<StakeholderGroup, string> = {
  G: "الجهات الحكومية (G)",
  P: "القطاع الخاص – مؤسسات كبرى (P)",
  S: "المنشآت الصغيرة والمتوسطة (S)",
  I: "الأفراد والمهنيون (I)",
};
export function stakeholderGroup(r: ResponseRow): StakeholderGroup | "" {
  if (r.path === "B2C") return "I";
  if (r.path !== "B2B") return "";
  const a = r.answers as Answers;
  const sector = answerKey(a, "Q5");
  if (sector === "government") return "G";
  if (sector === "entrepreneur" || SME_SIZES.has(answerKey(a, "Q8"))) return "S";
  return "P";
}

const DURATION_BUCKETS: { key: string; label: string; max: number }[] = [
  { key: "lt3", label: "أقل من 3 دقائق", max: 180 },
  { key: "3_5", label: "3 – 5 دقائق", max: 300 },
  { key: "5_7", label: "5 – 7 دقائق", max: 420 },
  { key: "7_10", label: "7 – 10 دقائق", max: 600 },
  { key: "gt10", label: "أكثر من 10 دقائق", max: Infinity },
];

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function summary(all: ResponseRow[]) {
  const completed = all.filter((r) => r.status === "complete");
  const byDayMap = new Map<string, { started: number; completed: number }>();
  for (const r of all) {
    const d = r.createdAt.toISOString().slice(0, 10);
    const e = byDayMap.get(d) ?? { started: 0, completed: 0 };
    e.started++;
    if (r.status === "complete") e.completed++;
    byDayMap.set(d, e);
  }
  const dropOff = Object.entries(SECTION_LABELS).map(([s, label]) => {
    const step = Number(s);
    return {
      step,
      label,
      reached: all.filter((r) => r.currentStep >= step || r.status === "complete").length,
      stuck: all.filter((r) => r.status === "draft" && r.currentStep === step).length,
    };
  });
  const durations = completed.map((r) => r.durationSec ?? 0).filter((d) => d > 0);
  const durationBuckets = DURATION_BUCKETS.map((b, i) => {
    const min = i ? DURATION_BUCKETS[i - 1].max : 0;
    const count = durations.filter((d) => d > min && d <= b.max).length;
    return { key: b.key, label: b.label, count, pct: durations.length ? r2((count / durations.length) * 100) : 0 };
  });
  return {
    total: all.length,
    completed: completed.length,
    drafts: all.length - completed.length,
    completionRate: all.length ? r2((completed.length / all.length) * 100) : 0,
    b2b: completed.filter((r) => r.path === "B2B").length,
    b2c: completed.filter((r) => r.path === "B2C").length,
    avgDurationSec: r2(mean(durations)),
    medianDurationSec: r2(median(durations)),
    bookNowRespondents: completed.filter((r) => hasBookNow(r.answers as Answers)).length,
    contactsCaptured: completed.filter(hasContact).length,
    hotLeads: completed.filter((r) => hasBookNow(r.answers as Answers) && hasContact(r)).length,
    byDay: [...byDayMap.entries()].sort().map(([date, v]) => ({ date, ...v })),
    byNationality: countItems(completed, single("Q1")),
    byGender: countItems(completed, single("Q2")),
    byAge: countItems(completed, single("Q3")),
    byEducation: countItems(completed, single("Q4")),
    bySector: countItems(completed, single("Q5")),
    bySubSector: countItems(completed, (a) => {
      const v = a.Q5;
      if (!v || typeof v !== "object") return [];
      const { sector, sub } = v as { sector?: unknown; sub?: unknown };
      return str(sector) && str(sub) ? [`${str(sector)}:${str(sub)}`] : [];
    }),
    byJobLevel: countItems(completed, single("Q6")),
    byOrgSize: countItems(completed, single("Q8")),
    byStakeholder: countRows(completed, (r) => [stakeholderGroup(r)], STAKEHOLDER_LABELS),
    byDevice: countRows(completed, (r) => [r.device || "unknown"], { desktop: "حاسوب", mobile: "هاتف", tablet: "جهاز لوحي", unknown: "غير معروف" }),
    durationBuckets,
    dropOff,
  };
}

function skillStats(rows: ResponseRow[], q: "Q14" | "Q18" | "both", skillId: string) {
  const imp: number[] = [], perf: number[] = [];
  for (const r of rows) {
    const a = r.answers as Answers;
    const m = (q === "both" ? ((a.Q14 ?? a.Q18) as Record<string, Rating>) : (a[q] as Record<string, Rating>)) ?? {};
    const rt = m[skillId];
    if (rt && typeof rt.importance === "number" && typeof rt.performance === "number") {
      imp.push(rt.importance);
      perf.push(rt.performance);
    }
  }
  const gaps = imp.map((i, k) => i - perf[k]);
  const wsum = imp.reduce((a, b) => a + b, 0);
  return {
    n: imp.length,
    meanImportance: r2(mean(imp)),
    meanPerformance: r2(mean(perf)),
    meanGap: r2(mean(gaps)),
    weightedGap: wsum ? r2(gaps.reduce((a, g, k) => a + g * imp[k], 0) / wsum) : 0,
    // Share of raters reporting a severe gap (importance exceeds performance by 2+ points).
    highGapShare: gaps.length ? r2((gaps.filter((g) => g >= 2).length / gaps.length) * 100) : 0,
  };
}

export function skillsGap(rows: ResponseRow[]) {
  return {
    items: Object.entries(SKILLS).map(([skillId, label]) => ({
      skillId,
      label,
      all: skillStats(rows, "both", skillId),
      b2b: skillStats(rows.filter((r) => r.path === "B2B"), "Q14", skillId),
      b2c: skillStats(rows.filter((r) => r.path === "B2C"), "Q18", skillId),
    })),
  };
}

/** Q25G gate: which course groups ("المسارات التدريبية") each respondent chose to see. */
export function selectedGroups(a: Answers): string[] {
  return Array.isArray(a.Q25G) ? (a.Q25G as unknown[]).map(str).filter((g) => g in COURSE_GROUPS) : [];
}

export function courseDemand(rows: ResponseRow[]) {
  // Only respondents who reached the gate question count toward track-selection shares.
  const gated = rows.map((r) => selectedGroups(r.answers as Answers)).filter((g) => g.length > 0);
  return {
    groups: Object.entries(COURSE_GROUPS).map(([groupId, label]) => {
      const selected = gated.filter((g) => g.includes(groupId)).length;
      return { groupId, label, respondents: gated.length, selected, selectedShare: gated.length ? r2((selected / gated.length) * 100) : 0 };
    }),
    items: Object.entries(COURSES).map(([courseId, c]) => {
      const codes = rows
        .map((r) => (((r.answers as Answers).Q25 as Record<string, unknown>) ?? {})[courseId])
        .filter((v) => v === 0 || v === 1 || v === 2) as number[];
      const shown = codes.length;
      const bookNow = codes.filter((v) => v === 2).length;
      return {
        courseId,
        label: c.label,
        groupId: c.group,
        groupLabel: COURSE_GROUPS[c.group],
        shown,
        notInterested: codes.filter((v) => v === 0).length,
        future: codes.filter((v) => v === 1).length,
        bookNow,
        needIndex: shown ? r2((mean(codes) / 2) * 100) : 0,
        bookNowShare: shown ? r2((bookNow / shown) * 100) : 0,
      };
    }),
  };
}

export function trackRanks(rows: ResponseRow[]) {
  const validOrder = (v: unknown, ids: string[]): v is string[] =>
    Array.isArray(v) && v.length === ids.length && new Set(v).size === ids.length && ids.every((id) => v.includes(id));
  const sets = [TRACKS, LEGACY_TRACKS, REPORT_TRACKS];
  const orders = rows.map((r) => (r.answers as Answers).Q24)
    .filter((v): v is string[] => sets.some((tracks) => validOrder(v, Object.keys(tracks))));
  return {
    items: Object.entries({ ...TRACKS, ...LEGACY_TRACKS, ...REPORT_TRACKS })
      .filter(([id]) => id in TRACKS || orders.some((o) => o.includes(id)))
      .map(([trackId, label]) => {
        const ranks = orders.map((o) => o.indexOf(trackId) + 1).filter((k) => k > 0);
        const m = mean(ranks);
        const size = Object.keys(sets.find((tracks) => trackId in tracks)!).length;
        return {
          trackId,
          label: trackId in TRACKS ? label : `${label} (مسار سابق)`,
          n: ranks.length,
          meanRank: r2(m),
          firstPlaceShare: ranks.length ? r2((ranks.filter((k) => k === 1).length / ranks.length) * 100) : 0,
          score: ranks.length ? r2(((size - m) / (size - 1)) * 100) : 0,
          // How many respondents placed the track at position 1, 2, … size.
          rankDistribution: Array.from({ length: size }, (_, i) => ranks.filter((k) => k === i + 1).length),
        };
      })
      .sort((a, b) => b.score - a.score),
  };
}

export function preferences(rows: ResponseRow[]) {
  const multis = new Set(["Q10", "Q11", "Q15", "Q19", "Q20", "Q21", "Q25G", "Q26"]);
  return {
    questions: Object.entries(QUESTION_LABELS).map(([questionId, label]) => {
      const pick = multis.has(questionId) ? multi(questionId) : single(questionId);
      const options = countItems(rows, pick);
      return { questionId, label, respondents: rows.filter((r) => pick(r.answers as Answers).filter(Boolean).length > 0).length, options };
    }),
  };
}

/* ---------- segment cuts (SURVEY_SPEC §6: B2B vs B2C, government vs private, SME vs large, sector, nationality) ---------- */

type SliceDef = { key: string; label: string; test: (r: ResponseRow) => boolean };
type DimensionDef = { id: string; label: string; questionId: string | null; slices: SliceDef[] };

const byAnswer = (q: string, options: [string, string][]): SliceDef[] =>
  options.map(([key, label]) => ({ key, label, test: (r) => answerKey(r.answers as Answers, q) === key }));

const SEGMENT_DIMENSIONS: DimensionDef[] = [
  {
    id: "path", label: "طبيعة المشاركة", questionId: null,
    slices: [
      { key: "B2B", label: "المؤسسات (B2B)", test: (r) => r.path === "B2B" },
      { key: "B2C", label: "الأفراد (B2C)", test: (r) => r.path === "B2C" },
    ],
  },
  {
    id: "stakeholder", label: "الفئة المعنية (G · P · S · I)", questionId: null,
    slices: (Object.keys(STAKEHOLDER_LABELS) as StakeholderGroup[]).map((g) => ({ key: g, label: STAKEHOLDER_LABELS[g], test: (r) => stakeholderGroup(r) === g })),
  },
  {
    id: "sector", label: "القطاع", questionId: "Q5",
    slices: byAnswer("Q5", [["government", "القطاع الحكومي"], ["private", "القطاع الخاص"], ["entrepreneur", "ريادة الأعمال"], ["nonprofit", "القطاع غير الربحي"], ["not_working", "لا يعمل حالياً"]]),
  },
  {
    id: "orgSize", label: "حجم المؤسسة (B2B)", questionId: null,
    slices: [
      { key: "sme", label: "صغيرة ومتوسطة (أقل من 250)", test: (r) => r.path === "B2B" && SME_SIZES.has(answerKey(r.answers as Answers, "Q8")) },
      { key: "large", label: "كبرى (250 فأكثر)", test: (r) => r.path === "B2B" && answerKey(r.answers as Answers, "Q8") === "large" },
    ],
  },
  { id: "nationality", label: "الجنسية", questionId: "Q1", slices: byAnswer("Q1", [["kuwaiti", "كويتي"], ["non_kuwaiti", "غير كويتي"]]) },
  { id: "gender", label: "الجنس", questionId: "Q2", slices: byAnswer("Q2", [["male", "ذكر"], ["female", "أنثى"]]) },
  { id: "age", label: "الفئة العمرية", questionId: "Q3", slices: byAnswer("Q3", [["u30", "أقل من 30"], ["30_39", "30 – 39"], ["40_49", "40 – 49"], ["50p", "50 فأكثر"]]) },
  {
    id: "jobLevel", label: "المستوى الوظيفي", questionId: "Q6",
    slices: byAnswer("Q6", [["owner", "مالك / شريك مؤسس"], ["senior", "إدارة عليا"], ["manager", "مدير إدارة / قسم"], ["hr", "موارد بشرية وتدريب"], ["employee", "موظف تنفيذي / مهني"], ["student", "طالب / باحث عن عمل"]]),
  },
  {
    id: "education", label: "المستوى التعليمي", questionId: "Q4",
    slices: byAnswer("Q4", [["below_secondary", "دون الثانوية"], ["secondary", "ثانوية"], ["diploma", "دبلوم"], ["bachelor", "بكالوريوس"], ["postgrad", "دراسات عليا"], ["professional", "شهادات مهنية"]]),
  },
];

const PREF_QUESTIONS = ["Q19", "Q20", "Q21", "Q22", "Q23", "Q26"];

function sliceIndicators(rows: ResponseRow[]) {
  const skills = skillsGap(rows).items;
  const demand = courseDemand(rows);
  const gate = demand.groups;
  const groupNeed: Record<string, number> = {};
  const groupSelect: Record<string, number> = {};
  for (const [groupId] of Object.entries(COURSE_GROUPS)) {
    const codes = rows.flatMap((r) => {
      const m = ((r.answers as Answers).Q25 as Record<string, unknown>) ?? {};
      return Object.entries(COURSES).filter(([, c]) => c.group === groupId).map(([id]) => m[id]).filter((v) => v === 0 || v === 1 || v === 2) as number[];
    });
    groupNeed[groupId] = codes.length ? r2((mean(codes) / 2) * 100) : 0;
    groupSelect[groupId] = gate.find((g) => g.groupId === groupId)?.selectedShare ?? 0;
  }
  const prefs: Record<string, string> = {};
  const prefShares: Record<string, number> = {};
  for (const q of PREF_QUESTIONS) {
    const top = countItems(rows, multi(q))[0];
    if (top) { prefs[q] = top.key; prefShares[q] = top.pct; }
  }
  return {
    n: rows.length,
    skillRaters: rows.filter((r) => { const a = r.answers as Answers; return !!(a.Q14 ?? a.Q18); }).length,
    skillGaps: Object.fromEntries(skills.map((s) => [s.skillId, s.all.weightedGap])),
    skillHighGap: Object.fromEntries(skills.map((s) => [s.skillId, s.all.highGapShare])),
    groupNeed,
    groupSelect,
    trackScores: Object.fromEntries(trackRanks(rows).items.filter((t) => t.trackId in TRACKS).map((t) => [t.trackId, t.score])),
    topCourses: demand.items
      .filter((c) => c.shown > 0)
      .sort((a, b) => b.needIndex - a.needIndex || b.bookNowShare - a.bookNowShare || b.shown - a.shown)
      .slice(0, 3)
      .map((c) => ({ courseId: c.courseId, label: c.label, needIndex: c.needIndex, bookNowShare: c.bookNowShare, shown: c.shown })),
    prefs,
    prefShares,
    bookNowShare: rows.length ? r2((rows.filter((r) => hasBookNow(r.answers as Answers)).length / rows.length) * 100) : 0,
  };
}

/** Key indicators recomputed inside each respondent segment, for cross-segment comparison and heatmaps. */
export function segments(rows: ResponseRow[]) {
  return {
    respondents: rows.length,
    dimensions: SEGMENT_DIMENSIONS.map((d) => ({
      id: d.id,
      label: d.label,
      questionId: d.questionId,
      slices: d.slices.map((s) => ({ key: s.key, label: s.label, ...sliceIndicators(rows.filter(s.test)) })),
    })),
  };
}

export function toCatalogueDto(w: Workshop) {
  return { ...w, evidenceScore: w.evidenceScore ?? 0, categoryLabel: CATEGORY_LABELS[w.categoryId] ?? String(w.categoryId) };
}

const SUPPLY_ACTION: Record<string, "Build" | "Expand" | "Select"> = { None: "Build", Emerging: "Expand", Established: "Select" };
const READINESS: Record<string, number> = { None: 20, Emerging: 60, Established: 100 };

/** Field need per survey item, 0-100, with valid n. */
function itemNeeds(rows: ResponseRow[]) {
  const needs = new Map<string, { need: number; n: number }>();
  for (const c of courseDemand(rows).items) needs.set(c.courseId, { need: c.needIndex, n: c.shown });
  for (const s of skillsGap(rows).items) {
    // gap of 4 (importance 5, performance 1) = 100; negative gaps = 0
    needs.set(s.skillId, { need: s.all.n ? r2(Math.max(0, Math.min(100, (s.all.weightedGap / 4) * 100))) : 0, n: s.all.n });
  }
  for (const t of trackRanks(rows).items) needs.set(t.trackId, { need: t.score, n: t.n });
  return needs;
}

export function matching(rows: ResponseRow[], needWeight: number) {
  const nw = Math.max(0, Math.min(100, needWeight));
  const needs = itemNeeds(rows);
  const compute = (weight: number) => {
    const rest = (100 - weight) / 60; // scale the 30/20/10 remainder proportionally
    return catalogue.map((w) => {
      const linked = Object.entries(ITEM_WORKSHOPS).filter(([, titles]) => titles.includes(w.titleEn)).map(([item]) => item);
      const primary = linked.filter((item) => ITEM_WORKSHOPS[item][0] === w.titleEn);
      const useItems = primary.length ? primary : linked;
      const needVals = useItems.map((i) => needs.get(i)).filter((v): v is { need: number; n: number } => !!v && v.n > 0);
      const fieldNeed = needVals.length ? r2(Math.max(...needVals.map((v) => v.need))) : 0;
      const fieldN = needVals.length ? Math.max(...needVals.map((v) => v.n)) : 0;
      const evidence = w.evidenceScore ?? 0;
      const strategic = Math.min(100, (w.audience.length / 4) * 60 + (w.kuwaitPlansCount > 0 ? 20 : 0) + (w.top50Rank ? 20 : 0));
      const readiness = READINESS[w.localSupply] ?? 20;
      const composite = r2((fieldNeed * weight + evidence * 30 * rest + strategic * 20 * rest + readiness * 10 * rest) / 100);
      const strongEvidence = evidence >= 60 || (w.top50Rank !== null && w.top50Rank <= 50 && w.shortlisted);
      const confirmedNeed = fieldN > 0 && fieldNeed >= 50;
      const gridCell = strongEvidence && confirmedNeed ? "confirmed_priority" : confirmedNeed ? "new_demand" : strongEvidence ? "evidence_led" : "defer";
      return { workshop: toCatalogueDto(w), fieldNeed, fieldN, linkedItems: linked, gridCell, compositeScore: composite, supplyAction: SUPPLY_ACTION[w.localSupply] ?? "Build" };
    });
  };
  const rank = (items: ReturnType<typeof compute>) => {
    const sorted = [...items].sort((a, b) => b.compositeScore - a.compositeScore || (b.workshop.evidenceScore - a.workshop.evidenceScore));
    return new Map(sorted.map((it, i) => [it.workshop.id, i + 1]));
  };
  const base = compute(nw);
  const baseRank = rank(base);
  const up = rank(compute(Math.min(100, nw + 10)));
  const down = rank(compute(Math.max(0, nw - 10)));
  const items = base
    .map((it) => {
      const rk = baseRank.get(it.workshop.id)!;
      const shift = Math.max(Math.abs((up.get(it.workshop.id) ?? rk) - rk), Math.abs((down.get(it.workshop.id) ?? rk) - rk));
      return { ...it, rank: rk, rankShift: shift };
    })
    .sort((a, b) => a.rank - b.rank);
  return { needWeight: nw, respondents: rows.length, items };
}

export function toCsv(rows: ResponseRow[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const qs = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q14", "Q15", "Q18", "Q19", "Q20", "Q21", "Q22", "Q23", "Q24", "Q25G", "Q25", "Q26"];
  const head = ["id", "status", "path", "created_at", "completed_at", "duration_sec", "device", "source_tag", "contact_name", "contact_email", "contact_phone", ...qs];
  const lines = rows.map((r) => {
    const a = r.answers as Answers;
    return [r.id, r.status, r.path, r.createdAt.toISOString(), r.completedAt?.toISOString(), r.durationSec, r.device, r.sourceTag, r.contact?.name, r.contact?.email, r.contact?.phone, ...qs.map((q) => a[q])].map(esc).join(",");
  });
  return "\uFEFF" + [head.join(","), ...lines].join("\n");
}

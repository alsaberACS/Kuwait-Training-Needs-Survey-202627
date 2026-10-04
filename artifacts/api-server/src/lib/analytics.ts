import type { ResponseRow } from "@workspace/db";
import { catalogue, CATEGORY_LABELS, type Workshop } from "../data/catalogue";
import { SKILLS, COURSES, COURSE_GROUPS, TRACKS, QUESTION_LABELS, SECTION_LABELS, ITEM_WORKSHOPS } from "../data/survey-items";
import { TRAINING_TOPICS, TRAINING_MODE } from "@workspace/api-zod/training";

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

function countItems(rows: ResponseRow[], pick: (a: Answers) => string[]): { key: string; label: string; count: number; pct: number }[] {
  const counts = new Map<string, number>();
  let respondents = 0;
  for (const r of rows) {
    const vals = pick(r.answers as Answers).filter(Boolean);
    if (!vals.length) continue;
    respondents++;
    for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: key, count, pct: respondents ? r2((count / respondents) * 100) : 0 }));
}

const single = (q: string) => (a: Answers) => [answerKey(a, q)];
const multi = (q: string) => (a: Answers) => (Array.isArray(a[q]) ? (a[q] as unknown[]).map(str) : []);

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
  return {
    total: all.length,
    completed: completed.length,
    drafts: all.length - completed.length,
    completionRate: all.length ? r2((completed.length / all.length) * 100) : 0,
    b2b: completed.filter((r) => r.path === "B2B").length,
    b2c: completed.filter((r) => r.path === "B2C").length,
    avgDurationSec: r2(mean(durations)),
    bookNowRespondents: completed.filter((r) => (r.answers as Answers).Q25Mode !== TRAINING_MODE && Object.values(((r.answers as Answers).Q25 as Record<string, number>) ?? {}).some((v) => Number(v) === 2)).length,
    contactsCaptured: completed.filter((r) => r.contact && (r.contact.email || r.contact.phone)).length,
    byDay: [...byDayMap.entries()].sort().map(([date, v]) => ({ date, ...v })),
    byNationality: countItems(completed, single("Q1")),
    byGender: countItems(completed, single("Q2")),
    byAge: countItems(completed, single("Q3")),
    byEducation: countItems(completed, single("Q4")),
    bySector: countItems(completed, single("Q5")),
    byJobLevel: countItems(completed, single("Q6")),
    byOrgSize: countItems(completed, single("Q8")),
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

const strings = (v: unknown): string[] => Array.isArray(v) ? [...new Set(v.filter((id): id is string => typeof id === "string"))] : [];
function chosenTopics(a: Answers): string[] {
  if (a.Q25Mode !== TRAINING_MODE) return [];
  const groups = selectedGroups(a);
  return strings(a.Q25T).filter((id) => TRAINING_TOPICS.some((t) => t.id === id && groups.includes(t.group)));
}

export function topicPriorities(rows: ResponseRow[]) {
  const answered = rows.map((r) => r.answers as Answers).filter((a) => chosenTopics(a).length > 0);
  return TRAINING_TOPICS.map((t) => {
    const eligible = answered.filter((a) => selectedGroups(a).includes(t.group));
    const selected = eligible.filter((a) => chosenTopics(a).includes(t.id)).length;
    return { topicId: t.id, label: t.label, groupId: t.group, respondents: eligible.length,
      selected, selectedShare: eligible.length ? r2(selected / eligible.length * 100) : 0, courseIds: t.courses };
  });
}

export function courseEnquiries(rows: ResponseRow[]) {
  const short = rows.map((r) => r.answers as Answers).filter((a) => a.Q25Mode === TRAINING_MODE);
  return Object.entries(COURSES).map(([courseId, c]) => {
    const shown = short.filter((a) => strings(a.Q25Shown).includes(courseId));
    const enquiries = shown.filter((a) => strings(a.Q25I).includes(courseId)).length;
    return { courseId, label: c.label, groupId: c.group, recommended: shown.length, enquiries,
      enquiryShare: shown.length ? r2(enquiries / shown.length * 100) : 0 };
  });
}

export function courseDemand(rows: ResponseRow[]) {
  // Only respondents who reached the gate question count toward track-selection shares.
  const gated = rows.map((r) => selectedGroups(r.answers as Answers)).filter((g) => g.length > 0);
  return {
    topics: topicPriorities(rows),
    enquiries: courseEnquiries(rows),
    groups: Object.entries(COURSE_GROUPS).map(([groupId, label]) => {
      const selected = gated.filter((g) => g.includes(groupId)).length;
      return { groupId, label, respondents: gated.length, selected, selectedShare: gated.length ? r2((selected / gated.length) * 100) : 0 };
    }),
    items: Object.entries(COURSES).map(([courseId, c]) => {
      const codes = rows
        .filter((r) => (r.answers as Answers).Q25Mode !== TRAINING_MODE)
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
  const orders = rows.map((r) => (r.answers as Answers).Q24).filter((v): v is string[] => Array.isArray(v) && v.length === 6);
  return {
    items: Object.entries(TRACKS)
      .map(([trackId, label]) => {
        const ranks = orders.map((o) => o.indexOf(trackId) + 1).filter((k) => k > 0);
        const m = mean(ranks);
        return {
          trackId,
          label,
          n: ranks.length,
          meanRank: r2(m),
          firstPlaceShare: ranks.length ? r2((ranks.filter((k) => k === 1).length / ranks.length) * 100) : 0,
          score: ranks.length ? r2(((6 - m) / 5) * 100) : 0,
        };
      })
      .sort((a, b) => b.score - a.score),
  };
}

export function preferences(rows: ResponseRow[]) {
  const multis = new Set(["Q10", "Q11", "Q15", "Q25G", "Q25T", "Q25I", "Q26"]);
  return {
    questions: Object.entries(QUESTION_LABELS).map(([questionId, label]) => {
      const pick = multis.has(questionId) ? multi(questionId) : single(questionId);
      const options = countItems(rows, pick);
      return { questionId, label, respondents: rows.filter((r) => pick(r.answers as Answers).filter(Boolean).length > 0).length, options };
    }),
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
  const topics = topicPriorities(rows);
  const enquiries = courseEnquiries(rows);
  const compute = (weight: number) => {
    const rest = (100 - weight) / 60; // scale the 30/20/10 remainder proportionally
    return catalogue.map((w) => {
      const linked = Object.entries(ITEM_WORKSHOPS).filter(([, titles]) => titles.includes(w.titleEn)).map(([item]) => item);
      const primary = linked.filter((item) => ITEM_WORKSHOPS[item][0] === w.titleEn);
      const useItems = primary.length ? primary : linked;
      const needVals = useItems.map((i) => needs.get(i)).filter((v): v is { need: number; n: number } => !!v && v.n > 0);
      const fieldNeed = needVals.length ? r2(Math.max(...needVals.map((v) => v.need))) : 0;
      const fieldN = needVals.length ? Math.max(...needVals.map((v) => v.n)) : 0;
      // Topic priorities suggest workshop relevance; they are not workshop ratings.
      const courseIds = primary.filter((id) => id in COURSES);
      const linkedTopics = topics.filter((t) => t.courseIds.some((id) => courseIds.includes(id)));
      const topic = linkedTopics.sort((a, b) => b.selectedShare - a.selectedShare)[0];
      const topicPriorityShare = topic?.selectedShare ?? 0;
      const topicRespondents = topic?.respondents ?? 0;
      const topicSelected = topic?.selected ?? 0;
      const enquiryCount = enquiries.filter((c) => courseIds.includes(c.courseId)).reduce((n, c) => n + c.enquiries, 0);
      const planningNeed = Math.max(fieldNeed, topicPriorityShare);
      const evidence = w.evidenceScore ?? 0;
      const strategic = Math.min(100, (w.audience.length / 4) * 60 + (w.kuwaitPlansCount > 0 ? 20 : 0) + (w.top50Rank ? 20 : 0));
      const readiness = READINESS[w.localSupply] ?? 20;
      const composite = r2((planningNeed * weight + evidence * 30 * rest + strategic * 20 * rest + readiness * 10 * rest) / 100);
      const strongEvidence = evidence >= 60 || (w.top50Rank !== null && w.top50Rank <= 50 && w.shortlisted);
      const confirmedNeed = fieldN > 0 && fieldNeed >= 50;
      const gridCell = strongEvidence && confirmedNeed ? "confirmed_priority" : confirmedNeed ? "new_demand" : strongEvidence ? "evidence_led" : "defer";
      return { workshop: toCatalogueDto(w), fieldNeed, fieldN, topicPriorityShare, topicRespondents, topicSelected, enquiryCount,
        linkedItems: linked, gridCell, compositeScore: composite, supplyAction: SUPPLY_ACTION[w.localSupply] ?? "Build" };
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
  const qs = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q14", "Q15", "Q18", "Q19", "Q20", "Q21", "Q22", "Q23", "Q24", "Q25Mode", "Q25G", "Q25T", "Q25Shown", "Q25I", "Q25", "Q26"];
  const head = ["id", "status", "path", "created_at", "completed_at", "duration_sec", "device", "source_tag", "contact_name", "contact_email", "contact_phone", ...qs];
  const lines = rows.map((r) => {
    const a = r.answers as Answers;
    return [r.id, r.status, r.path, r.createdAt.toISOString(), r.completedAt?.toISOString(), r.durationSec, r.device, r.sourceTag, r.contact?.name, r.contact?.email, r.contact?.phone, ...qs.map((q) => a[q])].map(esc).join(",");
  });
  return "\uFEFF" + [head.join(","), ...lines].join("\n");
}

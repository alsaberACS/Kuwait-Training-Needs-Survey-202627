import { Q, SKILLS, ALL_COURSES, COURSE_GROUPS, TRACKS, type Answers, type Path, type CourseGroup } from "./survey-definition";

export const STEP_INTRO = 0;
export const STEP_S1 = 1;
export const STEP_PATH = 2;
export const STEP_S4 = 3;
export const STEP_S5 = 4;

export const PROGRESS_LABELS = (path?: Path) => [
  "البيانات الديموغرافية",
  path === "B2C" ? "مسار الأفراد" : path === "B2B" ? "مسار المؤسسات" : "مسارك",
  "التوجهات والاحتياجات",
  "التواصل والحجز",
];

export function suggestPath(a: Answers): Path | undefined {
  if (a.Q5?.sector === "not_working" || a.Q6 === "student") return "B2C";
  if (a.Q6 && ["owner", "senior", "hr"].includes(a.Q6)) return "B2B";
  return undefined;
}

export function questionNumbers(path?: Path, sector?: string): Record<string, number> {
  const order = ["Q1", "Q2", "Q3", "Q4", "Q5", ...(sector === "not_working" ? [] : ["Q6"]), "Q7",
    ...(path === "B2C" ? ["Q15", "Q18"] : ["Q8", "Q9", "Q10", "Q14"]),
    "Q19", "Q20", "Q21", "Q22", "Q24", "Q25G", "Q25", "Q26"];
  return Object.fromEntries(order.map((id, i) => [id, i + 1]));
}

/** Keep selection neutral; recommendations are offered only after submission. */
export function suggestedGroups(_a: Answers): string[] {
  return [];
}

export function orderedCourseGroups(_a: Answers): CourseGroup[] {
  return COURSE_GROUPS;
}

/** Only the groups picked in Q25G, in the same neutral order for all participants. */
export const selectedCourseGroups = (a: Answers): CourseGroup[] =>
  orderedCourseGroups(a).filter((g) => a.Q25G?.includes(g.id));

export const selectedCourses = (a: Answers) => selectedCourseGroups(a).flatMap((g) => g.courses);

/** Drop course answers that belong to groups no longer selected, so Q25 only ever holds shown courses. */
export function pruneCourseAnswers(q25: Answers["Q25"], groupIds: string[]): Answers["Q25"] {
  if (!q25) return q25;
  const keep = new Set(COURSE_GROUPS.filter((g) => groupIds.includes(g.id)).flatMap((g) => g.courses.map((c) => c.id)));
  return Object.fromEntries(Object.entries(q25).filter(([id]) => keep.has(id))) as Answers["Q25"];
}

export const defaultTrackOrder = () => TRACKS.map((t) => t.id);

export const ownerAllowed = (a: Answers) => !["private", "government"].includes(a.Q5?.sector ?? "");
export const jobLevelRequired = (a: Answers) => a.Q5?.sector !== "not_working";
export const b2bAllowed = (a: Answers) => a.Q5?.sector !== "not_working";
export const validTrackOrder = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length === TRACKS.length && new Set(v).size === TRACKS.length &&
  TRACKS.every((t) => v.includes(t.id));

/** Normalize resumed drafts only; stored historical responses are left untouched. */
export function normalizeDraft(raw: Record<string, unknown>): Answers {
  const a = { ...raw } as Answers;
  for (const key of ["Q19", "Q20", "Q21"] as const) {
    const v = raw[key];
    a[key] = typeof v === "string" ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined;
  }
  delete a.Q11;
  delete a.Q23;
  if (!jobLevelRequired(a) || (!ownerAllowed(a) && a.Q6 === "owner")) delete a.Q6;
  if (!b2bAllowed(a) && a.Q7 === "B2B") delete a.Q7;
  if (!validTrackOrder(a.Q24)) delete a.Q24;
  return a;
}

const REQ = "يرجى اختيار إجابة للمتابعة";
export function validateStep(step: number, a: Answers): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === STEP_S1) {
    (["Q1", "Q2", "Q3", "Q4"] as const).forEach((k) => { if (!a[k]) e[k] = REQ; });
    if (jobLevelRequired(a) && !a.Q6) e.Q6 = REQ;
    const q5 = a.Q5;
    if (!q5?.sector) e.Q5 = REQ;
    else if ((q5.sector === "private" || q5.sector === "government") && !q5.sub) e.Q5 = "يرجى تحديد المجال من القائمة الفرعية";
    else if (q5.sub === "other" && !q5.other?.trim()) e.Q5 = "يرجى كتابة اسم القطاع أو الجهة";
    if (!ownerAllowed(a) && a.Q6 === "owner") e.Q6 = "يرجى اختيار مستوى وظيفي يتناسب مع القطاع المحدد";
    if (!a.Q7) e.Q7 = "يرجى تحديد صفتك في المشاركة لنعرض لك الأسئلة المناسبة";
    else if (!b2bAllowed(a) && a.Q7 === "B2B") e.Q7 = "يرجى اختيار مسار الأفراد بما يتناسب مع القطاع المحدد";
  }
  if (step === STEP_PATH) {
    if (a.Q7 === "B2B") {
      if (!a.Q8) e.Q8 = REQ;
      if (!a.Q9) e.Q9 = REQ;
      if (!a.Q10?.length) e.Q10 = "اختر خياراً واحداً على الأقل";
      const m = SKILLS.filter((s) => !a.Q14?.[s.id]?.importance || !a.Q14?.[s.id]?.performance).length;
      if (m) e.Q14 = `بقي ${m} من المهارات بحاجة إلى تقييم كامل (الأهمية والأداء)`;
    } else {
      if (!a.Q15?.length) e.Q15 = "اختر خياراً واحداً على الأقل";
      const m = SKILLS.filter((s) => !a.Q18?.[s.id]?.importance || !a.Q18?.[s.id]?.performance).length;
      if (m) e.Q18 = `بقي ${m} من المهارات بحاجة إلى تقييم كامل (الأهمية والأداء)`;
    }
  }
  if (step === STEP_S4) {
    (["Q19", "Q20", "Q21"] as const).forEach((k) => {
      if (!Array.isArray(a[k]) || !a[k]?.length || a[k]?.some((id) => !Q[k].options.some((o) => o.id === id))) e[k] = "اختر خياراً واحداً على الأقل";
    });
    if (!a.Q22) e.Q22 = REQ;
    if (!validTrackOrder(a.Q24)) e.Q24 = "يرجى ترتيب المسارات الستة";
    if (!a.Q25G?.length) e.Q25G = "اختر مساراً تدريبياً واحداً على الأقل لعرض الدورات";
    const m = selectedCourses(a).filter((c) => a.Q25?.[c.id] === undefined).length;
    if (m) e.Q25 = `بقي ${m} من الدورات دون اختيار`;
    if (!a.Q26?.length || a.Q26.length > Q.Q26.max) e.Q26 = "اختر عنصراً واحداً على الأقل (حتى 3 عناصر)";
  }
  return e;
}

export const bookedCourses = (a: Answers) => ALL_COURSES.filter((c) => a.Q25?.[c.id] === 2);


export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function validatePhone(raw: string): boolean {
  const d = raw.replace(/[\s-]/g, "");
  return /^\+?\d{8,15}$/.test(d);
}
export { Q };

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

export function questionNumbers(path?: Path): Record<string, number> {
  const order = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7",
    ...(path === "B2C" ? ["Q15", "Q18"] : ["Q8", "Q9", "Q10", "Q11", "Q14"]),
    "Q19", "Q20", "Q21", "Q22", "Q23", "Q24", "Q25", "Q26"];
  return Object.fromEntries(order.map((id, i) => [id, i + 1]));
}

export function orderedCourseGroups(a: Answers): CourseGroup[] {
  const first: string[] = [];
  if (a.Q7 === "B2B") first.push("G2");
  else if (a.Q5?.sector === "not_working" || a.Q6 === "student") first.push("G6");
  const rest = COURSE_GROUPS.filter((g) => !first.includes(g.id));
  return [...COURSE_GROUPS.filter((g) => first.includes(g.id)), ...rest];
}

export const defaultTrackOrder = () => TRACKS.map((t) => t.id);

const REQ = "يرجى اختيار إجابة للمتابعة";
export function validateStep(step: number, a: Answers): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === STEP_S1) {
    (["Q1", "Q2", "Q3", "Q4", "Q6"] as const).forEach((k) => { if (!a[k]) e[k] = REQ; });
    const q5 = a.Q5;
    if (!q5?.sector) e.Q5 = REQ;
    else if ((q5.sector === "private" || q5.sector === "government") && !q5.sub) e.Q5 = "يرجى تحديد المجال من القائمة الفرعية";
    else if (q5.sub === "other" && !q5.other?.trim()) e.Q5 = "يرجى كتابة اسم القطاع أو الجهة";
    if (!a.Q7) e.Q7 = "يرجى تحديد صفتك في المشاركة لنعرض لك الأسئلة المناسبة";
  }
  if (step === STEP_PATH) {
    if (a.Q7 === "B2B") {
      if (!a.Q8) e.Q8 = REQ;
      if (!a.Q9) e.Q9 = REQ;
      if (!a.Q10?.length) e.Q10 = "اختر خياراً واحداً على الأقل";
      if (!a.Q11?.length) e.Q11 = "اختر خياراً واحداً على الأقل (حتى خيارين)";
      const m = SKILLS.filter((s) => !a.Q14?.[s.id]?.importance || !a.Q14?.[s.id]?.performance).length;
      if (m) e.Q14 = `بقي ${m} من المهارات بحاجة إلى تقييم كامل (الأهمية والأداء)`;
    } else {
      if (!a.Q15?.length) e.Q15 = "اختر خياراً واحداً على الأقل";
      const m = SKILLS.filter((s) => !a.Q18?.[s.id]?.importance || !a.Q18?.[s.id]?.performance).length;
      if (m) e.Q18 = `بقي ${m} من المهارات بحاجة إلى تقييم كامل (الأهمية والأداء)`;
    }
  }
  if (step === STEP_S4) {
    (["Q19", "Q20", "Q21", "Q22", "Q23"] as const).forEach((k) => { if (!a[k]) e[k] = REQ; });
    if (!a.Q24 || a.Q24.length !== 6) e.Q24 = "يرجى ترتيب المسارات";
    const m = ALL_COURSES.filter((c) => a.Q25?.[c.id] === undefined).length;
    if (m) e.Q25 = `بقي ${m} من الدورات دون اختيار`;
    if (!a.Q26?.length) e.Q26 = "اختر عنصراً واحداً على الأقل (حتى عنصرين)";
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

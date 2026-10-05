import {
  type Answers, type Rating, COURSE_GROUPS, COURSE_LABELS, SKILL_LABELS, TRACK_LABELS, optionLabel,
} from "./survey-definition";

export interface PersonalizedSummary {
  isInstitution: boolean;
  priorities: { id: string; label: string }[];
  skills: { id: string; label: string; importance: number; performance: number; gap: number }[];
  courses: { id: string; label: string; reason: string }[];
  preferences: { label: string; values: string[] }[];
}

const valid = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
const toList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? [v] : []);
const num = (id: string) => Number(id.replace(/\D/g, "")) || 0;

export function personalizedSummary(answers: Answers): PersonalizedSummary {
  const isInstitution = answers.Q7 === "B2B";
  const priorities = toList(answers.Q24).slice(0, 3).filter((id) => TRACK_LABELS[id]).map((id) => ({ id, label: TRACK_LABELS[id] }));

  const matrix: Record<string, Rating> | undefined =
    answers.Q7 === "B2B" ? answers.Q14 : answers.Q7 === "B2C" ? answers.Q18 : answers.Q14 ?? answers.Q18;
  const skills = Object.entries(matrix ?? {})
    .filter(([id, r]) => SKILL_LABELS[id] && r && valid(r.importance) && valid(r.performance))
    .map(([id, r]) => ({ id, label: SKILL_LABELS[id], importance: r.importance as number, performance: r.performance as number, gap: (r.importance as number) - (r.performance as number) }))
    .filter((s) => s.importance >= 4 && s.gap > 0)
    .sort((a, b) => b.gap - a.gap || b.importance - a.importance || num(a.id) - num(b.id))
    .slice(0, 3);

  const chosen = Array.isArray(answers.Q25G) ? answers.Q25G : undefined;
  const ranked = toList(answers.Q24);
  const groupRank = (gid: string) => {
    const r = ranked.indexOf(gid);
    if (r >= 0) return r;
    const c = chosen ? chosen.indexOf(gid) : -1;
    return c >= 0 ? 100 + c : 1000 + num(gid);
  };
  const interest = answers.Q25 ?? {};
  const candidates = COURSE_GROUPS.filter((g) => !chosen || chosen.includes(g.id)).flatMap((g) =>
    g.courses.filter((c) => interest[c.id] === 1 || interest[c.id] === 2).map((c) => ({ c, g, level: interest[c.id] as number })),
  );
  candidates.sort((a, b) => groupRank(a.g.id) - groupRank(b.g.id) || b.level - a.level || num(a.c.id) - num(b.c.id));
  const courses = candidates.slice(0, 3).map(({ c, g, level }) => ({
    id: c.id,
    label: COURSE_LABELS[c.id] ?? c.label,
    reason: `${level === 2 ? "اخترت \"أرغب بالحجز فوراً\"" : "اخترت \"مهتم مستقبلاً\""} لهذه الدورة ضمن مسار ${g.label}.`,
  }));

  const pref = (label: string, qid: "Q19" | "Q20" | "Q21" | "Q22") => ({
    label, values: toList(answers[qid]).map((id) => optionLabel(qid, id)),
  });
  const preferences = [
    pref("أسلوب التقديم", "Q19"), pref("المدة", "Q20"), pref("الفترة الزمنية", "Q21"), pref("اللغة", "Q22"),
  ].filter((p) => p.values.length);

  return { isInstitution, priorities, skills, courses, preferences };
}

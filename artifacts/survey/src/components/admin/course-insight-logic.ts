import type { CourseInsightReport, QuestionBreakdown, SurveyPath } from "@workspace/api-client-react";
import { optionLabel } from "@/lib/survey-definition";
import { LOW_N } from "@/lib/study-context";
import { fmt } from "./shared";

export const PREF_ORDER = ["Q19", "Q20", "Q21", "Q22", "Q23", "Q26"] as const;
export const PREF_META: Record<string, { short: string; multi: boolean }> = {
  Q19: { short: "أسلوب التنفيذ", multi: true },
  Q20: { short: "المدة", multi: true },
  Q21: { short: "التوقيت", multi: true },
  Q22: { short: "اللغة", multi: false },
  Q23: { short: "الاعتماد", multi: false },
  Q26: { short: "عوامل التميّز", multi: true },
};

export type Lead = { qid: string; respondents: number; max: number; pct: number; labels: string[]; low: boolean } | null;

/** All options tied at the top, or null when the question has no answers in the cohort. */
export function leadOf(qid: string, b?: QuestionBreakdown): Lead {
  if (!b || b.respondents <= 0) return null;
  const max = Math.max(0, ...b.options.map((o) => o.count));
  if (max <= 0) return null;
  const top = b.options.filter((o) => o.count === max);
  return { qid, respondents: b.respondents, max, pct: top[0].pct, labels: top.map((o) => optionLabel(qid, o.key) || o.label), low: b.respondents < LOW_N };
}

export const joinAr = (xs: string[]) => (xs.length <= 1 ? xs[0] ?? "" : `${xs.slice(0, -1).join("، ")} و${xs[xs.length - 1]}`);

export type Insight = { kind: "measured" | "caution"; title: string; text: string };

export function buildInsights(r: CourseInsightReport, path?: SurveyPath): Insight[] {
  const d = r.workshop.demand;
  const out: Insight[] = [];
  if (r.state === "not_evaluated") {
    out.push({ kind: "caution", title: "لا تقييمات بعد", text: `لم تُعرض هذه الورشة على أي مشارك ضمن النطاق المحدد، لذا مؤشر الاحتياج والترتيب غير متاحين. هذا غياب بيانات وليس دليلاً على غياب الطلب.` });
    return out;
  }
  const low = d.shown < LOW_N;
  if (r.state === "no_interest") {
    out.push({ kind: "measured", title: "اهتمام صفري مُقاس", text: `قيّم الورشة ${d.shown} مشاركاً واختاروا جميعاً «غير مهتم». لا توجد شريحة مهتمة لاستخراج تفضيلات تصميم منها.${low ? " العدد صغير، فالنتيجة للاستئناس." : ""}` });
  } else {
    const fut = d.shown ? (d.future / d.shown) * 100 : 0;
    out.push({ kind: "measured", title: "حجم الطلب", text: `${r.workshop.interestedRespondents} من ${d.shown} ممن عُرضت عليهم أبدوا اهتماماً، ومؤشر الاحتياج ${fmt(d.needIndex, 0)} من 100.${low ? " العدد أقل من 5، فالنتيجة للاستئناس." : ""}` });
    const verdict = d.bookNow > d.future ? "النية الفورية تتقدم على الاهتمام المؤجل" : d.bookNow < d.future ? "الاهتمام المستقبلي يتقدم على النية الفورية" : "النية الفورية والاهتمام المستقبلي متساويان";
    out.push({ kind: "measured", title: "الآن أم لاحقاً؟", text: `${verdict}: «احجز الآن» ${d.bookNow} (${fmt(d.bookNowShare, 1)}%) مقابل «مستقبلاً» ${d.future} (${fmt(fut, 1)}%). «احجز الآن» نية معلنة وليست حجزاً مدفوعاً.` });
  }
  if (r.domainRank != null) {
    out.push({ kind: "measured", title: "الموقع داخل المجال", text: `المرتبة ${r.domainRank}${r.rankTied ? " (مشتركة مع ورشة أخرى بالقيم نفسها)" : ""} من ${r.domainEvaluatedCourses} ورشة قُيّمت في «${r.domain.label}» (من أصل ${r.domainCourseCount}).` });
  }
  const slices = r.byPath.filter((s) => !path || s.path === path);
  const seen = slices.filter((s) => s.shown > 0 && s.needIndex != null);
  if (!path && seen.length === 2) {
    const [a, b] = seen;
    const diff = Math.abs((a.needIndex ?? 0) - (b.needIndex ?? 0));
    const hi = (a.needIndex ?? 0) >= (b.needIndex ?? 0) ? a : b;
    const comparison = diff < 1 ? "المؤشر متقارب بين B2B وB2C." : `المؤشر أعلى في مسار ${hi.path} بفارق ${fmt(diff, 0)} نقطة (B2B: ${fmt(a.path === "B2B" ? a.needIndex ?? 0 : b.needIndex ?? 0, 0)}، B2C: ${fmt(a.path === "B2C" ? a.needIndex ?? 0 : b.needIndex ?? 0, 0)}).`;
    out.push({ kind: "measured", title: "المؤسسات والأفراد", text: `${comparison}${Math.min(a.shown, b.shown) < LOW_N ? " أحد المسارين أقل من 5 تقييمات، للاستئناس." : ""}` });
  }
  return out;
}

export type ProfileLine = { qid: string; label: string; lead: Lead; suggestion: string };

const SUGGEST: Record<string, (l: string) => string> = {
  Q19: (l) => `تجربة التنفيذ بصيغة: ${l}`,
  Q20: (l) => `اختبار مدة: ${l}`,
  Q21: (l) => `جدولة أولى في: ${l}`,
  Q22: (l) => `تقديم المحتوى بـ${l.replace(/^اللغة /, "اللغة ")}`,
  Q23: (l) => `مخرج شهادة: ${l}`,
  Q26: (l) => `إبراز: ${l}`,
};

export function buildProfile(r: CourseInsightReport): ProfileLine[] {
  return PREF_ORDER.map((qid) => {
    const lead = r.state === "interested" ? leadOf(qid, r.workshop.preferences.find((p) => p.questionId === qid)) : null;
    const choices = lead ? (qid === "Q26" ? joinAr(lead.labels) : lead.labels.join(" أو ")) : "";
    return { qid, label: PREF_META[qid].short, lead, suggestion: lead ? SUGGEST[qid](choices) : "لا إجابات كافية لاقتراح" };
  });
}

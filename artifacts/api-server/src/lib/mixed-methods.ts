import type { ResponseRow } from "@workspace/db";
import type { MixedAlignment, MixedCourse, MixedDemand, MixedEvidenceLink, MixedMethodsReport, SurveyPath } from "@workspace/api-zod";
import { COURSE_GROUPS, COURSES, ITEM_WORKSHOPS } from "../data/survey-items";
import { catalogue } from "../data/catalogue";
import { focusGroupAnalysis } from "../data/focus-groups";
import { domainIntegration, integrationBlindSpots, trainingLevelDesigns } from "../data/focus-groups/integration";
import { courseDemand } from "./analytics";
import { courseRating } from "./training-pathways";

const LOW_SAMPLE = 5;
const CONVERGENCE = 50;
const domainIds = Object.keys(COURSE_GROUPS);
const courseIds = Object.keys(COURSES);
const catalogueByTitle = new Map(catalogue.map((course) => [course.titleEn, course]));
const courseTier = new Map(courseIds.map((id) => {
  const tier = catalogueByTitle.get(ITEM_WORKSHOPS[id]?.[0])?.tier;
  return [id, trainingLevelDesigns.some((level) => level.tier === tier) ? tier! : null];
}));

const pct = (n: number, denominator: number) => denominator ? 100 * n / denominator : null;
const validRating = (v: unknown): v is number => v === 0 || v === 1 || v === 2;
const unique = (items: string[]) => [...new Set(items)];
const isCurrentOrder = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length === domainIds.length && new Set(v).size === domainIds.length && domainIds.every((id) => v.includes(id));

/** Pool actual course ratings; count each person only once for person measures. */
export function mixedDemand(rows: ResponseRow[], ids: string[]): MixedDemand {
  let evaluatedRespondents = 0, interestedRespondents = 0, bookNowRespondents = 0;
  let notInterestedRatings = 0, futureRatings = 0, bookNowRatings = 0;
  const evaluatedCourses = new Set<string>();
  for (const row of rows) {
    let rated = false, interested = false, bookNow = false;
    for (const id of ids) {
      const rating = courseRating(row, id);
      if (!validRating(rating)) continue;
      rated = true;
      evaluatedCourses.add(id);
      if (rating === 0) notInterestedRatings++;
      if (rating === 1) futureRatings++;
      if (rating === 2) bookNowRatings++;
      interested ||= rating > 0;
      bookNow ||= rating === 2;
    }
    evaluatedRespondents += Number(rated);
    interestedRespondents += Number(interested);
    bookNowRespondents += Number(bookNow);
  }
  const ratingCount = notInterestedRatings + futureRatings + bookNowRatings;
  return {
    courseCount: ids.length, evaluatedCourses: evaluatedCourses.size, evaluatedRespondents,
    interestedRespondents, bookNowRespondents, ratingCount, notInterestedRatings, futureRatings, bookNowRatings,
    needIndex: pct(futureRatings + 2 * bookNowRatings, 2 * ratingCount),
    interestShare: pct(interestedRespondents, evaluatedRespondents),
    bookNowShare: pct(bookNowRespondents, evaluatedRespondents),
  };
}

/** Classification uses the unrounded index and is descriptive, not a test. */
export function mixedAlignment(demand: MixedDemand, qualitativeGroups: number): MixedAlignment {
  if (!demand.evaluatedRespondents) return {
    code: "unobserved", label: "لا توجد مقارنة كمية بعد",
    explanation: "لم تُسجل تقييمات صالحة لدورات المجال في النطاق المعروض. لا يُفسر غياب القياس على أنه عدم اهتمام.",
  };
  if (demand.evaluatedRespondents < LOW_SAMPLE) return {
    code: "limited", label: "قراءة أولية — للاستئناس",
    explanation: `قيّم المجال ${demand.evaluatedRespondents} مستجيباً فقط، أقل من ${LOW_SAMPLE}. تُعرض الشواهد جنباً إلى جنب دون تصنيف تقارب أو تباين.`,
  };
  if (!qualitativeGroups) return {
    code: "quantitative_only", label: "قياس كمي بلا شاهد نوعي مباشر",
    explanation: "توجد تقييمات كمية، لكن الربط لا يحتوي احتياجاً نوعياً صريحاً مباشراً؛ الدليل السياقي وغياب الذكر لا يكفيان للحكم بالاتفاق أو الرفض.",
  };
  if (demand.needIndex !== null && demand.needIndex >= CONVERGENCE) return {
    code: "convergent", label: "تقارب وصفي",
    explanation: "يوجد احتياج صريح في شاهد مرتبط مباشرة بالمجال، ومؤشر الرغبة في دوراته لا يقل عن 50/100 لدى 5 مقيّمين فأكثر. هذا تقارب موضوعي وصفي، لا اتفاق إحصائي ولا تأييد لكل دورة.",
  };
  return {
    code: "divergent", label: "تباين يستحق التحقق",
    explanation: "توجد حاجة نوعية مرتبطة مباشرة، لكن مؤشر الرغبة في الدورات المعروضة أقل من 50/100 لدى 5 مقيّمين فأكثر. قد تختلف العينة أو صياغة العرض أو نطاق الموضوع؛ ليس هذا دليلاً على تناقض المشاركين.",
  };
}

export function integrationEvidence(groupId: string): MixedEvidenceLink[] {
  return domainIntegration[groupId].links.map((link) => {
    const theme = focusGroupAnalysis.themes.find((item) => item.id === link.themeId);
    if (!theme) throw new Error(`Unknown qualitative integration theme: ${link.themeId}`);
    const allIds = unique(theme.signals.flatMap((signal) => signal.evidenceIds));
    const evidenceIds = link.evidenceIds ?? allIds;
    if (evidenceIds.some((id) => !allIds.includes(id))) throw new Error(`Invalid evidence crosswalk: ${groupId}/${link.themeId}`);
    return {
      themeId: theme.id, title: theme.title, relation: link.relation, note: link.note, evidenceIds,
      explicitGroupIds: unique(theme.signals
        .filter((signal) => signal.status === "explicit" && signal.evidenceIds.some((id) => evidenceIds.includes(id)))
        .map((signal) => signal.groupId)),
    };
  });
}

/** Pure, read-only aggregation; never joins participant identities across studies. */
export function mixedMethods(all: ResponseRow[], path?: SurveyPath): MixedMethodsReport {
  const rows = all.filter((row) => row.status === "complete" && (!path || row.path === path));
  const selections = rows.map((row) => {
    const value = row.answers.Q25G;
    return Array.isArray(value) ? unique(value.filter((id): id is string => typeof id === "string" && domainIds.includes(id))) : [];
  }).filter((ids) => ids.length > 0);
  const submittedOrders = rows.map((row) => row.answers.Q24).filter((v) =>
    v != null && (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : true));
  const orders = submittedOrders.filter(isCurrentOrder);
  const demandCourses = courseDemand(rows).items;

  const topCourses = (ids: string[]): MixedCourse[] => demandCourses
    .filter((course) => ids.includes(course.courseId) && course.shown > 0 && course.future + course.bookNow > 0)
    .sort((a, b) => b.needIndex - a.needIndex || b.bookNowShare - a.bookNowShare || b.shown - a.shown || Number(a.courseId.slice(1)) - Number(b.courseId.slice(1)))
    .slice(0, 3)
    .map((course) => ({
      courseId: course.courseId, label: course.label, tier: courseTier.get(course.courseId) ?? null,
      shown: course.shown, interested: course.future + course.bookNow, bookNow: course.bookNow, needIndex: course.needIndex,
    }));

  return {
    generatedAt: new Date().toISOString(),
    qualitativeAnalysisDate: focusGroupAnalysis.analysisDate,
    respondents: rows.length, scope: path ?? "all", qualitativeGroups: focusGroupAnalysis.groups.length,
    gateRespondents: selections.length, rankRespondents: orders.length,
    excludedRankingRespondents: submittedOrders.length - orders.length,
    lowSampleThreshold: LOW_SAMPLE, convergenceThreshold: CONVERGENCE,
    unclassifiedCourseCount: courseIds.filter((id) => !courseTier.get(id)).length,
    domains: domainIds.map((groupId) => {
      const ids = courseIds.filter((id) => COURSES[id].group === groupId);
      const seed = domainIntegration[groupId];
      const evidenceLinks = integrationEvidence(groupId);
      const qualitativeGroupIds = unique(evidenceLinks.filter((link) => link.relation === "direct").flatMap((link) => link.explicitGroupIds));
      const demand = mixedDemand(rows, ids);
      const selected = selections.filter((selection) => selection.includes(groupId)).length;
      const meanRank = orders.length ? orders.reduce((sum, order) => sum + order.indexOf(groupId) + 1, 0) / orders.length : null;
      return {
        groupId, label: COURSE_GROUPS[groupId],
        selectionRespondents: selections.length, selected, selectionShare: pct(selected, selections.length),
        rankRespondents: orders.length, meanRank, priorityScore: meanRank === null ? null : (6 - meanRank) / 5 * 100,
        demand, qualitativeGroupIds, evidenceLinks, alignment: mixedAlignment(demand, qualitativeGroupIds.length),
        interpretation: seed.interpretation, caveat: seed.caveat, designImplication: seed.designImplication,
        levels: trainingLevelDesigns.map((level) => {
          const levelIds = ids.filter((id) => courseTier.get(id) === level.tier);
          return { tier: level.tier, label: level.label, demand: mixedDemand(rows, levelIds), topCourses: topCourses(levelIds) };
        }),
        topCourses: topCourses(ids),
      };
    }),
    levels: trainingLevelDesigns.map((level) => ({
      ...level, demand: mixedDemand(rows, courseIds.filter((id) => courseTier.get(id) === level.tier)),
    })),
    blindSpots: integrationBlindSpots,
    methodology: [
      "التكامل مقارنة موضوعية وصفية بين عينتين مستقلتين، لا ربطاً بين هويات الأفراد ولا اختبار اتفاق أو ارتباط إحصائي. العينة التطوعية لا تمثل سوق الكويت.",
      "نطاق المؤسسات أو الأفراد يرشّح الاستجابات الكمية المكتملة فقط؛ تبقى المجموعات النوعية الثلاث ثابتة ولا تُنسب إلى مسار B2B/B2C.",
      "اختيار المجال Q25G: عدد مختاري المجال ÷ عدد من اختاروا مجالاً صالحاً واحداً على الأقل. الاختيار متعدد؛ لا تجمع نسب المجالات إلى 100%.",
      "أولوية Q24 تستخدم فقط ترتيباً كاملاً صالحاً للمجالات الحالية G1–G6: (6 − متوسط الرتبة) ÷ 5 × 100. تُستبعد القوائم القديمة أو غير الصالحة ولا يُعاد تفسيرها.",
      "مؤشر الرغبة Q25 = 100 × (تقييمات مهتم مستقبلاً + 2 × تقييمات أرغب بالحجز فوراً) ÷ (2 × جميع التقييمات الصالحة). الوحدة تقييم دورة، لا مستجيب؛ كثرة الدورات المقيّمة تزيد وزن المستجيب. غير مهتم = 0، مستقبلاً = 1، فوراً = 2.",
      "نسب المهتمين والحجز الفوري تستخدم المستجيبين الفريدين الذين قيّموا دورة واحدة على الأقل داخل المجال أو المستوى. الغائب ليس صفراً؛ لا يدخل غير المقيّمين المقام. لا تجمع أعداد الأشخاص بين المجالات أو المستويات، فقد يظهر الشخص في أكثر من فئة.",
      "تغطية نوعية مباشرة = اتحاد المجموعات التي تحمل حاجة صريحة في الشواهد المختارة للروابط المباشرة. لا تزيدها الروابط ذات الصلة أو الإشارات السياقية أو تكرار الاقتباس. الربط من وضع المحلل وعلى مستوى الموضوع، وليس تطابقاً لكل دورة.",
      "قاعدة التقارب الوصفي: 5 مقيّمين فأكثر + شاهد نوعي صريح مباشر + مؤشر رغبة لا يقل عن 50/100؛ أقل من 50 يسمى تبايناً يستحق التحقق. أقل من 5 للاستئناس؛ لا تقييمات = غير مقاس. 50 نقطة حد تحليلي يقابل متوسط «مهتم مستقبلاً»، وليس حد دلالة أو نسبة اتفاق.",
      "المستويات تأسيسي/ممارس/قيادي مأخوذة من الربط الأساسي للدورة بالكتالوج، وتصنيفها تقريبي يحتاج تحققاً قبل اعتماد البرامج. ليست إجابة مباشرة عن مستوى المتدرب، ولا تُستنتج من مسماه الوظيفي. اقتراحات التصميم منفصلة عن القياس.",
      "لا توجد دورة في خلية مجال/مستوى يعني فجوة في تصنيف القائمة، لا عدم وجود حاجة. وجود دورات بلا تقييمات يعني نقص القياس. أسماء الدورات أمثلة من القائمة؛ احتياج نوعي غير ممثل فيها يحتاج سؤالاً أو اختبار طلب مستقلاً.",
      "أمثلة الدورات: حتى 3 دورات لها اهتمام فعلي معلن، مرتبة بالمؤشر ثم الحجز ثم عدد التقييمات ثم المعرّف عند التعادل؛ لا يعني ذلك ثبوت تفوق إحصائي. الرغبة المعلنة ليست مقاعد مباعة أو حجوزات مؤكدة.",
    ],
  };
}

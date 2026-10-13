// Fixed facts about the two-phase study, used to frame the dashboard results.
// Source: SURVEY_SPEC.md §1 (desk study, Phase 1) and §6 (matching framework).
// These are study constants, not survey data — they never change with responses.

export const DESK_STUDY = {
  reports: 82,
  programmes: 430,
  organisations: 11,
  benchmarkedCourses: 427,
  trends: 5,
  shortlist: 34,
  build: 11,
  expand: 16,
  select: 7,
  trainingDays: 99,
  participants: 680,
  catalogueWorkshops: 70,
  catalogueDays: 258,
};

/** The five desk-study trends and the survey domains that test each of them in the field. */
export const TRENDS: { id: number; label: string; shortlisted: number; domains: string }[] = [
  { id: 1, label: "المهارات السلوكية والناعمة", shortlisted: 6, domains: "مصفوفة المهارات S1–S10 · C10 · C11" },
  { id: 2, label: "الذكاء الاصطناعي والأمن السيبراني", shortlisted: 7, domains: "C1 · C2 · C4 · C5" },
  { id: 3, label: "تحليلات الأعمال والبيانات", shortlisted: 6, domains: "C3 · مسار التحليل وذكاء الأعمال" },
  { id: 4, label: "المنشآت الصغيرة والأعمال والإدارة", shortlisted: 8, domains: "C6–C9 · C18–C20" },
  { id: 5, label: "المالية", shortlisted: 7, domains: "C13–C17" },
];

export type Chapter = { id: string; number: number; question: string; method: string };

/** Each dashboard tab answers one research question; the method line states how the numbers were produced. */
export const CHAPTERS: Record<string, Chapter> = {
  overview: { id: "overview", number: 1, question: "من شارك في الاستبانة، وكيف تتوزع العينة؟", method: "عينة طوعية من المؤسسات والأفراد في الكويت؛ تُعرض الأعداد والنسب دون هوامش خطأ سكانية." },
  infographics: { id: "infographics", number: 2, question: "ما أبرز ما كشفته النتائج في لوحة واحدة؟", method: "ملخص بصري بأسلوب الإنفوجرافيك بألوان شعار المركز: العينة، أكبر فجوات المهارات، والورش الأعلى طلباً في كل مجال تدريبي." },
  skills: { id: "skills", number: 3, question: "أين تقع الفجوة بين أهمية المهارة ومستوى الأداء الحالي؟", method: "الفجوة = الأهمية − الأداء على مقياس 1–5. أصحاب العمل يقيّمون فرقهم (B2B) والأفراد يقيّمون أنفسهم (B2C)." },
  courses: { id: "courses", number: 4, question: "ما الدورات التي يطلبها الميدان فعلاً، وأيّها جاهز للحجز؟", method: "مؤشر الاحتياج (0–100) يُحسب فقط بين من عُرضت عليهم الدورة؛ عدم العرض أو التوقف لا يُعدّ غياباً للاحتياج." },
  tracks: { id: "tracks", number: 5, question: "إلى أين تتجه أولويات التدريب خلال 2026/2027؟", method: "ترتيب كامل لستة مسارات لكل مشارك؛ درجة Borda المعيارية (0–100) مع توزيع المراكز." },
  prefs: { id: "prefs", number: 6, question: "كيف يفضّل المشاركون أن يُقدَّم التدريب؟", method: "أسلوب التنفيذ، المدة، التوقيت، اللغة، الاعتماد، وعوامل التميّز التنافسي." },
  segments: { id: "segments", number: 7, question: "أين تختلف الاحتياجات بين الشرائح؟", method: "المؤشرات نفسها محسوبة داخل كل شريحة على حدة؛ الشرائح الأقل من 5 ردود تُعرض للاستئناس فقط." },
  matching: { id: "matching", number: 8, question: "ماذا نُطلق أولاً؟ خريطة الطلب المؤكدة", method: "احتياج الميدان × أدلة الدراسة المكتبية لكل ورشة من ورش الكتالوج الـ 70، مع درجة مركّبة واختبار حساسية." },
  responses: { id: "responses", number: 9, question: "سجل الردود الكامل", method: "الردود المكتملة والمسودات مع عوامل التصفية وعرض تفصيلي لكل رد." },
};

/** Minimum respondents before a segment cell is treated as more than indicative. */
export const LOW_N = 5;

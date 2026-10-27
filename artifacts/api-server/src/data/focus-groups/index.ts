import { GetFocusGroupAnalysisResponse, type FocusGroupSource, type FocusGroupTheme } from "@workspace/api-zod";
import { evidence } from "./evidence";
import { themeSeeds } from "./themes";
import { executiveFindings, issues, recommendations, tensions } from "./findings";

const groups: FocusGroupSource[] = [
  {
    id: "FG1", label: "المجموعة 1", sourceFile: "Meeting1_1793119305697.md", sourceLanguage: "ar",
    context: "سجل بالعربية مع مصطلحات إنجليزية؛ تناول التعليم والعمل المؤسسي والتأمين واحتياجات المشروعات الصغيرة. لا تتوافر قائمة مشاركين موثوقة أو تاريخ جلسة مؤكد.",
    takeaway: "التطوير القيادي والأخلاقيات الرقمية مع احتياجات قطاعية ملموسة: التأمين، والمحاسبة، والتدريب الفني، ونقل الخبرة.",
    distinctiveThemes: ["insurance", "compliance", "technical", "knowledge"],
    evidenceIds: ["g1-lead", "g1-ai", "g1-insurance", "g1-technical"],
  },
  {
    id: "FG2", label: "المجموعة 2", sourceFile: "Meeting2_1793119305697.md", sourceLanguage: "en",
    context: "سجل باللغة الإنجليزية يصف خطط التدريب والتوجيه وESG وقيود التطبيق والإقبال. النص لا يتيح عدّ المتحدثين أو تحديد انتماءاتهم بصورة موثوقة.",
    takeaway: "الموضوع المطلوب يجب أن يصبح برنامجاً مرتبطاً بالوظيفة والسياق الكويتي، مع متابعة تطبيقه؛ والاهتمام لا يضمن الالتحاق.",
    distinctiveThemes: ["esg", "leadership", "ai"],
    evidenceIds: ["g2-uptake", "g2-esg", "g2-transfer-barrier", "g2-local"],
  },
  {
    id: "FG3", label: "المجموعة 3", sourceFile: "Meeting3_1793119305697.md", sourceLanguage: "en",
    context: "سجل باللغة الإنجليزية يتناول تطوير العاملين والمديرين والتحول الرقمي وجاهزية الخريجين واختيار الموردين. أسماء الأشخاص والجهات غير معتمدة في هذا التحليل.",
    takeaway: "بناء المهارة والجاهزية قبل الاكتفاء بالمؤهل: المحللون، والمعينون الجدد، ومسؤولو التدريب، مع أدوات ومدربين مناسبين.",
    distinctiveThemes: ["data", "onboarding", "hr-training", "change"],
    evidenceIds: ["g3-skills", "g3-data", "g3-hr", "g3-software"],
  },
];

const themes: FocusGroupTheme[] = themeSeeds.map((theme) => {
  const coverage = new Set(theme.signals.filter((signal) => signal.status === "explicit").map((signal) => signal.groupId)).size;
  return { ...theme, coverage, priority: coverage === 3 ? "shared" : coverage === 2 ? "targeted" : "specialist" };
});
const sharedThemes = themes.filter((theme) => theme.coverage === groups.length).length;

// A curated, versioned reading of the supplied records; not an LLM call at
// request time. Raw records and this report must never enter the public bundle.
export const focusGroupAnalysis = GetFocusGroupAnalysisResponse.parse({
  analysisDate: "2026-10-27",
  title: "مجموعات التركيز · الاحتياجات التدريبية في الكويت",
  headline: `${sharedThemes} احتياجات مشتركة. والنجاح لا تصنعه الدورة وحدها.`,
  synopsis: "القيادة، والذكاء الاصطناعي، والمهارات الإنسانية، والأمن السيبراني، وإدارة التغيير تشكّل نواة مشتركة. لكن تصميم البرامج حسب الوظيفة، وتيسير الوصول، وجاهزية المؤسسة للتطبيق هي ما يستحق الانتباه قبل توسيع العرض.",
  stats: { groups: groups.length, codedThemes: themes.length, sharedThemes, evidenceExcerpts: evidence.length },
  methodology: {
    approach: "تحليل موضوعي وصفي للمتون الكاملة لثلاثة محاضر، بترميز الاحتياجات والفجوات والعوائق ووجهات النظر المتباينة. جُمعت الموضوعات المتقاربة في عائلات واسعة، ثم رُبطت بمقتطفات محددة. هذا ترميز تحليلي قابل للمراجعة، لا قياس إحصائي لآراء الأفراد.",
    countUnit: "التغطية = عدد المجموعات التي ظهر فيها احتياج أو فجوة مهارية صريحة، من أصل 3. تُحسب المجموعة مرة واحدة لكل عائلة مهما تكرر الحديث أو تعددت مقتطفاته.",
    rankingRule: "الترتيب حسب اتساع التغطية فقط، مع الحفاظ على التعادل. مشترك = 3 مجموعات، موجّه = مجموعتان، متخصص = مجموعة واحدة. الاتساع ليس درجة أهمية أو توقع طلب تجاري.",
    evidenceRule: "المقتطف نص متصل من المتن الأصلي، مع اسم الملف وأرقام أسطره، ومعنى عربي منفصل. الملخصات المسبقة ليست أدلة مستقلة ولا تضاعف العدد؛ قد تساعد فقط على تفسير لفظ مشوّه مع التصريح بذلك.",
    scopeNote: "المحاضر مستقلة عن بيانات الاستبانة ومساري B2B/B2C. عناوين الدورات وصيغ تقديمها والخطة التنفيذية مقترحات تحليلية، وليست مقررات متاحة في الكتالوج أو التزامات متفقاً عليها.",
    limitations: [
      "العينة النوعية محدودة وغير ممثلة إحصائياً لسوق الكويت؛ لا نستنتج حجم سوق أو عدد مقاعد أو نسب تصويت أو إجماع جميع المشاركين.",
      "التفريغ يتضمن تكراراً وأخطاء لغوية ومصطلحات مشوّهة. تُعرض التحفظات بجوار المقتطفات المعنية، وتحتاج القرارات الحساسة مراجعة التسجيل الأصلي إن توفر.",
      "لا تتوافر هوية موثوقة لكل متحدث، ولا عدد مشاركين معتمد أو تاريخ جلسة موثّق؛ تاريخ الصفحة هو تاريخ التحليل فقط.",
      "العائلات واسعة: الاتفاق على القيادة لا يعني الاتفاق على كل دورة فرعية. التصنيف سياق لا يدخل التغطية، وغياب دليل لا يعني معارضة الموضوع أو غياب الطلب.",
      "تشمل الإشارات الصريحة طلبات برامج، ووصف فجوات مهارية، واحتياجات مرتبطة بخطط تدريب قائمة؛ لا تساوي نية شراء جديدة. دورات تدريب المدربين والتأهيل التحليلي أمثلة مقترحة للاستجابة لهذه الإشارات.",
      "لم تُجرَ مراجعة مستقلة من مرمّز ثانٍ أو مقابلات متابعة؛ الأرقام تلخّص هذا الترميز وليست تقديراً لثباته أو يقينه.",
      "الأرقام العرضية التي ذكرها متحدثون ليست مؤشرات سوق متحققة، ولم تُستخدم لبناء نسب التحاق أو عائد أو نجاح.",
      "الأقوال عن اللوائح والاعتماد والشراء وتوافر العرض تُنسب إلى النقاش، لا إلى تحقق قانوني أو مسح سوق. راجع المصادر المختصة قبل التنفيذ.",
    ],
  },
  groups, themes, executiveFindings, issues, tensions, recommendations, evidence,
});

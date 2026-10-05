export type Path = "B2B" | "B2C";
export interface Option { id: string; label: string; exclusive?: boolean; other?: boolean; description?: string; suggested?: boolean }
export interface Skill { id: string; label: string }
export interface Course { id: string; label: string }
export interface CourseGroup { id: string; label: string; courses: Course[] }
export interface Track { id: string; label: string; english?: string }

export const SURVEY_TITLE = "استبانة دراسة التموضع التنافسي والاحتياجات التدريبية في الكويت 2026/2027";
export const SURVEY_INTRO =
  "تهدف هذه الدراسة إلى تصميم برامج تدريبية وتطويرية ترتقي بالكفاءات الوطنية وتواكب تطلعات سوق العمل المتجددة. الإجابات سرية تماماً وتُستخدم للتحليل الإحصائي وتطوير الأعمال فقط. الاستبانة مصممة بنظام الاختيارات السريعة ولن تستغرق سوى 5 إلى 7 دقائق.";
export const CONSENT_TEXT =
  "أوافق على المشاركة في هذه الدراسة، وأتفهم أن البيانات ستُستخدم لأغراض البحث وتطوير الخدمات التدريبية فقط.";
export const CONTACT_INTRO =
  'هذا القسم اختياري تماماً. إذا كنت قد اخترت "أرغب بالحجز فوراً" في أي من الدورات السابقة، أو ترغب في تلقي جدول الدورات القادمة والحصول على خصم التسجيل المُبكر، يُرجى تزويدنا ببياناتك ليقوم فريق المركز بالتواصل معك.';
export const THANK_YOU_TEXT =
  "شُـكراً جزيلاً لمساهمتكم القيّمة في رسم مستقبل التدريب في دولة الكويت. تطلعاتكم هي بوصلتنا نحو التميز.";
export const THANK_YOU_SIGN = "مع تحيات، فريق البحث";

export const SECTION_TITLES = {
  s1: "القسم الأول: البيانات الديموغرافية",
  s2: "القسم الثاني: مسار الشركات والمؤسسات (B2B)",
  s3: "القسم الثالث: مسار الأفراد والمهنيين (B2C)",
  s4: "القسم الرابع: التوجهات والاحتياجات المباشرة",
  s5: "القسم الخامس: بيانات التواصل والحجز (اختياري)",
} as const;

export const CONTACT_FIELDS = {
  name: "الاسم الكريم (أو اسم الجهة)",
  email: "البريد الإلكتروني",
  phone: "رقم هاتف العمل / الواتساب",
};

const o = (id: string, label: string, extra: Partial<Option> = {}): Option => ({ id, label, ...extra });

export const GROUP_LABELS: Record<string, string> = {
  G1: "التحول الرقمي والذكاء الاصطناعي",
  G2: "القيادة والإدارة الاستراتيجية",
  G3: "الموارد البشرية والمهارات الشخصية",
  G4: "المالية، المصرفية، والامتثال",
  G5: "إدارة المشاريع، العقود، والجودة",
  G6: "الجاهزية المهنية والتشغيل (للموظفين والباحثين عن عمل)",
};

export const Q = {
  Q1: { id: "Q1", text: "الجنسية", options: [o("kuwaiti", "كويتي"), o("non_kuwaiti", "غير كويتي")] },
  Q2: { id: "Q2", text: "الجنس", options: [o("male", "ذكر"), o("female", "أنثى")] },
  Q3: {
    id: "Q3", text: "الفئة العمرية",
    options: [o("u30", "أقل من 30 سنة"), o("30_39", "30 - 39 سنة"), o("40_49", "40 - 49 سنة"), o("50p", "50 سنة فأكثر")],
  },
  Q4: {
    id: "Q4", text: "المستوى التعليمي",
    options: [
      o("below_secondary", "دون الثانوية"), o("secondary", "الثانوية أو ما يعادلها"),
      o("diploma", "دبلوم (سنتين بعد الثانوية)"), o("bachelor", "جامعي (بكالوريوس)"),
      o("postgrad", "دراسات عليا (ماجستير / دكتوراه)"), o("professional", "شهادات مهنية احترافية (CPA, CFA, PMP... إلخ)"),
    ],
  },
  Q5: {
    id: "Q5", text: "القطاع الرئيسي لجهة العمل",
    options: [
      o("private", "القطاع الخاص"), o("government", "القطاع الحكومي"),
      o("entrepreneur", "قطاع ريادة الأعمال والمشاريع الخاصة (Business Owner)"),
      o("nonprofit", "القطاع غير الربحي (جمعيات النفع العام، المنظمات الدولية)"),
      o("not_working", "لا أعمل حالياً (طالب / باحث عن عمل)"),
    ],
  },
  Q6: {
    id: "Q6", text: "المستوى الإداري أو الوظيفي الحالي",
    options: [
      o("owner", "مالك عمل تجاري خاص / شريك مؤسس"),
      o("senior", "إدارة عليا / رئيس تنفيذي / عضو مجلس إدارة"),
      o("manager", "مدير إدارة / رئيس قسم / فرع"),
      o("hr", "مسؤول أو أخصائي موارد بشرية وتدريب"),
      o("employee", "موظف تنفيذي / مهني متخصص"),
      o("student", "طالب / باحث عن عمل"),
    ],
  },
  Q7: {
    id: "Q7", text: "طبيعة المشاركة",
    options: [
      o("B2B", "أُجيب بصفتي أمثل جهة عملي (مسار المؤسسات B2B)"),
      o("B2C", "أُجيب بصفتي أمثل نفسي (مسار الأفراد B2C)"),
    ],
    descriptions: {
      B2B: "أشارك بصفتي صانع قرار، صاحب عمل، أو مسؤول يساهم في ميزانية التدريب للشركة.",
      B2C: "طالب، باحث عن عمل، أو موظف أرغب بتطوير مهاراتي شخصياً والتسجيل على حسابي الخاص.",
    } as Record<string, string>,
  },
  Q8: {
    id: "Q8", text: "حجم المؤسسة",
    options: [
      o("micro", "1 - 9 موظفين (متناهية الصغر)"), o("small", "10 - 49 موظفاً (صغيرة)"),
      o("medium", "50 - 249 موظفاً (متوسطة)"), o("large", "250 موظفاً فأكثر (كبرى)"),
    ],
  },
  Q9: {
    id: "Q9", text: "ميزانية التدريب",
    options: [
      o("ready", "نعم، متوفرة وجاهزة"), o("restricted", "متوفرة، ولكن بضوابط وتقليص للمصروفات"),
      o("none", "لا توجد ميزانية معتمدة حالياً"),
    ],
  },
  Q10: {
    id: "Q10", text: "الحلول المؤسسية",
    options: [
      o("academy_box", "أكاديمية مؤسسية داخلية جاهزة (Corporate Academy in a Box)"),
      o("leadership_pipeline", "برنامج إعداد الصف الثاني من القيادات (Leadership Pipeline)"),
      o("functional_academies", "أكاديميات وظيفية متخصصة (للموارد البشرية / المالية / خدمة العملاء)"),
      o("tailored", "برامج مصممة ومفصلة حسب احتياج المؤسسة الدقيق"),
      o("interns", "استقبال متدربين أو إجراء مقابلات لمجتازي مسارات الجاهزية المهنية"),
      o("none", "لا يوجد حالياً", { exclusive: true }),
    ],
  },
  Q11: {
    id: "Q11", text: "قياس العائد على الاستثمار", max: 2,
    options: [
      o("satisfaction", "استبانة تقييم رضا المتدربين بعد الدورة مباشرة"),
      o("application", "تطبيق ما تم تعلمه في بيئة العمل (قياس الأثر بعد 3 أشهر)"),
      o("kpis", "تحسن مؤشرات الأداء الوظيفي (KPIs) وتقارير التقييم السنوية للموظف"),
      o("certification", "الحصول على الشهادة المهنية الدولية واجتياز الاختبارات"),
    ],
  },
  Q14: {
    id: "Q14", text: "فجوة المهارات لفرق العمل",
    importance: "أهمية المهارة لنجاح العمل (1 ضعيف - 5 مهم جداً)",
    performance: "تقييمك لأداء فريقك/موظفيك لتلك المهارة حالياً (1 ضعيف - 5 ممتاز)",
  },
  Q15: {
    id: "Q15", text: "برامج الشباب والجاهزية المهنية",
    options: [
      o("y2b", "من الشباب إلى الأعمال (Youth to Business)"),
      o("mentoring", "الإرشاد المهني مع قيادات الأعمال (Mentoring)"),
      o("internship", "بوابة التدريب العملي في الشركات (Internship Gateway)"),
      o("camp", "معسكر مهارات المستقبل (Future Skills Camp)"),
      o("none", "لا أرغب حالياً", { exclusive: true }),
    ],
  },
  Q18: {
    id: "Q18", text: "فجوة المهارات الشخصية",
    importance: "أهمية المهارة لمستقبلك المهني (1 ضعيف - 5 مهم جداً)",
    performance: "أدائك الفعلي لتلك المهارة حالياً (1 ضعيف - 5 ممتاز)",
  },
  Q19: {
    id: "Q19", text: "أسلوب تقديم التدريب المفضل",
    options: [
      o("center", "حضوري في مقر المركز"), o("onsite", "في مقر عمل الجهة أو الشركة (On-site)"),
      o("live_online", "عن بُعد مباشر (Live Online)"), o("self_paced", "ذاتي التعلم ومسجل (Self-paced)"),
      o("blended", "مدمج (حضوري وعن بُعد)"), o("closed_cohort", "دفعة مغلقة خاصة بالجهة (Closed Cohort)"),
    ],
  },
  Q20: {
    id: "Q20", text: "مدة البرنامج المفضلة",
    options: [
      o("short", "دورة قصيرة (أقل من 3 ساعات)"), o("1_2_days", "من يوم إلى يومين"),
      o("3_5_days", "من 3 إلى 5 أيام"), o("extended", "برنامج ممتد (عدة أسابيع)"),
    ],
  },
  Q21: {
    id: "Q21", text: "الفترة الزمنية المفضلة للتدريب",
    options: [
      o("morning", "صباح أيام العمل (أثناء الدوام)"), o("evening", "مساء أيام العمل (بعد الدوام)"),
      o("weekend", "عطلة نهاية الأسبوع (Weekend)"),
    ],
  },
  Q22: {
    id: "Q22", text: "لغة البرنامج",
    options: [o("arabic", "اللغة العربية"), o("english", "اللغة الإنجليزية"), o("bilingual", "ثنائية اللغة (Bilingual)")],
  },
  Q23: {
    id: "Q23", text: "الشهادة والاعتماد",
    options: [
      o("international", "شهادة معتمدة دولياً (PMI, CIPD...)"), o("university", "اعتماد جامعي"),
      o("technical", "شهادة تقنية من شريك متخصص"), o("readiness", "شهادة جاهزية مهنية باختبار تطبيقي"),
      o("attendance", "شهادة حضور فقط"), o("not_important", "الشهادة غير مهمة بالنسبة لي"),
    ],
  },
  Q24: { id: "Q24", text: "ترتيب المسارات المستقبلية التدريبية", hint: "رتّب المسارات الستة من 1 (الأهم) إلى 6 (الأقل أهمية). اسحب البطاقات أو استخدم الأسهم." },
  Q25G: {
    id: "Q25G", text: "ما المسارات التدريبية التي تهمك؟",
    hint: "اختر مساراً واحداً أو أكثر، وسنعرض لك دورات المسارات التي اخترتها فقط.",
    options: Object.entries(GROUP_LABELS).map(([id, label]) => o(id, label)),
  },
  Q25: {
    id: "Q25", text: "ما مدى رغبتك في التسجيل بالدورات التدريبية التالية خلال الـ 6 أشهر القادمة؟",
    levels: ["غير مهتم", "مهتم مستقبلاً", "أرغب بالحجز فوراً"] as const,
  },
  Q26: {
    id: "Q26", text: "العنصر التنافسي الأهم", max: 3,
    options: [
      o("real_certs", "شهادات واعتمادات مهنية دولية حقيقية وليست شرفية"),
      o("practitioners", "مدربون ممارسون من واقع السوق الكويتي والخليجي بعيداً عن التنظير"),
      o("simulation", "برامج وتطبيقات محاكاة عملية لمعالجة مشكلات حقيقية في الشركات"),
      o("board_programs", "برامج موجهة خصيصاً لتطوير القيادات العليا ومجالس الإدارة"),
      o("customization", "مرونة في تفصيل الحقيبة التدريبية (Customization) حسب احتياجنا"),
      o("packages", "أسعار تنافسية مرنة وعروض خاصة لترشيح المجموعات (Corporate Packages)"),
    ],
  },
};

export const Q5_SUB: Record<string, Option[]> = {
  private: [
    o("real_estate", "العقار"), o("finance_banking", "الخدمات المالية والبنوك"), o("consumer", "السلع والخدمات الاستهلاكية"),
    o("industry", "الصناعة"), o("insurance", "التأمين"), o("energy", "الطاقة"), o("telecom", "الاتصالات"),
    o("healthcare", "الرعاية الصحية"), o("education", "القطاع التعليمي"), o("technology", "التكنولوجيا"),
    o("basic_materials", "المواد الأساسية"), o("oil", "النفط"), o("other", "أخرى (حدد)", { other: true }),
  ],
  government: [
    o("interior", "الداخلية"), o("defense", "الدفاع"), o("foreign", "الخارجية"), o("health", "الصحة"),
    o("education", "التربية"), o("finance", "المالية"), o("oil", "النفط"), o("electricity_water", "الكهرباء والماء"),
    o("public_works", "الأشغال"), o("justice", "العدل"), o("municipality", "البلدية"), o("awqaf", "الأوقاف"),
    o("information", "الإعلام"), o("housing", "الإسكان"), o("other", "هيئات أخرى (حدد)", { other: true }),
  ],
};

export const SKILLS: Skill[] = [
  "التفكير النقدي الإبداعي وحل المشكلات المعقدة",
  "التفاوض والإقناع الإداري وإبرام العقود",
  "إدارة الوقت وترتيب الأولويات والإنتاجية الشخصية",
  "الالتزام بمعايير الحوكمة والرقابة التشغيلية",
  "كتابة التقارير الإدارية والمالية باحترافية",
  "الذكاء العاطفي وإدارة علاقات الزمالة وفرق العمل",
  "المرونة الاستراتيجية النفسية وقيادة التغيير في الأزمات",
  "التفكير الابتكاري وتوظيف التكنولوجيا في بيئة العمل",
  "مهارات التواصل الفعال والعرض والتقديم القيادي",
  "التفكير النقدي والاستباقي وتقييم المخاطر",
].map((label, i) => ({ id: `S${i + 1}`, label }));

/** Retained only for interpreting historical responses; never reuse these IDs. */
export const LEGACY_TRACKS: Track[] = [
  "الذكاء الاصطناعي وأتمتة الأعمال",
  "الحوكمة والاستدامة (ESG)",
  "الأمن السيبراني وحماية البيانات",
  "التحليل المالي وذكاء الأعمال",
  "القيادة وإدارة التغيير والأزمات",
  "التحكيم التجاري وعقود الاستثمار",
].map((label, i) => ({ id: `T${i + 1}`, label }));

export const REPORT_TRACKS: Track[] = [
  { id: "R1", label: "المهارات الشخصية", english: "Soft Skills" },
  { id: "R2", label: "الذكاء الاصطناعي والأمن السيبراني", english: "AI & Cybersecurity" },
  { id: "R3", label: "تحليلات الأعمال وتحليل البيانات", english: "Business Analytics & Data Analytics" },
  { id: "R4", label: "المشروعات الصغيرة والمتوسطة", english: "SME" },
  { id: "R5", label: "تطوير الأعمال والإدارة", english: "Business & Management Development" },
  { id: "R6", label: "المالية", english: "Financial" },
  { id: "R7", label: "الجاهزية المهنية والتوظيف", english: "Career Readiness & Employment" },
];

// Both track questions share the same identifiers and wording.
export const TRACKS: Track[] = Object.entries(GROUP_LABELS).map(([id, label]) => ({ id, label }));

const c = (n: number, label: string): Course => ({ id: `C${n}`, label });
export const COURSE_GROUPS: CourseGroup[] = [
  {
    id: "G1", label: GROUP_LABELS.G1,
    courses: [
      c(1, "هندسة الأوامر وتطبيقات الذكاء الاصطناعي التوليدي"), c(2, "تصميم وبناء وكلاء الذكاء الاصطناعي (AI Agents)"),
      c(3, "سرد القصص بالبيانات وتحليلها (Data Storytelling & Power BI)"), c(4, "أساسيات الحوسبة السحابية (Cloud Computing)"),
      c(5, "التجارة الرقمية والتسويق الرقمي"),
      c(32, "التعاون بين الإنسان والآلة وإعادة تصميم سير العمل"),
      c(33, "الطلاقة في الذكاء الاصطناعي لجميع الوظائف"),
      c(34, "حوكمة الذكاء الاصطناعي في المؤسسات الخاضعة للتنظيم"),
      c(35, "تأمين تطبيقات الذكاء الاصطناعي"),
      c(36, "ممارس التحول الرقمي المعتمد"),
      c(37, "أساسيات الأمن السيبراني لغير المتخصصين"),
      c(38, "الذكاء الاصطناعي للأعمال ودعم اتخاذ القرار"),
      c(39, "محترف المكتب الرقمي بأدوات الذكاء الاصطناعي"),
      c(41, "جودة البيانات وإعدادها"),
      c(42, "حوكمة البيانات والإشراف عليها"),
      c(43, "قياس أثر الذكاء الاصطناعي: خطوط الأساس والتحقق من المكاسب"),
      c(44, "الثقافة البيانية لصنّاع القرار"),
      c(45, "ذكاء الأعمال التطبيقي: من الجداول إلى لوحات المعلومات"),
      c(51, "خارطة طريق نضج البيانات للمنشآت الصغيرة والمتوسطة"),
    ],
  },
  {
    id: "G2", label: GROUP_LABELS.G2,
    courses: [
      c(6, "القيادة الاستراتيجية وبناء الفرق عالية الأداء"), c(7, "شهادة السكرتارية التنفيذية ومدير مكتب القيادي التنفيذي"),
      c(8, "تأهيل مديري مكاتب الوزراء والقيادات الحكومية"), c(9, "عيادة نمو المنشآت الصغيرة والمتوسطة (SME Growth Clinic)"),
      c(46, "المدير بوصفه مضاعفاً للتعلم"),
      c(47, "انضباط القرار التنفيذي في عصر الذكاء الاصطناعي"),
      c(48, "قيادة الفرق الهجينة والمعززة بالذكاء الاصطناعي"),
      c(52, "ريادة الأعمال وتصميم نماذج العمل للمنشآت الصغيرة"),
      c(53, "التخطيط الاستراتيجي وإدارة الأداء"),
      c(54, "تطوير تجربة العميل"),
      c(55, "شهادة مدير مكتب القيادي التنفيذي"),
      c(56, "حوكمة مجالس الإدارات ودور أعضاء المجلس"),
      c(57, "حلقات قيادية متقدمة للقيادات العليا"),
    ],
  },
  {
    id: "G3", label: GROUP_LABELS.G3,
    courses: [
      c(10, "الذكاء العاطفي والمرونة النفسية في بيئة العمل"), c(11, "إدارة المواهب وتوجيه وإرشاد الموظفين (Coaching)"),
      c(12, "الجاهزية للعمل في الموارد البشرية الرقمية (HR Digital Readiness)"),
      c(24, "التفكير النقدي والاستدلال المنظم"),
      c(25, "القدرة على التكيّف والاستعداد للتغيير"),
      c(26, "الحكم المهني في ظل الذكاء الاصطناعي: ما الذي نفوّضه"),
      c(27, "عرض النتائج المدعومة بالذكاء الاصطناعي وكتابتها"),
      c(28, "التفاوض والإقناع المتقدم"),
      c(29, "إدارة الوقت والأولويات والإنتاجية الشخصية"),
      c(30, "المرونة النفسية وإدارة الضغوط"),
      c(31, "الذكاء الاصطناعي في الموارد البشرية: الفرز والعدالة وتجربة المرشحين"),
      c(40, "تحليلات الموارد البشرية"),
      c(49, "تخطيط القوى العاملة ورسم خارطة القدرات"),
    ],
  },
  {
    id: "G4", label: GROUP_LABELS.G4,
    courses: [
      c(13, "مبادئ التمويل الإسلامي والصكوك"), c(14, "مكافحة غسل الأموال وتمويل الإرهاب والامتثال (AML/CFT)"),
      c(15, "تحليل الائتمان وإدارة المخاطر (Credit & Risk Analysis)"), c(16, "التكنولوجيا المالية (FinTech) والمدفوعات الرقمية"),
      c(17, "التمويل والإدارة المالية للمنشآت الصغيرة والمتوسطة"),
      c(58, "الامتثال التنظيمي ومتطلبات الجهات الرقابية"),
      c(59, "الذكاء الاصطناعي لفرق المالية والمحاسبة"),
      c(60, "مخاطر الذكاء الاصطناعي في العمل المصرفي"),
      c(61, "تقييم مخاطر الاستدامة وإعداد التقارير"),
      c(62, "التدقيق الشرعي للمنتجات المصرفية الرقمية"),
      c(63, "مستندات التجارة الرقمية والفوترة الإلكترونية"),
      c(64, "الإدارة المالية لغير الماليين وأساسيات التقارير المالية الدولية"),
      c(65, "أساسيات العمل المصرفي المتقدم والخدمات المالية"),
      c(66, "التحليل المالي المتقدم وإعداد الميزانيات"),
    ],
  },
  {
    id: "G5", label: GROUP_LABELS.G5,
    courses: [
      c(18, "إدارة المشاريع الاحترافية والتميز التشغيلي"), c(19, "سلسلة التحديثات التشريعية والتنظيمية لبيئة الأعمال"),
      c(20, "المشتريات والعقود والتعاقد المؤسسي (Procurement)"),
    ],
  },
  {
    id: "G6", label: GROUP_LABELS.G6,
    courses: [
      c(21, "خدمة العملاء ومراكز الاتصال (Customer Service Readiness)"), c(22, "مشرفو أنظمة وغرف المراقبة الأمنية (CCTV Operations)"),
      c(23, "العمليات اللوجستية والمخازن (Logistics Readiness)"),
      c(50, "تأهيل الخريجين الوطنيين لسوق العمل الخاص"),
      c(67, "التأهيل الإداري والمكاتب الحديثة"),
      c(68, "مساعد مشتريات وعقود"),
      c(69, "مساعد امتثال / مساعد تحليل بيانات إداري"),
      c(70, "منسق مبيعات وتطوير أعمال"),
    ],
  },
];
export const ALL_COURSES: Course[] = COURSE_GROUPS.flatMap((g) => g.courses);

/* ---------- label lookups (for dashboard) ---------- */
export const QUESTION_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(Q).map((q) => [q.id, q.text]),
);
export const OPTION_LABELS: Record<string, Record<string, string>> = Object.fromEntries(
  Object.values(Q)
    .filter((q): q is typeof q & { options: Option[] } => "options" in q)
    .map((q) => [q.id, Object.fromEntries(q.options.map((op) => [op.id, op.label]))]),
);
export const SUB_LABELS: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(Q5_SUB).map(([k, v]) => [k, Object.fromEntries(v.map((op) => [op.id, op.label]))]),
);
export const SKILL_LABELS: Record<string, string> = Object.fromEntries(SKILLS.map((s) => [s.id, s.label]));
export const TRACK_LABELS: Record<string, string> = Object.fromEntries([...LEGACY_TRACKS, ...REPORT_TRACKS, ...TRACKS].map((s) => [s.id, s.label]));
export const COURSE_LABELS: Record<string, string> = Object.fromEntries(ALL_COURSES.map((s) => [s.id, s.label]));
export const LEVEL_LABELS = Q.Q25.levels;
export const optionLabel = (qid: string, id: string) => OPTION_LABELS[qid]?.[id] ?? id;

/* ---------- answer types ---------- */
export type Rating = { importance?: number; performance?: number };
export interface Q5Answer { sector?: string; sub?: string; other?: string }
export interface Answers {
  Q1?: string; Q2?: string; Q3?: string; Q4?: string; Q5?: Q5Answer; Q6?: string; Q7?: Path;
  Q8?: string; Q9?: string; Q10?: string[]; Q11?: string[]; Q14?: Record<string, Rating>;
  Q15?: string[]; Q18?: Record<string, Rating>;
  Q19?: string[]; Q20?: string[]; Q21?: string[]; Q22?: string; Q23?: string;
  Q24?: string[]; Q25G?: string[]; Q25?: Record<string, 0 | 1 | 2>; Q26?: string[];
}

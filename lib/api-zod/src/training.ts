/** Topic-level priorities are not ratings of every mapped workshop. */
export const TRAINING_MODE = "topics-v1" as const;
export interface TrainingTopic { id: string; group: string; label: string; courses: string[] }
export const TRAINING_TOPICS: TrainingTopic[] = [
  { id: "TP01", group: "G1", label: "تطبيقات الذكاء الاصطناعي وهندسة الأوامر", courses: ["C1", "C33", "C38"] },
  { id: "TP02", group: "G1", label: "وكلاء الذكاء الاصطناعي وأتمتة العمل", courses: ["C2", "C32", "C39"] },
  { id: "TP03", group: "G1", label: "تحليل البيانات وذكاء الأعمال", courses: ["C3", "C41", "C43", "C44", "C45"] },
  { id: "TP04", group: "G1", label: "الأمن السيبراني وحوكمة البيانات والذكاء الاصطناعي", courses: ["C34", "C35", "C37", "C42"] },
  { id: "TP05", group: "G1", label: "التحول الرقمي والحوسبة السحابية والتجارة الرقمية", courses: ["C4", "C5", "C36", "C51"] },
  { id: "TP06", group: "G2", label: "القيادة وبناء الفرق وتطوير المديرين", courses: ["C6", "C46", "C48", "C57"] },
  { id: "TP07", group: "G2", label: "التخطيط الاستراتيجي واتخاذ القرار", courses: ["C47", "C53"] },
  { id: "TP08", group: "G2", label: "إدارة المكاتب التنفيذية والقيادات الحكومية", courses: ["C7", "C8", "C55"] },
  { id: "TP09", group: "G2", label: "ريادة الأعمال ونمو المنشآت الصغيرة والمتوسطة", courses: ["C9", "C52"] },
  { id: "TP10", group: "G2", label: "حوكمة مجالس الإدارات", courses: ["C56"] },
  { id: "TP11", group: "G2", label: "تطوير تجربة العميل", courses: ["C54"] },
  { id: "TP12", group: "G3", label: "التواصل والعرض والذكاء العاطفي", courses: ["C10", "C27"] },
  { id: "TP13", group: "G3", label: "التفكير النقدي والحكم المهني", courses: ["C24", "C26"] },
  { id: "TP14", group: "G3", label: "تطوير المواهب والإرشاد وتخطيط القوى العاملة", courses: ["C11", "C49"] },
  { id: "TP15", group: "G3", label: "الموارد البشرية الرقمية وتحليلات الموظفين", courses: ["C12", "C31", "C40"] },
  { id: "TP16", group: "G3", label: "التفاوض والإقناع", courses: ["C28"] },
  { id: "TP17", group: "G3", label: "إدارة الوقت والإنتاجية والمرونة النفسية", courses: ["C25", "C29", "C30"] },
  { id: "TP18", group: "G4", label: "التمويل الإسلامي والصكوك والتدقيق الشرعي", courses: ["C13", "C62"] },
  { id: "TP19", group: "G4", label: "الامتثال ومكافحة غسل الأموال", courses: ["C14", "C58"] },
  { id: "TP20", group: "G4", label: "التحليل المالي والائتماني وإدارة المخاطر والاستدامة", courses: ["C15", "C60", "C61", "C66"] },
  { id: "TP21", group: "G4", label: "التكنولوجيا المالية والمدفوعات ومستندات التجارة الرقمية", courses: ["C16", "C63"] },
  { id: "TP22", group: "G4", label: "التمويل والإدارة المالية وأساسيات العمل المصرفي", courses: ["C17", "C64", "C65"] },
  { id: "TP23", group: "G4", label: "الذكاء الاصطناعي في المالية والمحاسبة", courses: ["C59"] },
  { id: "TP24", group: "G5", label: "إدارة المشاريع والتميز التشغيلي", courses: ["C18"] },
  { id: "TP25", group: "G5", label: "التحديثات التشريعية والتنظيمية لبيئة الأعمال", courses: ["C19"] },
  { id: "TP26", group: "G5", label: "المشتريات والعقود والتعاقد المؤسسي", courses: ["C20"] },
  { id: "TP27", group: "G6", label: "التأهيل الإداري والمكاتب الحديثة", courses: ["C67"] },
  { id: "TP28", group: "G6", label: "خدمة العملاء والمبيعات وتطوير الأعمال", courses: ["C21", "C70"] },
  { id: "TP29", group: "G6", label: "تشغيل أنظمة وغرف المراقبة الأمنية", courses: ["C22"] },
  { id: "TP30", group: "G6", label: "دعم المشتريات والعمليات اللوجستية والمخازن", courses: ["C23", "C68"] },
  { id: "TP31", group: "G6", label: "تأهيل الخريجين لسوق العمل الخاص", courses: ["C50"] },
  { id: "TP32", group: "G6", label: "دعم الامتثال وتحليل البيانات الإدارية", courses: ["C69"] },
];

export const topicOptions = (groups: string[] = []) => TRAINING_TOPICS.filter((t) => groups.includes(t.group));

/** Round-robin across chosen topics: each priority is represented before extras. */
export function recommendedCourseIds(topics: string[] = []): string[] {
  const selected = topics.map((id) => TRAINING_TOPICS.find((t) => t.id === id)).filter((t): t is TrainingTopic => !!t);
  const result: string[] = [];
  for (let index = 0; index < 5 && result.length < 5; index++) {
    for (const t of selected) {
      const course = t.courses[index];
      if (course && !result.includes(course)) result.push(course);
      if (result.length === 5) break;
    }
  }
  return result;
}

export interface ShortTrainingAnswers {
  Q25Mode?: string; Q25G?: string[]; Q25T?: string[]; Q25I?: string[]; Q25Shown?: string[];
  Q25?: unknown;
}
export function normalizeShortTraining<T extends ShortTrainingAnswers>(a: T): T {
  const groups = [...new Set(a.Q25G ?? [])].filter((id) => /^G[1-6]$/.test(id)).slice(0, 2);
  const allowed = topicOptions(groups).map((t) => t.id);
  const topics = [...new Set(a.Q25T ?? [])].filter((id) => allowed.includes(id)).slice(0, 3);
  const shown = recommendedCourseIds(topics);
  return { ...a, Q25Mode: TRAINING_MODE, Q25: undefined, Q25G: groups, Q25T: topics,
    Q25Shown: shown, Q25I: [...new Set(a.Q25I ?? [])].filter((id) => shown.includes(id)) };
}

export function shortTrainingErrors(a: ShortTrainingAnswers, required = true): Record<string, string> {
  const errors: Record<string, string> = {};
  const groups = a.Q25G ?? [];
  const topics = a.Q25T ?? [];
  if ((required && !groups.length) || groups.length > 2 || new Set(groups).size !== groups.length || groups.some((g) => !/^G[1-6]$/.test(g)))
    errors.Q25G = "اختر مساراً واحداً أو مسارين فقط";
  const allowed = topicOptions(groups).map((t) => t.id);
  if ((required && !topics.length) || topics.length > 3 || new Set(topics).size !== topics.length || topics.some((id) => !allowed.includes(id)))
    errors.Q25T = "اختر من موضوع واحد إلى ثلاثة موضوعات من المسارات المختارة";
  const recommendations = recommendedCourseIds(topics);
  if ((a.Q25I ?? []).some((id) => !recommendations.includes(id)) || new Set(a.Q25I ?? []).size !== (a.Q25I ?? []).length)
    errors.Q25I = "اختر الدورات من القائمة المقترحة فقط";
  if (a.Q25Shown && (a.Q25Shown.length !== recommendations.length || a.Q25Shown.some((id, i) => id !== recommendations[i])))
    errors.Q25I = "يرجى تحديث قائمة الدورات المقترحة";
  return errors;
}
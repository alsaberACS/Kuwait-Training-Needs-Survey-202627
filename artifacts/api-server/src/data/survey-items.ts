// Stable survey item ids shared with the frontend definition module, plus the
// item -> catalogue workshop mapping from the desk study (SURVEY_SPEC.md §6).

export const SKILLS: Record<string, string> = {
  S1: "التفكير النقدي الإبداعي وحل المشكلات المعقدة",
  S2: "التفاوض والإقناع الإداري وإبرام العقود",
  S3: "إدارة الوقت وترتيب الأولويات والإنتاجية الشخصية",
  S4: "الالتزام بمعايير الحوكمة والرقابة التشغيلية",
  S5: "كتابة التقارير الإدارية والمالية باحترافية",
  S6: "الذكاء العاطفي وإدارة علاقات الزمالة وفرق العمل",
  S7: "المرونة الاستراتيجية النفسية وقيادة التغيير في الأزمات",
  S8: "التفكير الابتكاري وتوظيف التكنولوجيا في بيئة العمل",
  S9: "مهارات التواصل الفعال والعرض والتقديم القيادي",
  S10: "التفكير النقدي والاستباقي وتقييم المخاطر",
};

export const COURSE_GROUPS: Record<string, string> = {
  G1: "التحول الرقمي والذكاء الاصطناعي",
  G2: "القيادة والإدارة الاستراتيجية",
  G3: "الموارد البشرية والمهارات الشخصية",
  G4: "المالية، المصرفية، والامتثال",
  G5: "إدارة المشاريع، العقود، والجودة",
  G6: "الجاهزية المهنية والتشغيل (للموظفين والباحثين عن عمل)",
};

export const COURSES: Record<string, { label: string; group: string }> = {
  C1: { label: "هندسة الأوامر وتطبيقات الذكاء الاصطناعي التوليدي", group: "G1" },
  C2: { label: "تصميم وبناء وكلاء الذكاء الاصطناعي (AI Agents)", group: "G1" },
  C3: { label: "سرد القصص بالبيانات وتحليلها (Data Storytelling & Power BI)", group: "G1" },
  C4: { label: "أساسيات الحوسبة السحابية (Cloud Computing)", group: "G1" },
  C5: { label: "التجارة الرقمية والتسويق الرقمي", group: "G1" },
  C6: { label: "القيادة الاستراتيجية وبناء الفرق عالية الأداء", group: "G2" },
  C7: { label: "شهادة السكرتارية التنفيذية ومدير مكتب القيادي التنفيذي", group: "G2" },
  C8: { label: "تأهيل مديري مكاتب الوزراء والقيادات الحكومية", group: "G2" },
  C9: { label: "عيادة نمو المنشآت الصغيرة والمتوسطة (SME Growth Clinic)", group: "G2" },
  C10: { label: "الذكاء العاطفي والمرونة النفسية في بيئة العمل", group: "G3" },
  C11: { label: "إدارة المواهب وتوجيه وإرشاد الموظفين (Coaching)", group: "G3" },
  C12: { label: "الجاهزية للعمل في الموارد البشرية الرقمية (HR Digital Readiness)", group: "G3" },
  C13: { label: "مبادئ التمويل الإسلامي والصكوك", group: "G4" },
  C14: { label: "مكافحة غسل الأموال وتمويل الإرهاب والامتثال (AML/CFT)", group: "G4" },
  C15: { label: "تحليل الائتمان وإدارة المخاطر (Credit & Risk Analysis)", group: "G4" },
  C16: { label: "التكنولوجيا المالية (FinTech) والمدفوعات الرقمية", group: "G4" },
  C17: { label: "التمويل والإدارة المالية للمنشآت الصغيرة والمتوسطة", group: "G4" },
  C18: { label: "إدارة المشاريع الاحترافية والتميز التشغيلي", group: "G5" },
  C19: { label: "سلسلة التحديثات التشريعية والتنظيمية لبيئة الأعمال", group: "G5" },
  C20: { label: "المشتريات والعقود والتعاقد المؤسسي (Procurement)", group: "G5" },
  C21: { label: "خدمة العملاء ومراكز الاتصال (Customer Service Readiness)", group: "G6" },
  C22: { label: "مشرفو أنظمة وغرف المراقبة الأمنية (CCTV Operations)", group: "G6" },
  C23: { label: "العمليات اللوجستية والمخازن (Logistics Readiness)", group: "G6" },
};

export const TRACKS: Record<string, string> = {
  T1: "الذكاء الاصطناعي وأتمتة الأعمال",
  T2: "الحوكمة والاستدامة (ESG)",
  T3: "الأمن السيبراني وحماية البيانات",
  T4: "التحليل المالي وذكاء الأعمال",
  T5: "القيادة وإدارة التغيير والأزمات",
  T6: "التحكيم التجاري وعقود الاستثمار",
};

export const QUESTION_LABELS: Record<string, string> = {
  Q1: "الجنسية", Q2: "الجنس", Q3: "الفئة العمرية", Q4: "المستوى التعليمي",
  Q5: "القطاع الرئيسي لجهة العمل", Q6: "المستوى الإداري أو الوظيفي الحالي", Q7: "طبيعة المشاركة",
  Q8: "حجم المؤسسة", Q9: "ميزانية التدريب", Q10: "الحلول المؤسسية", Q11: "قياس العائد على الاستثمار",
  Q15: "برامج الشباب والجاهزية المهنية", Q19: "أسلوب تقديم التدريب المفضل", Q20: "مدة البرنامج",
  Q21: "الفترة الزمنية", Q22: "لغة البرنامج", Q23: "الشهادة والاعتماد", Q26: "العنصر التنافسي الأهم",
};

export const SECTION_LABELS: Record<number, string> = {
  0: "الموافقة", 1: "البيانات الديموغرافية", 2: "مسار الشركات / الأفراد", 3: "التوجهات والاحتياجات", 4: "بيانات التواصل", 5: "اكتمل",
};

// Survey item -> catalogue workshop titles (primary first). Matching uses the
// primary link for scoring and secondary links for interpretation.
export const ITEM_WORKSHOPS: Record<string, string[]> = {
  C1: ["Prompt and Workflow Design", "AI Fluency for Every Role"],
  C2: ["Supervising AI Agents", "Human–AI Collaboration and Workflow Redesign"],
  C3: ["Data Storytelling", "Applied Business Intelligence: From Spreadsheets to Dashboards"],
  C4: ["Cloud Computing and Infrastructure Fundamentals"],
  C5: ["Digital Commerce and Digital Marketing for Enterprises"],
  C6: ["Strategic Leadership and High-Performance Teams"],
  C7: ["Executive Secretarial and Office Management", "Executive Office Leadership Certificate"],
  C8: ["Public Sector Office Leadership"],
  C9: ["SME Growth Clinic"],
  C10: ["Professional Communication, Presentation and Emotional Intelligence", "Resilience and Stress Management"],
  C11: ["Coaching Skills for Line Managers"],
  C12: ["HR Digital Readiness"],
  C13: ["Islamic Finance and Sukuk Fundamentals"],
  C14: ["AML/CFT in an AI-Enabled Environment"],
  C15: ["Credit and Risk Analysis"],
  C16: ["FinTech and Digital Payments"],
  C17: ["Finance for SMEs"],
  C18: ["Project Management Essentials (PMP-aligned)"],
  C19: ["Business Update Series", "Regulatory Compliance"],
  C20: ["Procurement, Contracts and Institutional Contracting"],
  C21: ["Customer Service Readiness"],
  C22: ["CCTV Operations Readiness"],
  C23: ["Logistics Readiness"],
  S1: ["Critical Thinking and Structured Reasoning"],
  S2: ["Advanced Negotiation and Persuasion"],
  S3: ["Time and Priority Management and Personal Productivity"],
  S4: ["Regulatory Compliance", "Board and Corporate Governance"],
  S5: ["Finance for Non-Financial Managers and IFRS Reporting Essentials"],
  S6: ["Professional Communication, Presentation and Emotional Intelligence"],
  S7: ["Adaptability and Change Readiness", "Resilience and Stress Management"],
  S8: ["AI Fluency for Every Role", "Human–AI Collaboration and Workflow Redesign"],
  S9: ["Presenting a Machine-Assisted Conclusion"],
  S10: ["Judgement Under AI: Deciding What to Delegate"],
  T1: ["AI for Business and Decision Support", "AI Office Professional"],
  T2: ["ESG Risk Assessment and Reporting", "Board and Corporate Governance"],
  T3: ["Cybersecurity Essentials for Non-Technical Staff", "Securing AI Deployments"],
  T4: ["Advanced Financial Analysis and Budgeting", "Applied Business Intelligence: From Spreadsheets to Dashboards"],
  T5: ["Strategic Leadership and High-Performance Teams", "Adaptability and Change Readiness"],
  T6: [],
};

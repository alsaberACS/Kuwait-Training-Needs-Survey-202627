/**
 * Project document library («المخرجات»): the contract plus every deliverable
 * handed to the Chamber so far. Files live in artifacts/api-server/documents/
 * and are served only through the admin-key-protected API (the contract has
 * financial terms, so nothing here may enter the public bundle).
 *
 * Each entry maps a document to the contract phases (المادة 3) it serves so the
 * dashboard and the progress reports read the same mapping.
 */
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type DeliverableCategory = "contract" | "deliverable" | "instrument" | "report";

export type DeliverableSeed = {
  id: string;
  file: string;
  category: DeliverableCategory;
  title: string;
  subtitle: string;
  reference: string | null;
  issuedOn: string;
  issuedLabel: string;
  pages: number;
  phases: number[];
  contractDeliverable: string | null;
  highlights: string[];
};

export type Deliverable = DeliverableSeed & { sizeBytes: number };

const here = path.dirname(fileURLToPath(import.meta.url));
// src/data/* at test time, dist/index.mjs once bundled; both sit inside the artifact.
const candidates = [path.resolve(here, "../../documents"), path.resolve(here, "../documents"), path.resolve(process.cwd(), "documents")];
const found = candidates.find((dir) => existsSync(dir));
if (!found) throw new Error(`deliverables: documents folder not found (looked in ${candidates.join(", ")})`);
export const documentsDir: string = found;

export const CONTRACT_PHASES: { number: number; title: string }[] = [
  { number: 1, title: "الاجتماع التمهيدي وإطلاق المشروع" },
  { number: 2, title: "جمع المعلومات الميدانية (المقابلات والاستبانات) وتحديد فجوة المهارات" },
  { number: 3, title: "تحليل المنافسين وبناء مصفوفة التموضع الاستراتيجي" },
  { number: 4, title: "استراتيجية الدورات والهيكل التنظيمي المقترح" },
  { number: 5, title: "قواعد البيانات ولوحة التحكم التفاعلية وتدريب فريق الغرفة" },
  { number: 6, title: "دراسة تسعير الدورات ونماذج السيناريوهات ونقطة التعادل" },
  { number: 7, title: "الدراسة التسويقية وخطة الوصول إلى السوق" },
  { number: 8, title: "النموذج المالي ودراسة الجدوى الاقتصادية" },
  { number: 9, title: "تحليل المخاطر ومنظومة مؤشرات الأداء الرئيسية" },
  { number: 10, title: "التقرير النهائي والعرض التقديمي وورشة عرض النتائج" },
];

const seeds: DeliverableSeed[] = [
  {
    id: "contract-asia-kcci-2026-001",
    file: "01-consulting-services-contract-asia-kcci-2026-001.pdf",
    category: "contract",
    title: "عقد تقديم خدمات استشارية",
    subtitle: "إعداد دراسة سوق قطاع التدريب في دولة الكويت والدراسة الاستراتيجية لتطوير مركز عبدالعزيز حمد الصقر للتنمية والتطوير",
    reference: "ASIA-KCCI-2026/001",
    issuedOn: "2026-09-01",
    issuedLabel: "بدء التنفيذ 1 سبتمبر 2026",
    pages: 6,
    phases: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    contractDeliverable: null,
    highlights: [
      "عشر مراحل منهجية متكاملة (المادة 3) وجدول زمني من ثمانية أسابيع (المادة 4)",
      "ست فئات من المخرجات المسلّمة تنتهي بالتقرير النهائي وورشة عرض النتائج",
      "التزامات الطرفين (المادتان 6 و7) ومحطات التسليم المرحلية",
    ],
  },
  {
    id: "desk-study-phase-1",
    file: "02-desk-study-phase-1-training-needs-assessment.pdf",
    category: "deliverable",
    title: "الدراسة المكتبية — المرحلة الأولى",
    subtitle: "تقييم الاحتياجات التدريبية في دولة الكويت: خمسة اتجاهات تدريبية تفرضها الأدلة، وأربع وثلاثون ورشة معروضة للاعتماد، وخريطة أولويات",
    reference: "المرحلة الأولى من أربع — فحص الأدلة",
    issuedOn: "2026-09-25",
    issuedLabel: "سبتمبر 2026",
    pages: 35,
    phases: [2, 3],
    contractDeliverable: "تقرير اتجاهات التدريب وخريطة فجوة المهارات، استناداً إلى التقارير الدولية والمحلية",
    highlights: [
      "82 تقريراً بحثياً و430 برنامجاً تدريبياً معلناً لدى 11 جهة كويتية",
      "427 دورة مرجعية من 22 غرفة ومعهداً في 12 دولة",
      "34 ورشة مختصرة بواقع 99 يوماً تدريبياً وخمسة اتجاهات حاكمة",
    ],
  },
  {
    id: "proposed-courses-catalogue",
    file: "03-proposed-courses-training-catalogue-2026-27.pdf",
    category: "deliverable",
    title: "الدورات المقترحة حسب الدراسات المكتبية",
    subtitle: "كتالوج التدريب 2026/27 — محفظة قائمة على الأدلة لورش وبرامج موجهة للحكومة والقطاع المصرفي والأعمال والمشروعات الصغيرة والمتوسطة",
    reference: "Training Catalogue 2026/27",
    issuedOn: "2026-09-24",
    issuedLabel: "سبتمبر 2026",
    pages: 32,
    phases: [4],
    contractDeliverable: "استراتيجية محفظة الدورات",
    highlights: [
      "70 ورشة وبرنامجاً في 6 فئات تدريبية بواقع 258 يوماً تدريبياً",
      "المرجع المعتمد لقائمة الدورات في الاستبانة الإلكترونية (C1–C70)",
      "أساس محرك المطابقة بين احتياج الميدان وأدلة الدراسة المكتبية",
    ],
  },
  {
    id: "regulatory-foundation-phase-1",
    file: "04-regulatory-foundation-phase-1.pdf",
    category: "deliverable",
    title: "الأساس التنظيمي — المرحلة الأولى",
    subtitle: "الأساس التنظيمي لإعادة تموضع المركز: ما الذي يستطيع المركز فعله اليوم، وما الذي يتطلب قراراً من الغرفة",
    reference: "الإصدار 1.0 — أمر التكليف EX1",
    issuedOn: "2026-09-21",
    issuedLabel: "21 سبتمبر 2026",
    pages: 29,
    phases: [4],
    contractDeliverable: "الهيكل التنظيمي المقترح (الأساس التنظيمي الممهّد له)",
    highlights: [
      "ثلاث وثائق مرجعية وخلاصة تنفيذية للأسابيع 1–3",
      "6 قرارات تُعرض على الغرفة و12 إجراءً خلال 90 يوماً",
      "مصفوفة مواءمة مع اللائحة من 16 مادة ومسار اعتماد الرسوم",
    ],
  },
  {
    id: "questionnaire-first-edition",
    file: "05-training-needs-questionnaire-first-edition.pdf",
    category: "instrument",
    title: "استبانة الاحتياجات التدريبية — النسخة الأولى",
    subtitle: "النسخة الورقية الأولى لأداة جمع البيانات الميدانية قبل تحويلها إلى استبانة إلكترونية متفرعة",
    reference: "نسخة ورقية",
    issuedOn: "2026-09-13",
    issuedLabel: "سبتمبر 2026",
    pages: 2,
    phases: [2],
    contractDeliverable: "تقرير نتائج المسح الميداني (أداة الجمع)",
    highlights: [
      "أقسام البيانات الأساسية والمهارات والدورات وتفضيلات التنفيذ",
      "أساس بنود المهارات S1–S10 والمسارات الستة في النسخة الإلكترونية",
    ],
  },
  {
    id: "questionnaire-print-edition",
    file: "06-questionnaire-print-edition-2026-2027.pdf",
    category: "instrument",
    title: "الاستبانة الإلكترونية — النسخة المطبوعة 2026/2027",
    subtitle: "استبانة دراسة التموضع التنافسي والاحتياجات التدريبية في الكويت: مساران (أصحاب العمل / الأفراد) و19 سؤالاً بترقيم متصل",
    reference: "مولَّدة من تعريف الاستبانة الحي",
    issuedOn: "2026-10-09",
    issuedLabel: "أكتوبر 2026",
    pages: 12,
    phases: [2],
    contractDeliverable: "تقرير نتائج المسح الميداني (أداة الجمع)",
    highlights: [
      "تفرّع ذكي بين مسار المؤسسات ومسار الأفراد مع حفظ تلقائي واستئناف",
      "70 ورشة في 6 مجالات، و10 مهارات بمقياس الأهمية مقابل الأداء",
    ],
  },
  {
    id: "progress-report-2026-10",
    file: "07-progress-report-2026-10-31.pdf",
    category: "report",
    title: "تقرير سير العمل الأول",
    subtitle: "مرفوع إلى المدير العام لغرفة تجارة وصناعة الكويت عن الفترة من 1 سبتمبر إلى 31 أكتوبر 2026 — ما أُنجز مقابل مراحل العقد العشر",
    reference: "تقرير متابعة دوري — المادة 6",
    issuedOn: "2026-10-31",
    issuedLabel: "31 أكتوبر 2026",
    pages: 5,
    phases: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    contractDeliverable: "تقارير المتابعة الدورية",
    highlights: [
      "لوحة حالة المراحل العشر ومصفوفة المخرجات المسلّمة مقابل مخرجات العقد",
      "حصيلة العمل الميداني: الاستبانة الإلكترونية والمجموعات البؤرية والتحليلات",
      "الخطوات التالية ومتطلبات التنسيق مع الغرفة",
    ],
  },
];

const ids = new Set<string>();
for (const seed of seeds) {
  if (ids.has(seed.id)) throw new Error(`deliverables: duplicate id ${seed.id}`);
  ids.add(seed.id);
  if (!/^[a-z0-9-]+\.pdf$/.test(seed.file)) throw new Error(`deliverables: unsafe file name ${seed.file}`);
}

/** Only documents that physically exist are listed; a missing file is logged at startup rather than served as a broken link. */
export const deliverables: Deliverable[] = seeds.flatMap((seed) => {
  const full = path.join(documentsDir, seed.file);
  if (!existsSync(full)) {
    console.error(`deliverables: ${seed.file} is missing from ${documentsDir}; "${seed.title}" will not be listed`);
    return [];
  }
  return [{ ...seed, sizeBytes: statSync(full).size }];
});

export function deliverableFilePath(id: string): string | null {
  const doc = deliverables.find((d) => d.id === id);
  return doc ? path.join(documentsDir, doc.file) : null;
}

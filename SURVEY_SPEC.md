# Kuwait Training Needs Survey System 2026/2027 — Build Spec

Source files (all in `attached_assets/`):
- Questionnaire (authoritative Arabic text): `استبانة_دراسة_التموضع_التنافسي_والاحتياجات_التدريبية_2026-_بع_*.docx`
- Desk study, Phase 1 (research objectives, trends, matching method): `الدراسة_المكتبية_-_المرحلة_الاولى_*.pdf` → text at `extracted/desk_study_phase1.txt`
- Training Catalogue 2026/27 (70 workshops, the matching targets): `الدورات_المقترحة_حسب_الدراسات_المكتبية_*.pdf` → text at `extracted/training_catalogue_2026_27.txt`

## 1. Context

- Study: "تقييم الاحتياجات التدريبية في دولة الكويت" by ASIA Consulting & Training for Kuwait Chamber of Commerce & Industry — Abdulaziz Hamad Al-Sagar Development Center (ASDC). Contract ASIA-KCCI-2026/001, Sept 2026.
- Phase 1 (done, desk study): 82 reports, 430 planned programmes at 11 Kuwaiti organisations, 427 benchmarked courses → **5 evidence-based trends** and a **shortlist of 34 workshops** (11 Build / 16 Expand / 7 Select by local-supply status), 99 training days, 680 participants year 1.
- Phase 2 (this system): field survey of Kuwaiti stakeholders → "confirmed demand map" → match field need against desk evidence → prioritised workshop portfolio.
- Four stakeholder groups: G Government, P Private sector, S SMEs, I Individuals.

## 2. Deliverables

1. **Public survey** — Arabic, RTL, mobile-first, 5–7 minutes, smart branching, autosave/resume, thank-you screen.
2. **Admin dashboard** — responses, completion/drop-off, segment filters (path B2B/B2C, sector, org size, nationality, gender, age, education, job level), skills-gap heatmap (importance vs performance), course-demand table, rank results, CSV/XLSX export.
3. **Matching engine** (next step after survey is live; data model must support it from day one) — see §6.

## 3. Survey flow and logic (exact Arabic text from the questionnaire)

Display numbering should be sequential per path (the source skips Q12, Q13, Q16, Q17 — keep original IDs internally, show clean numbers to respondents).

### Intro + consent (all)
Title: **استبانة دراسة التموضع التنافسي والاحتياجات التدريبية في الكويت 2026/2027**

Intro: تهدف هذه الدراسة إلى تصميم برامج تدريبية وتطويرية ترتقي بالكفاءات الوطنية وتواكب تطلعات سوق العمل المتجددة. الإجابات سرية تماماً وتُستخدم للتحليل الإحصائي وتطوير الأعمال فقط. الاستبانة مصممة بنظام الاختيارات السريعة ولن تستغرق سوى 5 إلى 7 دقائق.

Consent (required to proceed): أوافق على المشاركة في هذه الدراسة، وأتفهم أن البيانات ستُستخدم لأغراض البحث وتطوير الخدمات التدريبية فقط.

### القسم الأول: البيانات الديموغرافية (all)
- **Q1 الجنسية** (single): كويتي | غير كويتي
- **Q2 الجنس** (single): ذكر | أنثى
- **Q3 الفئة العمرية** (single): أقل من 30 سنة | 30 - 39 سنة | 40 - 49 سنة | 50 سنة فأكثر
- **Q4 المستوى التعليمي** (single): دون الثانوية | الثانوية أو ما يعادلها | دبلوم (سنتين بعد الثانوية) | جامعي (بكالوريوس) | دراسات عليا (ماجستير / دكتوراه) | شهادات مهنية احترافية (CPA, CFA, PMP... إلخ)
- **Q5 القطاع الرئيسي لجهة العمل** (single, with conditional sub-list):
  - القطاع الخاص → sub-list (single): العقار | الخدمات المالية والبنوك | السلع والخدمات الاستهلاكية | الصناعة | التأمين | الطاقة | الاتصالات | الرعاية الصحية | القطاع التعليمي | التكنولوجيا | المواد الأساسية | النفط | أخرى (حدد)
  - القطاع الحكومي → sub-list (single): الداخلية | الدفاع | الخارجية | الصحة | التربية | المالية | النفط | الكهرباء والماء | الأشغال | العدل | البلدية | الأوقاف | الإعلام | الإسكان | هيئات أخرى (حدد)
  - قطاع ريادة الأعمال والمشاريع الخاصة (Business Owner)
  - القطاع غير الربحي (جمعيات النفع العام، المنظمات الدولية)
  - لا أعمل حالياً (طالب / باحث عن عمل)
- **Q6 المستوى الإداري أو الوظيفي الحالي** (single): مالك عمل تجاري خاص / شريك مؤسس | إدارة عليا / رئيس تنفيذي / عضو مجلس إدارة | مدير إدارة / رئيس قسم / فرع | مسؤول أو أخصائي موارد بشرية وتدريب | موظف تنفيذي / مهني متخصص | طالب / باحث عن عمل
- **Q7 طبيعة المشاركة — Logic Jump Trigger** (single, two large cards):
  - **B2B**: أُجيب بصفتي أمثل جهة عملي (مسار المؤسسات B2B): أشارك بصفتي صانع قرار، صاحب عمل، أو مسؤول يساهم في ميزانية التدريب للشركة. → Section 2
  - **B2C**: أُجيب بصفتي أمثل نفسي (مسار الأفراد B2C): طالب، باحث عن عمل، أو موظف أرغب بتطوير مهاراتي شخصياً والتسجيل على حسابي الخاص. → Section 3
  - Smart default: if Q5 = "لا أعمل حالياً" or Q6 = "طالب / باحث عن عمل" → pre-highlight B2C (still user-confirmable). If Q6 = owner / senior mgmt / HR → pre-highlight B2B.

### القسم الثاني: مسار الشركات والمؤسسات (B2B) — only if Q7 = B2B
- **Q8 حجم المؤسسة** (single): 1 - 9 موظفين (متناهية الصغر) | 10 - 49 موظفاً (صغيرة) | 50 - 249 موظفاً (متوسطة) | 250 موظفاً فأكثر (كبرى)
- **Q9 ميزانية التدريب** (single): نعم، متوفرة وجاهزة | متوفرة، ولكن بضوابط وتقليص للمصروفات | لا توجد ميزانية معتمدة حالياً
- **Q10 الحلول المؤسسية** (multi; "لا يوجد حالياً" is exclusive): أكاديمية مؤسسية داخلية جاهزة (Corporate Academy in a Box) | برنامج إعداد الصف الثاني من القيادات (Leadership Pipeline) | أكاديميات وظيفية متخصصة (للموارد البشرية / المالية / خدمة العملاء) | برامج مصممة ومفصلة حسب احتياج المؤسسة الدقيق | استقبال متدربين أو إجراء مقابلات لمجتازي مسارات الجاهزية المهنية | لا يوجد حالياً
- **Q11 قياس العائد على الاستثمار** (multi, max 2): استبانة تقييم رضا المتدربين بعد الدورة مباشرة | تطبيق ما تم تعلمه في بيئة العمل (قياس الأثر بعد 3 أشهر) | تحسن مؤشرات الأداء الوظيفي (KPIs) وتقارير التقييم السنوية للموظف | الحصول على الشهادة المهنية الدولية واجتياز الاختبارات
- **Q14 فجوة المهارات لفرق العمل** (dual-rating matrix, 10 skills × importance 1–5 × current performance 1–5). Headings: "أهمية المهارة لنجاح العمل (1 ضعيف - 5 مهم جداً)" / "تقييمك لأداء فريقك/موظفيك لتلك المهارة حالياً (1 ضعيف - 5 ممتاز)"
- Then jump to Section 4.

### القسم الثالث: مسار الأفراد والمهنيين (B2C) — only if Q7 = B2C
- **Q15 برامج الشباب والجاهزية المهنية** (multi; "لا أرغب حالياً" exclusive): من الشباب إلى الأعمال (Youth to Business) | الإرشاد المهني مع قيادات الأعمال (Mentoring) | بوابة التدريب العملي في الشركات (Internship Gateway) | معسكر مهارات المستقبل (Future Skills Camp) | لا أرغب حالياً
- **Q18 فجوة المهارات الشخصية** (same 10 skills, dual rating). Headings: "أهمية المهارة لمستقبلك المهني (1 ضعيف - 5 مهم جداً)" / "أدائك الفعلي لتلك المهارة حالياً (1 ضعيف - 5 ممتاز)"
- Then Section 4.

**The 10 skills (shared by Q14/Q18, ids S1–S10):**
1. التفكير النقدي الإبداعي وحل المشكلات المعقدة
2. التفاوض والإقناع الإداري وإبرام العقود
3. إدارة الوقت وترتيب الأولويات والإنتاجية الشخصية
4. الالتزام بمعايير الحوكمة والرقابة التشغيلية
5. كتابة التقارير الإدارية والمالية باحترافية
6. الذكاء العاطفي وإدارة علاقات الزمالة وفرق العمل
7. المرونة الاستراتيجية النفسية وقيادة التغيير في الأزمات
8. التفكير الابتكاري وتوظيف التكنولوجيا في بيئة العمل
9. مهارات التواصل الفعال والعرض والتقديم القيادي
10. التفكير النقدي والاستباقي وتقييم المخاطر

### القسم الرابع: التوجهات والاحتياجات المباشرة (all)
- **Q19 أسلوب تقديم التدريب المفضل** (single): حضوري في مقر المركز | في مقر عمل الجهة أو الشركة (On-site) | عن بُعد مباشر (Live Online) | ذاتي التعلم ومسجل (Self-paced) | مدمج (حضوري وعن بُعد) | دفعة مغلقة خاصة بالجهة (Closed Cohort)
- **Q20 مدة البرنامج** (single): دورة قصيرة (أقل من 3 ساعات) | من يوم إلى يومين | من 3 إلى 5 أيام | برنامج ممتد (عدة أسابيع)
- **Q21 الفترة الزمنية** (single): صباح أيام العمل (أثناء الدوام) | مساء أيام العمل (بعد الدوام) | عطلة نهاية الأسبوع (Weekend)
- **Q22 لغة البرنامج** (single): اللغة العربية | اللغة الإنجليزية | ثنائية اللغة (Bilingual)
- **Q23 الشهادة والاعتماد** (single): شهادة معتمدة دولياً (PMI, CIPD...) | اعتماد جامعي | شهادة تقنية من شريك متخصص | شهادة جاهزية مهنية باختبار تطبيقي | شهادة حضور فقط | الشهادة غير مهمة بالنسبة لي
- **Q24 ترتيب المسارات المستقبلية** (drag-and-drop rank 1 = الأهم … 6; touch-friendly with up/down fallback): الذكاء الاصطناعي وأتمتة الأعمال | الحوكمة والاستدامة (ESG) | الأمن السيبراني وحماية البيانات | التحليل المالي وذكاء الأعمال | القيادة وإدارة التغيير والأزمات | التحكيم التجاري وعقود الاستثمار
- **Q25 مصفوفة الدورات التدريبية** — "ما مدى رغبتك في التسجيل بالدورات التدريبية التالية خلال الـ 6 أشهر القادمة؟" 3-state per course: غير مهتم | مهتم مستقبلاً | أرغب بالحجز فوراً. 23 courses in 6 groups (ids C1–C23):
  - التحول الرقمي والذكاء الاصطناعي: C1 هندسة الأوامر وتطبيقات الذكاء الاصطناعي التوليدي | C2 تصميم وبناء وكلاء الذكاء الاصطناعي (AI Agents) | C3 سرد القصص بالبيانات وتحليلها (Data Storytelling & Power BI) | C4 أساسيات الحوسبة السحابية (Cloud Computing) | C5 التجارة الرقمية والتسويق الرقمي
  - القيادة والإدارة الاستراتيجية: C6 القيادة الاستراتيجية وبناء الفرق عالية الأداء | C7 شهادة السكرتارية التنفيذية ومدير مكتب القيادي التنفيذي | C8 تأهيل مديري مكاتب الوزراء والقيادات الحكومية | C9 عيادة نمو المنشآت الصغيرة والمتوسطة (SME Growth Clinic)
  - الموارد البشرية والمهارات الشخصية: C10 الذكاء العاطفي والمرونة النفسية في بيئة العمل | C11 إدارة المواهب وتوجيه وإرشاد الموظفين (Coaching) | C12 الجاهزية للعمل في الموارد البشرية الرقمية (HR Digital Readiness)
  - المالية، المصرفية، والامتثال: C13 مبادئ التمويل الإسلامي والصكوك | C14 مكافحة غسل الأموال وتمويل الإرهاب والامتثال (AML/CFT) | C15 تحليل الائتمان وإدارة المخاطر (Credit & Risk Analysis) | C16 التكنولوجيا المالية (FinTech) والمدفوعات الرقمية | C17 التمويل والإدارة المالية للمنشآت الصغيرة والمتوسطة
  - إدارة المشاريع، العقود، والجودة: C18 إدارة المشاريع الاحترافية والتميز التشغيلي | C19 سلسلة التحديثات التشريعية والتنظيمية لبيئة الأعمال | C20 المشتريات والعقود والتعاقد المؤسسي (Procurement)
  - الجاهزية المهنية والتشغيل (للموظفين والباحثين عن عمل): C21 خدمة العملاء ومراكز الاتصال (Customer Service Readiness) | C22 مشرفو أنظمة وغرف المراقبة الأمنية (CCTV Operations) | C23 العمليات اللوجستية والمخازن (Logistics Readiness)
  - Smart ordering: show the group most relevant to the respondent's path first (B2C students/job-seekers → الجاهزية المهنية near top; B2B → القيادة first). Optional smart skip: let respondents collapse a whole group as "غير مهتم بالمجال" to save time (record as not interested; keep reach rate).
- **Q26 العنصر التنافسي الأهم** (multi, max 2): شهادات واعتمادات مهنية دولية حقيقية وليست شرفية | مدربون ممارسون من واقع السوق الكويتي والخليجي بعيداً عن التنظير | برامج وتطبيقات محاكاة عملية لمعالجة مشكلات حقيقية في الشركات | برامج موجهة خصيصاً لتطوير القيادات العليا ومجالس الإدارة | مرونة في تفصيل الحقيبة التدريبية (Customization) حسب احتياجنا | أسعار تنافسية مرنة وعروض خاصة لترشيح المجموعات (Corporate Packages)

### القسم الخامس: بيانات التواصل والحجز (اختياري) (all)
Intro: هذا القسم اختياري تماماً. إذا كنت قد اخترت "أرغب بالحجز فوراً" في أي من الدورات السابقة، أو ترغب في تلقي جدول الدورات القادمة والحصول على خصم التسجيل المُبكر، يُرجى تزويدنا ببياناتك ليقوم فريق المركز بالتواصل معك.
- If any Q25 = "أرغب بالحجز فوراً": show a highlighted summary of the booked courses and a stronger nudge; otherwise a light optional card.
- Fields: الاسم الكريم (أو اسم الجهة) | البريد الإلكتروني | رقم هاتف العمل / الواتساب (validate format if filled; Kuwait +965 default).

### Thank-you screen (all)
شُـكراً جزيلاً لمساهمتكم القيّمة في رسم مستقبل التدريب في دولة الكويت. تطلعاتكم هي بوصلتنا نحو التميز. — مع تحيات، فريق البحث

## 4. UX and design requirements

- `<html dir="rtl" lang="ar">`; use CSS logical properties; Arabic web font (IBM Plex Sans Arabic / Tajawal / Cairo); mixed Latin terms stay inline (bidi isolation).
- Premium, calm, "impressive but simple": one section per screen, big tappable option cards, clear progress bar with section names, subtle transitions, no clutter. Palette direction: deep navy/teal with a gold accent (chamber/center feel); light theme default.
- Mobile-first; matrices collapse into per-row cards on small screens (two 1–5 pill rows per skill).
- Validation inline, friendly Arabic messages; required marks; "exclusive" options auto-clear others; max-2 selections with counter.
- Autosave each step to server (draft response id in localStorage) so a respondent can resume; record started/completed timestamps, path, device type, time per section (for drop-off analysis).
- Admin area protected (password/env secret or Replit Auth). Public survey at `/`, admin at `/admin`.
- Shareable link + QR code for the survey; optional `?src=` campaign tag stored with the response.

## 5. Data model (Postgres)

- `responses`: id, created_at, completed_at, status (draft|complete), consent, path (B2B|B2C), source_tag, device, duration_sec, answers JSONB (all raw answers keyed by question id), contact fields (nullable).
- `skill_ratings`: response_id, skill_id (S1–S10), importance (1–5), performance (1–5), gap (importance − performance).
- `course_interest`: response_id, course_id (C1–C23), level (0 = غير مهتم, 1 = مهتم مستقبلاً, 2 = أرغب بالحجز فوراً), shown (bool).
- `track_ranks`: response_id, track_id (T1–T6), rank (1–6).
- `catalogue_workshops` (seed from the catalogue PDF): id, title_en, title_ar, category (1–6), tier (Foundation|Practitioner|Leadership), days, top50_rank, evidence_score (0–100), market_demand_pct, kuwait_plans_count, local_supply (None|Emerging|Established), audience (G/P/S/I flags), shortlisted_34 (bool), source_needs_study_course.
- `mappings`: survey item (course Cx / skill Sx / track Tx) → workshop ids, with primary flag (one primary category per course for counting; secondary links for interpretation only — per the desk study's rule).

## 6. Matching framework (from the desk study — implement in the matching engine)

**Desk trends ↔ survey domains (Figure 15):**
1. Soft/behavioral skills (6 shortlisted workshops) ↔ skills matrix S1–S10 and C10, C11.
2. AI & cybersecurity (7) ↔ C1, C2, C4, C5 and track "الأمن السيبراني".
3. Business analytics & data (6) ↔ C3 and track "التحليل المالي وذكاء الأعمال".
4. SME, business & management (8) ↔ C6–C9, C18–C20 and track "القيادة وإدارة التغيير".
5. Financial (7) ↔ C13–C17.
- Career readiness (C21–C23, C12) is outside the shortlist (only workshop #20) → analysed as **new demand**.
- Track "التحكيم التجاري وعقود الاستثمار" has no catalogue workshop → flag as potential new demand.

**Scoring rules:**
- Need index per item (0–100): code answers 0/1/2 (غير مهتم / مهتم مستقبلاً / أرغب بالحجز فوراً), mean ÷ 2 × 100, reported with valid n. Report "book now" share separately.
- Skills gap per skill: mean importance, mean performance, mean gap, and importance-weighted gap; B2B (team view) and B2C (self view) reported side by side (the study expects employees to self-rate higher than employers rate them).
- Course selection rate computed only among respondents to whom the course was shown; report reach rate; never treat not-shown or drop-off as "no need".
- **Four-cell grid per workshop (Figure 16):** field need (high/medium vs none) × desk evidence (strong = 29–37 reports / high score vs weak) →
  - أولوية مؤكدة (strong evidence + confirmed need) → launch first
  - طلب جديد (weak evidence + confirmed need) → add to portfolio and test
  - مسار تقوده الأدلة (strong evidence + no field need) → keep, build employer awareness first
  - تأجيل (weak + none) → defer to next evidence review
- **Composite priority score:** 40% field need + 30% desk evidence (evidence_score) + 20% strategic impact (Kuwait Vision 2035 pillar / stakeholder breadth G-P-S-I) + 10% readiness (local supply: Select > Expand > Build for speed). Normalise all to 0–100. Run a sensitivity test shifting the need weight ±10 points (redistribute the rest proportionally) and show rank stability.
- Segment cuts: B2B vs B2C, government vs private, SME (Q8 < 250) vs large, sector, nationality; chi-square (or exact tests for small cells) for differences; no population margins of error for a voluntary sample.
- Output: ranked workshop list with grid cell, composite score, confidence (n), supply status (Build/Expand/Select), suggested tier (Foundation/Practitioner/Leadership) and stakeholder group — exportable as the "confirmed demand map".

**Initial item → catalogue workshop mapping (primary first):**
- C1 → Prompt and Workflow Design; AI Fluency for Every Role
- C2 → Supervising AI Agents; Human–AI Collaboration and Workflow Redesign
- C3 → Data Storytelling; Applied Business Intelligence: From Spreadsheets to Dashboards
- C4 → Cloud Computing and Infrastructure Fundamentals
- C5 → Digital Commerce and Digital Marketing for Enterprises
- C6 → Strategic Leadership and High-Performance Teams
- C7 → Executive Secretarial and Office Management; Executive Office Leadership Certificate
- C8 → Public Sector Office Leadership
- C9 → SME Growth Clinic
- C10 → Professional Communication, Presentation and Emotional Intelligence; Resilience and Stress Management
- C11 → Coaching Skills for Line Managers
- C12 → HR Digital Readiness
- C13 → Islamic Finance and Sukuk Fundamentals
- C14 → AML/CFT in an AI-Enabled Environment
- C15 → Credit and Risk Analysis
- C16 → FinTech and Digital Payments
- C17 → Finance for SMEs
- C18 → Project Management Essentials (PMP-aligned)
- C19 → Business Update Series; Regulatory Compliance
- C20 → Procurement, Contracts and Institutional Contracting
- C21 → Customer Service Readiness
- C22 → CCTV Operations Readiness
- C23 → Logistics Readiness
- S1 → Critical Thinking and Structured Reasoning; S2 → Advanced Negotiation and Persuasion; S3 → Time and Priority Management and Personal Productivity; S4 → Regulatory Compliance / Board and Corporate Governance; S5 → Professional Communication… / Finance for Non-Financial Managers and IFRS Reporting Essentials; S6 → Professional Communication, Presentation and EI; S7 → Adaptability and Change Readiness / Resilience and Stress Management; S8 → AI Fluency for Every Role / Human–AI Collaboration; S9 → Professional Communication… / Presenting a Machine-Assisted Conclusion; S10 → Judgement Under AI / Critical Thinking
- T1 الذكاء الاصطناعي وأتمتة الأعمال → AI & Cyber category; T2 ESG → ESG Risk Assessment and Reporting + Board and Corporate Governance; T3 الأمن السيبراني → Cybersecurity Essentials / Securing AI Deployments; T4 التحليل المالي وذكاء الأعمال → Advanced Financial Analysis and Budgeting + Applied BI; T5 القيادة وإدارة التغيير → Strategic Leadership / Adaptability; T6 التحكيم التجاري → none (new demand)

**Catalogue categories (70 workshops, 258 days):** 01 Soft Skills (9) · 02 AI & Cybersecurity (13) · 03 Business Analytics & Data Analytics (7) · 04 SME, Business & Management Development (20) · 05 Financial (13) · 06 Career Readiness & Employment (8). Each card in the PDF carries: tier, days, Top-50 rank + evidence score, market demand % (of 82 reports), Kuwait plans count, local supply, audience flags, source needs-study course. Extract into a JSON seed (`server/data/catalogue.json`) — render pages with pdf-processing if text parsing is ambiguous.

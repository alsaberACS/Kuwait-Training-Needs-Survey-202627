import { motion, useReducedMotion } from "framer-motion";
import { BookmarkCheck, CircleDashed, Info, Layers3, Users } from "lucide-react";
import {
  useGetTrainingPathways, getGetTrainingPathwaysQueryKey,
  type SurveyPath, type TrainingPathwayDomain, type PathwayWorkshop, type QuestionBreakdown,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { optionLabel } from "@/lib/survey-definition";
import { COURSE_DESCRIPTIONS, COURSE_NOTE } from "@/lib/survey-content";
import { LOW_N } from "@/lib/study-context";
import { fmt, Err } from "./shared";
import { DOMAIN, GOLD, GOLD_SOFT, SILVER, TIER_AR, AUDIENCE_AR, glass } from "./infographic-kit";
import "./training-pathways.css";

const BASE = import.meta.env.BASE_URL;
const PATH_AR = (p?: SurveyPath) => (p ? `مسار ${p} فقط` : "جميع المسارات (B2B + B2C)");
const PREF_SHORT: Record<string, string> = { Q19: "أسلوب التنفيذ", Q20: "المدة", Q21: "التوقيت", Q22: "اللغة", Q23: "الاعتماد", Q26: "عوامل التميّز" };

/* six node positions on the orbit (percent of the square box) */
const NODES = Array.from({ length: 6 }, (_, i) => {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return { x: 50 + 38 * Math.cos(a), y: 50 + 38 * Math.sin(a) };
});

export function TrainingPathways({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetTrainingPathways(params, {
    query: { queryKey: getGetTrainingPathwaysQueryKey(params), staleTime: 60_000, refetchOnWindowFocus: false },
  });
  if (q.isLoading) return <PathwaysSkeleton />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const r = q.data;
  return (
    <div className="grid gap-6" data-testid="pathways-board">
      <Hero report={r} path={path} />
      <Method />
      {r.domains.map((d, i) => <DomainSection key={d.groupId} d={d} index={i} path={path} />)}
      <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-[11px] leading-relaxed text-muted-foreground" data-testid="pathways-footnote">
        <Info className="me-1 inline h-3.5 w-3.5 text-accent" />
        {COURSE_NOTE} المدة والمستوى مأخوذان تقريبياً من الكتالوج (مدة استرشادية من الكتالوج) وليسا عرضاً مؤكداً. «احجز الآن» نية معلنة في الاستبانة وليست حجوزات مدفوعة.
      </p>
    </div>
  );
}

/* ---------------- hero: city poster with connected domain constellation ---------------- */
function Hero({ report, path }: { report: { respondents: number; courseCount: number; evaluatedCourses: number; domains: TrainingPathwayDomain[] }; path?: SurveyPath }) {
  const reduce = useReducedMotion();
  const go = (id: string) => document.getElementById(`pathway-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  return (
    <section className="relative overflow-hidden rounded-3xl text-white shadow-2xl" style={{ background: "linear-gradient(160deg,#1b2027,#24303a 55%,#3a3220)" }} data-testid="pathways-hero">
      <div aria-hidden className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${BASE}pathways-skyline.jpg)`, backgroundPosition: "center 60%" }} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(20,25,31,.8),rgba(28,36,44,.5) 50%,rgba(60,48,20,.82))" }} />
      <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-center">
        <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="min-w-0">
          <p className="font-display text-[11px] font-semibold tracking-[.2em]" style={{ color: GOLD_SOFT }}>ASDC · KCCI · خريطة المسارات 2026/2027</p>
          <h2 className="font-display mt-2 text-3xl font-bold leading-tight sm:text-4xl">ستة مجالات تدريبية،<br /><span style={{ color: GOLD }}>والورش التي يطلبها الميدان في كل منها</span></h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">لكل مجال: إلى ثلاث ورش اختارها المشاركون فعلاً، مع أساس الطلب وتفضيلات المهتمين بها. الأرقام من الاستبانة كما هي، والفراغ يُعرض فراغاً.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Stat icon={Users} v={report.respondents} l="رداً مكتملاً" testId="stat-respondents" />
            <Stat icon={Layers3} v={report.evaluatedCourses} l={`ورشة قُيّمت من ${report.courseCount}`} testId="stat-evaluated" />
            <span className={cn(glass, "flex items-center px-3 py-2 text-white/85")} data-testid="text-path-scope">النطاق: {PATH_AR(path)}</span>
          </div>
        </motion.div>
        <div className="relative mx-auto aspect-square w-full max-w-[460px]" dir="ltr">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            <g className="tp-orbit"><circle cx="50" cy="50" r="38" fill="none" stroke={SILVER} strokeOpacity=".35" strokeWidth=".25" strokeDasharray="1 1.6" /></g>
            <circle cx="50" cy="50" r="26" fill="none" stroke={GOLD} strokeOpacity=".3" strokeWidth=".2" />
            {NODES.map((n, i) => (
              <motion.line key={i} x1="50" y1="50" x2={n.x} y2={n.y} stroke={GOLD_SOFT} strokeOpacity=".7" strokeWidth=".3" className="tp-dash"
                initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: .3 + i * .1, duration: .8 }} />
            ))}
            <circle cx="50" cy="50" r="13" fill="none" stroke={GOLD} strokeWidth=".4" className="tp-pulse" />
          </svg>
          <div className="absolute left-1/2 top-1/2 flex h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 shadow-xl ring-2" style={{ ["--tw-ring-color" as string]: GOLD }}>
            <img src={`${BASE}asdc-logo.jpg`} alt="شعار مركز عبدالعزيز حمد الصقر للتنمية والتطوير" className="h-full w-full object-contain" />
          </div>
          {report.domains.map((d, i) => {
            const n = NODES[i]; const Icon = DOMAIN[d.groupId]?.icon ?? CircleDashed;
            const lead = d.topCourses.length;
            return (
              <motion.button key={d.groupId} type="button" onClick={() => go(d.groupId)} data-testid={`node-domain-${d.groupId}`}
                initial={reduce ? false : { opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .5 + i * .1, type: "spring", stiffness: 180, damping: 16 }}
                whileHover={reduce ? undefined : { scale: 1.08 }}
                className="tp-node absolute flex w-[27%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center" style={{ left: `${n.x}%`, top: `${n.y}%` }}
                aria-label={`انتقل إلى مجال ${d.label}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border shadow-lg sm:h-14 sm:w-14"
                  style={{ background: lead ? "linear-gradient(135deg,#E7D5A2,#D0A734)" : "rgba(255,255,255,.12)", borderColor: lead ? GOLD_SOFT : "rgba(255,255,255,.4)", color: lead ? "#2a2411" : "#fff" }}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.7} />
                </span>
                <span dir="rtl" className="mt-1 text-[10px] font-semibold leading-tight sm:text-[11px]">{DOMAIN[d.groupId]?.short ?? d.label}</span>
                <span dir="rtl" className="text-[9px] text-white/65 sm:text-[10px]">{d.groupId} · {lead ? `${lead} ورش مطلوبة` : "لا ورش بعد"}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, v, l, testId }: { icon: typeof Users; v: number; l: string; testId: string }) {
  return (
    <span className={cn(glass, "flex items-center gap-2 px-3 py-2")} data-testid={testId}>
      <Icon className="h-4 w-4" style={{ color: GOLD_SOFT }} /><b className="font-display text-base tabular-nums">{v}</b><span className="text-white/80">{l}</span>
    </span>
  );
}

function Method() {
  return (
    <section className="grid gap-3 rounded-2xl border border-card-border bg-card p-4 text-xs leading-relaxed text-muted-foreground sm:grid-cols-3" data-testid="pathways-method">
      <p><b className="text-foreground">كيف رُتّبت الورش؟</b> أعلى 3 ورش كحد أقصى لكل مجال، من بين الورش التي اختارها مشارك واحد على الأقل (1 أو 2). الترتيب: مؤشر الاحتياج، ثم نسبة «احجز الآن»، ثم عدد من عُرضت عليهم، ثم رقم الدورة عند التعادل التام.</p>
      <p><b className="text-foreground">مؤشر الاحتياج (0–100)</b> يُحسب بين من عُرضت عليهم الورشة فقط: 0 غير مهتم، 1 مستقبلاً، 2 احجز الآن. الورشة غير المعروضة لا تعني غياب الاحتياج ولا تملأ مكاناً فارغاً.</p>
      <p><b className="text-foreground">تفضيلات المشاركين المهتمين بالورشة</b> هي تفضيلاتهم العامة في الاستبانة (Q19–Q23، Q26) وتُرشد تصميم البرنامج، ولا تثبت سبب الطلب. تُعرض كل الخيارات المتعادلة في القمة، وكل نسبة مع مقامها. أقل من {LOW_N} ردود = للاستئناس.</p>
    </section>
  );
}

/* ---------------- domain section: a city-photo plate with a big circular figure wired to its workshops ---------------- */
const BG_POS = ["20% 40%", "80% 55%", "50% 70%", "10% 60%", "65% 35%", "90% 65%"];
const panel = "rounded-2xl border border-white/25 bg-[rgba(18,23,29,.55)] shadow-[inset_0_1px_0_0_rgba(255,255,255,.18)] backdrop-blur-md";

function DomainSection({ d, index, path }: { d: TrainingPathwayDomain; index: number; path?: SurveyPath }) {
  const reduce = useReducedMotion();
  const Icon = DOMAIN[d.groupId]?.icon ?? CircleDashed;
  const state = d.gate.respondents === 0 && d.evaluatedRespondents === 0 ? "nodata" : d.evaluatedCourses === 0 ? "never" : d.interestedCourses === 0 ? "zero" : "ok";
  return (
    <motion.section id={`pathway-${d.groupId}`} aria-labelledby={`h-${d.groupId}`} className="relative scroll-mt-4 overflow-hidden rounded-3xl text-white shadow-2xl"
      initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: .5 }}
      data-testid={`section-domain-${d.groupId}`} style={{ background: "#1c232b" }}>
      <div aria-hidden className="absolute inset-0 bg-cover grayscale-[35%]" style={{ backgroundImage: `url(${BASE}pathways-skyline.jpg)`, backgroundPosition: BG_POS[index % 6] }} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(200deg,rgba(26,34,42,.72),rgba(22,28,35,.86) 45%,rgba(58,46,18,.88))" }} />
      <div aria-hidden className="tp-dots absolute inset-0 opacity-30" />
      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[260px_1fr]">
        {/* the domain figure */}
        <div className="flex flex-col items-center text-center lg:sticky lg:top-6 lg:self-start">
          <span className="font-display text-sm font-bold tracking-[.3em]" style={{ color: GOLD_SOFT }}>{String(index + 1).padStart(2, "0")} · {d.groupId}</span>
          <GateRing g={d.gate} icon={Icon} />
          <h2 id={`h-${d.groupId}`} className="font-display mt-3 text-xl font-bold leading-snug">{d.label}</h2>
          <p className="mt-1 text-[11px] text-white/65">{PATH_AR(path)}</p>
          <div className="mt-3 grid w-full grid-cols-3 gap-1.5 text-[10px] text-white/75" data-testid={`text-evaluated-${d.groupId}`}>
            <Mini v={d.evaluatedCourses} l="ورشة قُيّمت" /><Mini v={d.interestedCourses} l="عليها اهتمام" /><Mini v={d.evaluatedRespondents} l="مقيّماً" />
          </div>
        </div>
        {/* workshops wired to the figure */}
        <div className="relative min-w-0">
          <span aria-hidden className="absolute bottom-6 top-6 hidden w-px lg:block" style={{ insetInlineStart: -14, background: `linear-gradient(${GOLD_SOFT},transparent)` }} />
          {state !== "ok" ? <DomainEmpty state={state} /> : (
            <div className="grid gap-4">
              {d.topCourses.map((w, i) => <WorkshopFigure key={w.demand.courseId} w={w} rank={i + 1} delay={i} />)}
              {d.topCourses.length < 3 && (
                <p className="text-[11px] text-white/70" data-testid={`text-fewer-${d.groupId}`}>
                  {d.topCourses.length} من 3 أماكن فقط: بقية ورش هذا المجال لم تُعرض أو لم يخترها أحد، ولا نملأ الفراغ بورش بلا اهتمام.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function Mini({ v, l }: { v: number; l: string }) {
  return <span className={cn(panel, "px-1 py-1.5")}><b className="font-display block text-base tabular-nums text-white">{v}</b>{l}</span>;
}

/* big circular figure: share of gate respondents who chose the domain (%) */
function GateRing({ g, icon: Icon }: { g: TrainingPathwayDomain["gate"]; icon: typeof Users }) {
  const reduce = useReducedMotion();
  const r = 44, c = 2 * Math.PI * r, has = g.respondents > 0, v = has ? Math.max(0, Math.min(100, g.selectedShare)) : 0;
  return (
    <div className="mt-3 flex flex-col items-center" data-testid="text-gate">
      <div className="relative h-40 w-40" dir="ltr" role="img" aria-label={has ? `اختار المجال ${fmt(v, 1)}% من ${g.respondents}` : "سؤال اختيار المجال بلا إجابات"}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".4" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(214,215,210,.25)" strokeWidth="6" strokeDasharray={has ? undefined : "2 3"} />
          {has && <motion.circle cx="50" cy="50" r={r} fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - v / 100) }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut" }}
            style={reduce ? { strokeDashoffset: c * (1 - v / 100) } : undefined} />}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <Icon className="mx-auto h-5 w-5" style={{ color: GOLD_SOFT }} strokeWidth={1.6} />
            <p className="font-display mt-1 text-3xl font-bold leading-none tabular-nums">{has ? `${fmt(v, 0)}%` : "—"}</p>
          </div>
        </div>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-white/80">
        {has ? <>اختاروا المجال: <b className="tabular-nums">{g.selected}</b> من <b className="tabular-nums">{g.respondents}</b></> : "سؤال اختيار المجال: لا إجابات"}
        {has && g.respondents < LOW_N && <span className="ms-1 rounded bg-[rgba(243,182,160,.2)] px-1 text-[#f3b6a0]">للاستئناس</span>}
      </p>
    </div>
  );
}

function DomainEmpty({ state }: { state: "nodata" | "never" | "zero" }) {
  const t = {
    nodata: ["لا ردود في هذا النطاق بعد", "لم تصل ردود مكتملة تخص هذا المجال ضمن النطاق المحدد. سيظهر المجال هنا تلقائياً عند وصولها."],
    never: ["لم تُقيَّم ورش هذا المجال بعد", "لم تُعرض أي ورشة من هذا المجال على المشاركين، لذا لا يمكن الحكم على الاحتياج. هذا ليس دليلاً على غياب الطلب."],
    zero: ["قُيّمت الورش ولم يُبدِ أحد اهتماماً", "عُرضت ورش هذا المجال وقيّمها المشاركون، لكن لم يختر أي منهم «مستقبلاً» أو «احجز الآن» حتى الآن."],
  }[state];
  return (
    <div className={cn(panel, "flex items-start gap-4 border-dashed p-5")} data-testid={`empty-domain-${state}`}>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: state === "zero" ? GOLD : SILVER }}>
        <CircleDashed className="h-6 w-6 text-white/70" />
      </span>
      <div><h3 className="font-semibold" style={{ color: GOLD_SOFT }}>{t[0]}</h3><p className="mt-1 text-sm leading-relaxed text-white/80">{t[1]}</p></div>
    </div>
  );
}

/* ---------------- one annotated workshop figure ---------------- */
function WorkshopFigure({ w, rank, delay }: { w: PathwayWorkshop; rank: number; delay: number }) {
  const reduce = useReducedMotion();
  const dm = w.demand;
  const cat = w.catalogue;
  const low = dm.shown < LOW_N;
  const desc = COURSE_DESCRIPTIONS[dm.courseId];
  return (
    <motion.article className={cn(panel, "relative min-w-0 p-4 transition-colors hover:border-[rgba(231,213,162,.7)] sm:p-5")}
      initial={reduce ? false : { opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: delay * .14, duration: .5 }}
      data-testid={`card-workshop-${dm.courseId}`}>
      {/* connector node + leader line to the domain figure */}
      <span aria-hidden className="absolute top-10 hidden h-px w-[14px] lg:block" style={{ insetInlineStart: -14, background: GOLD_SOFT }} />
      <span aria-hidden className="absolute top-[34px] hidden h-3 w-3 rounded-full border-2 lg:block" style={{ insetInlineStart: -20, borderColor: GOLD_SOFT, background: "#1c232b" }} />
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <Ring value={dm.needIndex} rank={rank} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold" style={{ color: GOLD_SOFT }}>المرتبة {rank} · {dm.courseId}
                {low && <span className="ms-1 rounded bg-[rgba(243,182,160,.2)] px-1 text-[#f3b6a0]">n={dm.shown} · للاستئناس</span>}</p>
              <h3 className="mt-0.5 font-semibold leading-snug text-white" data-testid={`text-workshop-title-${dm.courseId}`}>{dm.label}</h3>
            </div>
          </div>
          <Split dm={dm} />
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/75" data-testid={`text-basis-${dm.courseId}`}>
            <BookmarkCheck className="me-1 inline h-3.5 w-3.5" style={{ color: GOLD }} />
            {w.interestedRespondents} مهتماً من {dm.shown} عُرضت عليهم · «احجز الآن» {fmt(dm.bookNowShare, 1)}% (نية معلنة لا حجز مدفوع)
          </p>
          {desc && <p className="mt-3 text-[12px] leading-relaxed text-white/85">{desc}</p>}
          {cat && (
            <div className="mt-3 rounded-xl border border-dashed border-white/25 p-2.5 text-[10px] leading-relaxed text-white/75" data-testid={`text-catalogue-${dm.courseId}`}>
              <p className="font-semibold text-white/85">أقرب ورشة في الكتالوج (مرجع تقريبي، قد تكون أوسع نطاقاً)</p>
              <p className="mt-0.5">{cat.titleAr}{cat.titleEn && <span dir="ltr" className="ms-1 inline-block text-white/55">{cat.titleEn}</span>}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-white/10 px-1.5 py-0.5">مدة استرشادية من الكتالوج: <b className="tabular-nums">{cat.days}</b> يوم</span>
                {cat.tier && <span className="rounded-md bg-white/10 px-1.5 py-0.5">المستوى التقريبي: {TIER_AR[cat.tier] ?? cat.tier}</span>}
                {cat.audience.length > 0 && <span className="rounded-md bg-white/10 px-1.5 py-0.5">الفئة التقريبية: {cat.audience.map((a) => AUDIENCE_AR[a] ?? a).join("، ")}</span>}
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0 border-t border-dashed border-white/20 pt-3 md:border-s md:border-t-0 md:ps-4 md:pt-0">
          <h4 className="text-[12px] font-semibold" style={{ color: GOLD_SOFT }}>تفضيلات المشاركين المهتمين بالورشة</h4>
          <p className="text-[10px] leading-relaxed text-white/60">تفضيلات عامة لـ {w.interestedRespondents} مهتماً، تُرشد التصميم ولا تفسّر سبب الطلب.</p>
          <dl className="mt-2 grid gap-2">
            {["Q19", "Q20", "Q21", "Q22", "Q23", "Q26"].map((qid) => (
              <PrefRow key={qid} qid={qid} b={w.preferences.find((p) => p.questionId === qid)} courseId={dm.courseId} />
            ))}
          </dl>
        </div>
      </div>
    </motion.article>
  );
}

/* circular need-index gauge, 0-100 */
function Ring({ value, rank }: { value: number; rank: number }) {
  const reduce = useReducedMotion();
  const r = 26, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-[76px] w-[76px] shrink-0" dir="ltr" role="img" aria-label={`مؤشر الاحتياج ${fmt(v, 0)} من 100`}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth=".5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(214,215,210,.25)" strokeWidth="4.5" />
        <motion.circle cx="32" cy="32" r={r} fill="none" stroke={rank === 1 ? GOLD : GOLD_SOFT} strokeWidth="4.5" strokeLinecap="round" strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - v / 100) }} viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut" }}
          style={reduce ? { strokeDashoffset: c * (1 - v / 100) } : undefined} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><p className="font-display text-xl font-bold leading-none tabular-nums text-white">{fmt(v, 0)}</p><p className="text-[8px] text-white/60">مؤشر / 100</p></div>
      </div>
    </div>
  );
}

/* stacked 0-based split of all who were shown */
function Split({ dm }: { dm: PathwayWorkshop["demand"] }) {
  const parts = [
    { l: "احجز الآن", v: dm.bookNow, c: GOLD },
    { l: "مستقبلاً", v: dm.future, c: GOLD_SOFT },
    { l: "غير مهتم", v: dm.notInterested, c: "rgba(214,215,210,.55)" },
  ];
  const t = dm.shown || 1;
  return (
    <div className="mt-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
        {parts.map((p) => p.v > 0 && <span key={p.l} style={{ width: `${(p.v / t) * 100}%`, background: p.c }} />)}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-white/70">
        {parts.map((p) => <span key={p.l} className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm" style={{ background: p.c }} />{p.l} <b className="tabular-nums text-white">{p.v}</b></span>)}
        <span>من {dm.shown}</span>
      </div>
    </div>
  );
}

function PrefRow({ qid, b, courseId }: { qid: string; b?: QuestionBreakdown; courseId: string }) {
  const name = PREF_SHORT[qid] ?? b?.label ?? qid;
  const max = b ? Math.max(...b.options.map((o) => o.count), 0) : 0;
  const top = b && b.respondents > 0 && max > 0 ? b.options.filter((o) => o.count === max) : [];
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1" data-testid={`pref-${courseId}-${qid}`}>
      <dt className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] text-white/65"><i className="h-1.5 w-1.5 rounded-full" style={{ background: top.length ? GOLD : "transparent", border: `1px solid ${GOLD_SOFT}` }} />{name}</dt>
      <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {!top.length || !b ? <span className="text-[11px] italic text-white/50">لا إجابات</span> : <>
          {top.map((o) => (
            <span key={o.key} className="rounded-md border px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(208,167,52,.2)", borderColor: "rgba(231,213,162,.45)", color: GOLD_SOFT }}>
              {optionLabel(qid, o.key) || o.label} <span className="font-normal tabular-nums text-white/85">{fmt(o.pct, 0)}%</span>
            </span>
          ))}
          {top.length > 1 && <span className="text-[10px] text-white/60">تعادل</span>}
          <span className="text-[10px] tabular-nums text-white/55">({max} من {b.respondents}{qid === "Q26" ? "، اختيار متعدد" : ""}){b.respondents < LOW_N && " · للاستئناس"}</span>
        </>}
      </dd>
    </div>
  );
}

function PathwaysSkeleton() {
  return (
    <div className="grid gap-6" data-testid="pathways-loading">
      <div className="h-[420px] animate-pulse rounded-3xl bg-[hsl(206_30%_22%)]" />
      {[0, 1].map((i) => (
        <div key={i} className="rounded-3xl border border-card-border bg-card p-5">
          <div className="h-12 w-1/2 animate-pulse rounded-xl bg-muted" />
          <div className="mt-4 grid gap-4 xl:grid-cols-3">{[0, 1, 2].map((j) => <div key={j} className="h-64 animate-pulse rounded-2xl bg-muted" />)}</div>
        </div>
      ))}
    </div>
  );
}

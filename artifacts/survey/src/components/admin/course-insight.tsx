import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, BookmarkCheck, CircleDashed, Compass, FlaskConical, Info, Lightbulb, MousePointerClick, RefreshCw, Trophy, Users } from "lucide-react";
import {
  useGetCourseDemand, getGetCourseDemandQueryKey, useGetCourseInsight, getGetCourseInsightQueryKey,
  type SurveyPath, type CourseDemandItem, type CourseInsightReport, type QuestionBreakdown,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { GROUP_LABELS, optionLabel } from "@/lib/survey-definition";
import { COURSE_DESCRIPTIONS, COURSE_NOTE } from "@/lib/survey-content";
import { LOW_N } from "@/lib/study-context";
import { fmt } from "./shared";
import { DOMAIN, GOLD, GOLD_SOFT, SILVER, TIER_AR, AUDIENCE_AR } from "./infographic-kit";
import { PREF_ORDER, PREF_META, buildInsights, buildProfile, joinAr } from "./course-insight-logic";
import "./course-insight.css";

const BASE = import.meta.env.BASE_URL;
const GROUP_IDS = ["G1", "G2", "G3", "G4", "G5", "G6"];
const PATH_AR = (p?: SurveyPath) => (p ? `مسار ${p} فقط` : "جميع المسارات");
const plate = "relative overflow-hidden rounded-3xl text-white shadow-2xl";
const pane = "rounded-2xl border border-white/20 bg-[rgba(16,21,27,.5)] shadow-[inset_0_1px_0_0_rgba(255,255,255,.16)] backdrop-blur-md";
const Low = ({ n }: { n: number }) => n < LOW_N ? <span className="ms-1 rounded bg-[rgba(243,182,160,.2)] px-1 text-[10px] text-[#f3b6a0]">للاستئناس</span> : null;

function Backdrop({ pos = "center", img = "pathways-skyline.jpg", blur = 0 }: { pos?: string; img?: string; blur?: number }) {
  return <>
    <div aria-hidden className="absolute inset-0 scale-105 bg-cover" style={{ backgroundImage: `url(${BASE}${img})`, backgroundPosition: pos, filter: `blur(${blur}px) grayscale(.3)` }} />
    <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(165deg,rgba(18,23,29,.86),rgba(26,34,42,.72) 50%,rgba(64,50,18,.86))" }} />
    <div aria-hidden className="ci-dots absolute inset-0 opacity-40" />
  </>;
}

export function CourseInsight({ path }: { path?: SurveyPath }) {
  const reduce = useReducedMotion();
  const reportRef = useRef<HTMLDivElement>(null);
  const params = path ? { path } : undefined;
  const demand = useGetCourseDemand(params, { query: { queryKey: getGetCourseDemandQueryKey(params), staleTime: 60_000, refetchOnWindowFocus: false } });
  const [group, setGroup] = useState("G1");
  const [course, setCourse] = useState<string | null>(null);
  const items = demand.data?.items ?? [];
  const groups = useMemo(() => GROUP_IDS.map((id) => {
    const g = demand.data?.groups.find((x) => x.groupId === id);
    const list = (demand.data?.items ?? []).filter((i) => i.groupId === id)
      .sort((a, b) => (b.shown > 0 ? 1 : 0) - (a.shown > 0 ? 1 : 0) || b.needIndex - a.needIndex || b.bookNowShare - a.bookNowShare || Number(a.courseId.slice(1)) - Number(b.courseId.slice(1)));
    return { id, label: g?.label ?? GROUP_LABELS[id], gate: g, list };
  }), [demand.data]);
  const current = groups.find((g) => g.id === group)!;
  const validCourse = course && current.list.some((c) => c.courseId === course) ? course : null;
  const pickGroup = (id: string) => { if (id !== group) { setGroup(id); setCourse(null); } };
  const pickCourse = (id: string) => {
    setCourse(id);
    requestAnimationFrame(() => {
      reportRef.current?.focus({ preventScroll: true });
      reportRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  };

  if (demand.isLoading) return <SelectorSkeleton />;
  if (demand.isError || !demand.data) return <ErrorPlate onRetry={() => demand.refetch()} text="تعذّر تحميل قائمة الورش." testId="error-course-demand" />;

  return (
    <div className="grid gap-6" data-testid="course-insight">
      <Selector groups={groups} group={group} onGroup={pickGroup} course={validCourse} onCourse={pickCourse} path={path} total={items.length} />
      <div ref={reportRef} tabIndex={-1} aria-label="ملف الورشة المختارة" className="scroll-mt-4 outline-none">
        {validCourse ? <Report key={`${validCourse}-${path ?? "all"}`} courseId={validCourse} path={path} /> : <PickPrompt label={current.label} count={current.list.length} />}
      </div>
      <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-[11px] leading-relaxed text-muted-foreground" data-testid="course-insight-footnote">
        <Info className="me-1 inline h-3.5 w-3.5 text-accent" />
        {COURSE_NOTE} التفضيلات المعروضة هي تفضيلات عامة لمن أبدى اهتماماً بالورشة، تُرشد التصميم ولا تثبت سبب الطلب ولا تضمن الحجوزات. «احجز الآن» نية معلنة في الاستبانة وليست حجوزات مدفوعة. أقل من {LOW_N} ردود = للاستئناس.
      </p>
    </div>
  );
}

/* ---------------- domain + workshop selector ---------------- */
type G = { id: string; label: string; gate?: { respondents: number; selected: number; selectedShare: number }; list: CourseDemandItem[] };
function Selector({ groups, group, onGroup, course, onCourse, path, total }: { groups: G[]; group: string; onGroup: (id: string) => void; course: string | null; onCourse: (id: string) => void; path?: SurveyPath; total: number }) {
  const reduce = useReducedMotion();
  const cur = groups.find((g) => g.id === group)!;
  return (
    <section className={plate} style={{ background: "#1b2027" }} data-testid="course-selector">
      <Backdrop pos="center 70%" blur={3} />
      <div className="relative p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-[11px] font-semibold tracking-[.2em]" style={{ color: GOLD_SOFT }}>ASDC · KCCI · ملف ورشة واحدة</p>
            <h2 className="font-display mt-1 text-2xl font-bold leading-tight sm:text-3xl">اختر المجال، ثم الورشة،<span style={{ color: GOLD }}> لتقرأ وضعها كما قاله الميدان</span></h2>
          </div>
          <span className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/80" data-testid="text-selector-scope">{total} ورشة في الاستبانة · {PATH_AR(path)}</span>
        </div>
        <p className="mt-4 text-[11px] font-semibold text-white/60">1 · المجال التدريبي</p>
        <div role="radiogroup" aria-label="المجال التدريبي" className="ci-scroll mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {groups.map((g) => {
            const Icon = DOMAIN[g.id]?.icon ?? CircleDashed; const on = g.id === group;
            return (
              <button key={g.id} type="button" role="radio" aria-checked={on} onClick={() => onGroup(g.id)} data-testid={`button-domain-${g.id}`}
                className={cn("ci-focus relative flex min-w-[150px] shrink-0 flex-col items-start gap-1 rounded-2xl border p-3 text-start transition-colors lg:min-w-0",
                  on ? "border-[rgba(231,213,162,.8)] bg-[rgba(208,167,52,.22)]" : "border-white/20 bg-white/[.06] hover:bg-white/[.12]")}>
                {on && <motion.span layoutId="ci-dom" className="absolute inset-x-3 -bottom-px h-0.5 rounded-full" style={{ background: GOLD }} transition={reduce ? { duration: 0 } : undefined} />}
                <span className="flex w-full items-center justify-between">
                  <Icon className="h-5 w-5" strokeWidth={1.6} style={{ color: on ? GOLD : GOLD_SOFT }} />
                  <span className="font-display text-[10px] tabular-nums text-white/55">{g.id} · {g.list.length}</span>
                </span>
                <span className="text-[12px] font-semibold leading-snug">{DOMAIN[g.id]?.short ?? g.label}</span>
                <span className="text-[10px] text-white/60">{g.gate && g.gate.respondents > 0 ? <>اختاره {fmt(g.gate.selectedShare, 0)}% ({g.gate.selected}/{g.gate.respondents})</> : "سؤال المجال: لا إجابات"}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-5 text-[11px] font-semibold text-white/60">2 · الورشة ضمن «{cur.label}» — كل الورش ({cur.list.length})، بما فيها غير المُقيَّمة</p>
        <AnimatePresence mode="wait">
          <motion.div key={group} role="radiogroup" aria-label="الورشة" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6 }} transition={{ duration: .25 }}
            className="ci-scroll mt-2 grid max-h-[340px] gap-2 overflow-y-auto pe-1 sm:grid-cols-2 xl:grid-cols-3" data-testid={`list-courses-${group}`}>
            {cur.list.length === 0 && <p className="text-sm text-white/70" data-testid="empty-course-list">لا ورش في هذا المجال.</p>}
            {cur.list.map((c) => {
              const on = c.courseId === course; const seen = c.shown > 0;
              return (
                <button key={c.courseId} type="button" role="radio" aria-checked={on} onClick={() => onCourse(c.courseId)} data-testid={`button-course-${c.courseId}`}
                  className={cn("ci-focus flex items-start gap-3 rounded-xl border p-2.5 text-start transition-colors", on ? "border-[rgba(231,213,162,.85)] bg-[rgba(208,167,52,.24)]" : "border-white/15 bg-white/[.05] hover:bg-white/[.11]")}>
                  <span className="font-display mt-0.5 w-9 shrink-0 text-[11px] tabular-nums text-white/55">{c.courseId}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-medium leading-snug">{c.label}</span>
                    {seen ? <span className="mt-1.5 flex items-center gap-2">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/15" dir="ltr"><span className="block h-full rounded-full" style={{ width: `${c.needIndex}%`, background: GOLD }} /></span>
                      <span className="text-[10px] tabular-nums text-white/70">{fmt(c.needIndex, 0)} · n={c.shown}</span>
                    </span> : <span className="mt-1 block text-[10px] italic text-white/45">لم تُقيَّم بعد — غير متاح</span>}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function PickPrompt({ label, count }: { label: string; count: number }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center" data-testid="empty-no-course">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-accent">
        <span aria-hidden className="ci-pulse absolute inset-0 rounded-full border border-accent" />
        <MousePointerClick className="h-6 w-6 text-accent" />
      </span>
      <h3 className="font-display text-lg font-bold text-primary">اختر ورشة لعرض ملفها</h3>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">في «{label}» {count} ورشة. اختر أياً منها أعلاه — حتى غير المُقيَّمة — لترى الطلب وموقعها في المجال وتفضيلات المهتمين بها.</p>
    </section>
  );
}

/* ---------------- report ---------------- */
function Report({ courseId, path }: { courseId: string; path?: SurveyPath }) {
  const params = { courseId, ...(path ? { path } : {}) };
  const q = useGetCourseInsight(params, { query: { queryKey: getGetCourseInsightQueryKey(params), enabled: /^C[1-9]\d*$/.test(courseId), staleTime: 60_000, refetchOnWindowFocus: false } });
  if (q.isLoading) return <ReportSkeleton />;
  if (q.isError || !q.data) return <ErrorPlate onRetry={() => q.refetch()} text="تعذّر تحميل ملف الورشة." testId="error-course-insight" />;
  if (q.data.workshop.demand.courseId !== courseId) return <ReportSkeleton />;
  return <ReportBody r={q.data} path={path} />;
}

function ReportBody({ r, path }: { r: CourseInsightReport; path?: SurveyPath }) {
  const d = r.workshop.demand;
  const insights = buildInsights(r, path);
  const desc = COURSE_DESCRIPTIONS[d.courseId];
  return (
    <div className="grid gap-6" data-testid={`report-${d.courseId}`} data-state={r.state}>
      <Hero r={r} path={path} desc={desc} />
      {r.state !== "not_evaluated" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <IntentColumns r={r} />
          <PathRings r={r} path={path} />
        </div>
      )}
      <Insights items={insights} />
      {r.state === "interested" ? <>
        <Preferences r={r} />
        <Profile r={r} />
      </> : (
        <section className={cn(plate, "p-6")} style={{ background: "#1c232b" }} data-testid={`empty-preferences-${r.state}`}>
          <Backdrop pos="30% 50%" img="infographic-backdrop.jpg" blur={4} />
          <div className="relative flex items-start gap-4">
            <CircleDashed className="h-10 w-10 shrink-0" style={{ color: GOLD_SOFT }} />
            <div>
              <h3 className="font-display font-bold" style={{ color: GOLD_SOFT }}>لا تفضيلات للعرض</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/80">{r.state === "not_evaluated" ? "لم تُقيَّم الورشة، فلا توجد شريحة مهتمة يُستخرج منها ملف تصميم." : "لم يبدِ أي مقيّم اهتماماً بالورشة، لذا لا نستعير تفضيلات من بقية المشاركين ولا نفترض ملفاً لها."}</p>
            </div>
          </div>
        </section>
      )}
      {r.workshop.catalogue && <Catalogue c={r.workshop.catalogue} />}
    </div>
  );
}

/* hero: the course as a central circle wired by fine lines to four callouts */
function Hero({ r, path, desc }: { r: CourseInsightReport; path?: SurveyPath; desc?: string }) {
  const reduce = useReducedMotion();
  const d = r.workshop.demand; const ok = r.state !== "not_evaluated";
  const Icon = DOMAIN[r.domain.groupId]?.icon ?? Compass;
  const v = ok ? Math.max(0, Math.min(100, d.needIndex)) : 0;
  const R = 40, C = 2 * Math.PI * R;
  const calls = [
    { k: "need", t: "مؤشر الاحتياج", v: ok ? fmt(d.needIndex, 0) : "غير متاح", s: ok ? "من 100 بين من عُرضت عليهم" : "لم تُعرض على أحد" },
    { k: "interest", t: "المهتمون", v: ok ? `${r.workshop.interestedRespondents}/${d.shown}` : "غير متاح", s: ok ? "اختاروا مستقبلاً أو احجز الآن" : "لا تقييمات" },
    { k: "book", t: "«احجز الآن»", v: ok ? `${fmt(d.bookNowShare, 1)}%` : "غير متاح", s: ok ? `${d.bookNow} نية معلنة، لا حجز مدفوع` : "لا تقييمات" },
    { k: "rank", t: "الموقع في المجال", v: r.domainRank != null ? `${r.domainRank}/${r.domainEvaluatedCourses}` : "غير متاح", s: r.domainRank != null ? (r.rankTied ? "مرتبة مشتركة (تعادل)" : `من ${r.domainCourseCount} ورشة في المجال`) : "لا ترتيب دون تقييم" },
  ];
  const pts = [{ x: 14, y: 14 }, { x: 86, y: 14 }, { x: 14, y: 86 }, { x: 86, y: 86 }];
  return (
    <section className={plate} style={{ background: "#1b2027" }} data-testid="course-hero">
      <Backdrop pos="center 55%" />
      <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-center">
        <motion.div initial={reduce ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55 }} className="min-w-0">
          <p className="font-display flex items-center gap-2 text-[11px] font-semibold tracking-[.18em]" style={{ color: GOLD_SOFT }}><Icon className="h-4 w-4" />{r.domain.groupId} · {r.domain.label}</p>
          <h2 className="font-display mt-2 text-2xl font-bold leading-tight sm:text-4xl" data-testid="text-course-title">{d.label}</h2>
          <p className="mt-1 font-display text-xs tabular-nums text-white/55">{d.courseId} · {PATH_AR(path)} · {r.respondents} رداً مكتملاً في النطاق</p>
          {desc && <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85" data-testid="text-course-desc">{desc} <span className="text-white/50">(شرح تقريبي من العنوان)</span></p>}
          <StateBadge r={r} />
        </motion.div>
        <div className="relative mx-auto hidden aspect-square w-full max-w-[520px] sm:block" dir="ltr">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            <g className="ci-spin"><circle cx="50" cy="50" r="30" fill="none" stroke={SILVER} strokeOpacity=".35" strokeWidth=".2" strokeDasharray="1 1.4" /></g>
            {pts.map((p, i) => (
              <motion.path key={i} d={`M50 50 L${p.x < 50 ? 34 : 66} ${p.y < 50 ? 34 : 66} L${p.x} ${p.y}`} fill="none" stroke={GOLD_SOFT} strokeOpacity=".7" strokeWidth=".25" className="ci-flow"
                initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: .3 + i * .12, duration: .7 }} />
            ))}
            {pts.map((p, i) => <circle key={`n${i}`} cx={p.x < 50 ? 34 : 66} cy={p.y < 50 ? 34 : 66} r="1" fill="#1b2027" stroke={GOLD_SOFT} strokeWidth=".3" />)}
            <circle cx="50" cy="50" r={R / 2.2} fill="none" stroke={GOLD} strokeWidth=".3" className="ci-pulse" />
          </svg>
          <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={ok ? `مؤشر الاحتياج ${fmt(v, 0)} من 100` : "مؤشر الاحتياج غير متاح"}>
              <circle cx="50" cy="50" r="48" fill="rgba(16,21,27,.6)" stroke="rgba(255,255,255,.35)" strokeWidth=".5" />
              <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(214,215,210,.2)" strokeWidth="6" strokeDasharray={ok ? undefined : "2 3"} />
              {ok && <motion.circle cx="50" cy="50" r={R} fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" strokeDasharray={C}
                initial={reduce ? false : { strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - v / 100) }} transition={{ duration: 1.3, ease: "easeOut" }} />}
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center" dir="rtl">
              <div><p className="font-display text-4xl font-bold leading-none tabular-nums">{ok ? fmt(v, 0) : "—"}</p><p className="mt-1 text-[10px] text-white/65">مؤشر الاحتياج</p></div>
            </div>
          </div>
          {calls.map((c, i) => (
            <motion.div key={c.k} dir="rtl" className={cn(pane, "ci-sheen absolute w-[34%] p-2.5")} data-testid={`callout-${c.k}`}
              style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%`, translate: "-50% -50%" }}
              initial={reduce ? false : { opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .6 + i * .12 }}>
              <p className="text-[10px] font-semibold" style={{ color: GOLD_SOFT }}>{c.t}</p>
              <p className="font-display text-xl font-bold leading-tight tabular-nums">{c.v}</p>
              <p className="text-[9.5px] leading-snug text-white/65">{c.s}</p>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          {calls.map((c) => (
            <div key={c.k} className={cn(pane, "p-3")} data-testid={`callout-mobile-${c.k}`}>
              <p className="text-[10px] font-semibold" style={{ color: GOLD_SOFT }}>{c.t}</p>
              <p className="font-display text-xl font-bold tabular-nums">{c.v}</p>
              <p className="text-[10px] text-white/65">{c.s}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StateBadge({ r }: { r: CourseInsightReport }) {
  const d = r.workshop.demand;
  const [t, tone] = r.state === "not_evaluated" ? ["غير مُقيَّمة ضمن هذا النطاق — البيانات غير متاحة", SILVER]
    : r.state === "no_interest" ? [`قُيّمت ولم يُبدِ أحد اهتماماً (0 من ${d.shown})`, "#f3b6a0"]
    : [`عليها اهتمام فعلي من ${r.workshop.interestedRespondents} مشاركاً`, GOLD];
  return (
    <p className="mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: tone, color: tone }} data-testid="status-course-state">
      <span className="h-2 w-2 rounded-full" style={{ background: tone }} />{t}{d.shown > 0 && d.shown < LOW_N && " · للاستئناس"}
    </p>
  );
}

/* translucent 3-D columns for the rating split (reference: glass columns) */
function IntentColumns({ r }: { r: CourseInsightReport }) {
  const reduce = useReducedMotion();
  const d = r.workshop.demand; const t = d.shown || 1;
  const cols = [
    { k: "book", l: "احجز الآن", v: d.bookNow, c: GOLD },
    { k: "future", l: "مستقبلاً", v: d.future, c: GOLD_SOFT },
    { k: "none", l: "غير مهتم", v: d.notInterested, c: SILVER },
  ];
  return (
    <section className={cn(plate, "p-5 sm:p-6")} style={{ background: "#1c232b" }} data-testid="panel-intent">
      <Backdrop pos="20% 40%" img="infographic-backdrop.jpg" blur={5} />
      <div className="relative">
        <h3 className="font-display text-lg font-bold">الآن، لاحقاً، أم لا؟</h3>
        <p className="text-[11px] text-white/65">توزيع تقييمات {d.shown} ممن عُرضت عليهم الورشة<Low n={d.shown} /></p>
        <div className="mt-6 flex h-56 items-end justify-around gap-4" dir="ltr">
          {cols.map((c, i) => {
            const pct = (c.v / t) * 100;
            return (
              <div key={c.k} className="flex w-1/4 max-w-[96px] flex-col items-center" data-testid={`column-${c.k}`}>
                <p className="font-display text-xl font-bold tabular-nums">{fmt(pct, 0)}%</p>
                <div className="relative mt-1 flex h-40 w-full items-end">
                  <motion.div className={cn("relative w-full origin-bottom rounded-t-sm", c.v > 0 && "border border-white/40")}
                    style={{ height: `${pct}%`, background: `linear-gradient(90deg, ${c.c}55, ${c.c}22 60%, ${c.c}44)` }}
                    initial={reduce ? false : { scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: i * .12, duration: .8, ease: "easeOut" }}>
                    {c.v > 0 && <span aria-hidden className="absolute -top-2 left-0 h-2 w-full skew-x-[-40deg] border border-white/40" style={{ background: `${c.c}66`, transformOrigin: "bottom" }} />}
                  </motion.div>
                </div>
                <p className="mt-2 text-center text-[11px] font-semibold" dir="rtl">{c.l}</p>
                <p className="text-[10px] tabular-nums text-white/60">{c.v} من {d.shown}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* B2B / B2C rings */
function PathRings({ r, path }: { r: CourseInsightReport; path?: SurveyPath }) {
  const reduce = useReducedMotion();
  return (
    <section className={cn(plate, "p-5 sm:p-6")} style={{ background: "#1c232b" }} data-testid="panel-paths">
      <Backdrop pos="80% 60%" blur={4} />
      <div className="relative">
        <h3 className="font-display text-lg font-bold">المؤسسات مقابل الأفراد</h3>
        <p className="text-[11px] text-white/65">مؤشر الاحتياج داخل كل مسار</p>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {(["B2B", "B2C"] as const).map((p) => {
            const s = r.byPath.find((x) => x.path === p);
            const excluded = !!path && path !== p;
            const has = !excluded && !!s && s.shown > 0 && s.needIndex != null;
            const v = has ? Math.max(0, Math.min(100, s!.needIndex!)) : 0;
            const R = 40, C = 2 * Math.PI * R;
            return (
              <div key={p} className="flex flex-col items-center text-center" data-testid={`ring-path-${p}`}>
                <div className="relative h-32 w-32" dir="ltr">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".4" />
                    <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(214,215,210,.2)" strokeWidth="7" strokeDasharray={has ? undefined : "2 3"} />
                    {has && <motion.circle cx="50" cy="50" r={R} fill="none" stroke={p === "B2B" ? GOLD : GOLD_SOFT} strokeWidth="7" strokeDasharray={C}
                      initial={reduce ? false : { strokeDashoffset: C }} whileInView={{ strokeDashoffset: C * (1 - v / 100) }} viewport={{ once: true }} transition={{ duration: 1.1 }} />}
                  </svg>
                  <div className="absolute inset-0 grid place-items-center"><p className="font-display text-2xl font-bold tabular-nums">{has ? fmt(v, 0) : "—"}</p></div>
                </div>
                <p className="mt-2 font-display text-sm font-bold">{p === "B2B" ? "B2B · المؤسسات" : "B2C · الأفراد"}</p>
                <p className="text-[10px] leading-snug text-white/65">
                  {excluded ? "خارج النطاق المحدد — ليس دليلاً على غياب الطلب" : !has ? "لم تُعرض على هذا المسار" : <>{s!.interested} مهتماً من {s!.shown} · احجز الآن {s!.bookNow}<Low n={s!.shown} /></>}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Insights({ items }: { items: ReturnType<typeof buildInsights> }) {
  const reduce = useReducedMotion();
  return (
    <section className="rounded-3xl border border-card-border bg-card p-5 sm:p-6" data-testid="panel-insights">
      <h3 className="font-display flex items-center gap-2 text-lg font-bold text-primary"><Lightbulb className="h-5 w-5 text-accent" />ما تقوله الأرقام</h3>
      <p className="text-[11px] text-muted-foreground">نتائج مُقاسة مكتوبة آلياً من بيانات الاستبانة الحالية.</p>
      <ol className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((x, i) => (
          <motion.li key={x.title} className="flex gap-3 rounded-2xl border border-border bg-background p-3.5" data-testid={`insight-${i}`}
            initial={reduce ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}>
            <span className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent text-sm font-bold tabular-nums text-primary">{i + 1}</span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">{x.kind === "caution" && <AlertTriangle className="h-3.5 w-3.5 text-accent" />}{x.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/80">{x.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* dot-row preference breakdown (reference: dotted progress rows) */
function Preferences({ r }: { r: CourseInsightReport }) {
  return (
    <section className={cn(plate, "p-5 sm:p-7")} style={{ background: "#1b2027" }} data-testid="panel-preferences">
      <Backdrop pos="50% 30%" img="infographic-backdrop.jpg" blur={6} />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-display text-xl font-bold">كيف يفضّل المهتمون أن تُقدَّم؟</h3>
            <p className="text-[11px] text-white/65">تفضيلات عامة لـ {r.workshop.interestedRespondents} مهتماً بهذه الورشة فقط، لكل سؤال مقامه. الخيار الأعلى بالذهبي، والمتعادلون جميعاً.</p>
          </div>
          <span className="rounded-lg border border-white/25 px-2 py-1 text-[10px] text-white/70">النقاط تقريبية · كل نقطة ≈ 10%</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PREF_ORDER.map((qid, i) => <PrefCard key={qid} qid={qid} b={r.workshop.preferences.find((p) => p.questionId === qid)} i={i} />)}
        </div>
      </div>
    </section>
  );
}

function PrefCard({ qid, b, i }: { qid: string; b?: QuestionBreakdown; i: number }) {
  const reduce = useReducedMotion();
  const has = !!b && b.respondents > 0 && b.options.some((o) => o.count > 0);
  const max = has ? Math.max(...b!.options.map((o) => o.count)) : 0;
  const opts = has ? [...b!.options].sort((a, z) => z.count - a.count) : [];
  return (
    <motion.div className={cn(pane, "p-4")} data-testid={`pref-card-${qid}`}
      initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .07 }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><span className="font-display flex h-6 w-6 items-center justify-center rounded-full border text-[11px] tabular-nums" style={{ borderColor: GOLD_SOFT, color: GOLD_SOFT }}>{i + 1}</span>{PREF_META[qid].short}</p>
        <span className="text-[10px] tabular-nums text-white/55">{has ? <>n={b!.respondents}{PREF_META[qid].multi && " · متعدد"}<Low n={b!.respondents} /></> : ""}</span>
      </div>
      {!has ? <p className="mt-3 text-[12px] italic text-white/50" data-testid={`pref-none-${qid}`}>لا إجابات</p> : (
        <ul className="mt-3 grid gap-2.5">
          {opts.map((o) => {
            const lead = o.count === max; const filled = Math.round(Math.min(100, o.pct) / 10);
            return (
              <li key={o.key}>
                <p className={cn("flex justify-between gap-2 text-[11px] leading-snug", lead ? "font-semibold" : "text-white/70")} style={lead ? { color: GOLD_SOFT } : undefined}>
                  <span>{optionLabel(qid, o.key) || o.label}</span><span className="shrink-0 tabular-nums">{fmt(o.pct, 0)}% ({o.count})</span>
                </p>
                <div className="mt-1 flex gap-1" dir="ltr" aria-hidden>
                  {Array.from({ length: 10 }, (_, k) => (
                    <span key={k} className="h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2" style={{ background: k < filled ? (lead ? GOLD : "rgba(255,255,255,.85)") : "rgba(255,255,255,.18)" }} />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

/* numbered timeline programme profile (reference: 1-2-3-4-5 connected circles) */
function Profile({ r }: { r: CourseInsightReport }) {
  const reduce = useReducedMotion();
  const lines = buildProfile(r);
  const ready = lines.filter((l) => l.lead).length;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-card-border bg-card p-5 sm:p-7" data-testid="panel-profile">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 sadu opacity-60" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[11px] font-semibold tracking-[.18em] text-accent">مقترح تصميم — ليس نتيجة</p>
          <h3 className="font-display mt-1 text-xl font-bold text-primary">ملف البرنامج المقترح لـ«{r.workshop.demand.label}»</h3>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">مبني على الخيار الأعلى بين المهتمين في كل بُعد ({ready} من 6 أبعاد بها إجابات). اقتراح قابل للاختبار، والتفضيلات لا تضمن الحجوزات ولا تفسّر سبب الطلب.</p>
        </div>
        <FlaskConical className="h-8 w-8 text-accent" />
      </div>
      <ol className="relative mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <span aria-hidden className="absolute inset-x-6 top-5 hidden border-t-2 border-dotted border-accent/60 xl:block" />
        {lines.map((l, i) => (
          <motion.li key={l.qid} className="relative flex flex-col items-center text-center" data-testid={`profile-${l.qid}`}
            initial={reduce ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .09 }}>
            <span className={cn("font-display relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card text-base font-bold tabular-nums", l.lead ? "border-accent text-primary" : "border-dashed border-border text-muted-foreground")}>{i + 1}</span>
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground">{l.label}</p>
            <p className={cn("mt-1 text-[13px] font-semibold leading-snug", l.lead ? "text-primary" : "italic text-muted-foreground")}>{l.suggestion}</p>
            {l.lead && <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">{fmt(l.lead.pct, 0)}% · {l.lead.max} من {l.lead.respondents}{l.lead.labels.length > 1 && " · تعادل"}{l.lead.low && " · للاستئناس"}</p>}
          </motion.li>
        ))}
      </ol>
      {ready > 0 && (
        <p className="mt-6 rounded-2xl bg-muted p-4 text-[13px] leading-relaxed text-foreground/85" data-testid="text-profile-summary">
          <b className="text-primary">صياغة مقترحة للاختبار: </b>
          {joinAr(lines.filter((l) => l.lead).map((l) => `${l.label}: ${l.qid === "Q26" ? joinAr(l.lead!.labels) : l.lead!.labels.join(" أو ")}`))}.
        </p>
      )}
    </section>
  );
}

function Catalogue({ c }: { c: NonNullable<CourseInsightReport["workshop"]["catalogue"]> }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-4 text-[12px] leading-relaxed text-muted-foreground" data-testid="panel-catalogue">
      <p className="font-semibold text-foreground">مرجع ثانوي: أقرب ورشة في الكتالوج (قد تكون أوسع نطاقاً، ولم يُتحقق من الاستخراج)</p>
      <p className="mt-1">{c.titleAr}{c.titleEn && <span dir="ltr" className="ms-2 inline-block">{c.titleEn}</span>}</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-md bg-muted px-2 py-0.5">مدة استرشادية: <b className="tabular-nums">{c.days}</b> يوم</span>
        {c.tier && <span className="rounded-md bg-muted px-2 py-0.5">مستوى تقريبي: {TIER_AR[c.tier] ?? c.tier}</span>}
        {c.audience.length > 0 && <span className="rounded-md bg-muted px-2 py-0.5">فئة تقريبية: {c.audience.map((a) => AUDIENCE_AR[a] ?? a).join("، ")}</span>}
      </div>
    </section>
  );
}

/* ---------------- states ---------------- */
function ErrorPlate({ onRetry, text, testId }: { onRetry: () => void; text: string; testId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-card p-10 text-center" data-testid={testId}>
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-semibold text-primary">{text}</p>
      <button type="button" onClick={onRetry} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="button-retry"><RefreshCw className="h-4 w-4" />إعادة المحاولة</button>
    </div>
  );
}
function SelectorSkeleton() {
  return (
    <div className="grid gap-6" data-testid="course-insight-loading">
      <div className="rounded-3xl bg-[hsl(206_30%_22%)] p-6">
        <div className="h-8 w-1/2 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-5 grid grid-cols-3 gap-2 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/10" />)}</div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/10" />)}</div>
      </div>
    </div>
  );
}
function ReportSkeleton() {
  return (
    <div className="grid gap-6" data-testid="report-loading" aria-busy>
      <div className="flex h-[420px] items-center justify-center rounded-3xl bg-[hsl(206_30%_22%)]"><div className="h-48 w-48 animate-pulse rounded-full border-8 border-white/10" /></div>
      <div className="grid gap-6 lg:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />)}</div>
      <div className="flex gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4" /><BookmarkCheck className="h-4 w-4" /><Trophy className="h-4 w-4" />جارٍ حساب ملف الورشة…</div>
    </div>
  );
}

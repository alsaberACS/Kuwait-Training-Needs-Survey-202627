import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import {
  Brain, Handshake, Timer, ShieldCheck, FileText, HeartHandshake, LifeBuoy, Lightbulb, Presentation, Search,
  Cpu, Compass, Users, Landmark, ClipboardCheck, Briefcase, Target, GraduationCap, Route, ClipboardList, CalendarCheck,
} from "lucide-react";
import {
  useGetAdminSummary, getGetAdminSummaryQueryKey, useGetSkillsGap, getGetSkillsGapQueryKey, useGetCourseDemand, getGetCourseDemandQueryKey,
  useGetTrackRanks, getGetTrackRanksQueryKey, type SurveyPath, type CourseDemandItem, type SkillStats,
} from "@workspace/api-client-react";
import { SKILL_LABELS, GROUP_LABELS, COURSE_LABELS } from "@/lib/survey-definition";
import { cn } from "@/lib/utils";
import { fmt, Panel, Skel, Err, Empty, Reveal } from "./shared";

/* Palette sampled from the ASDC logo: gold #D0A734 and silver-grey #A1A29D on white. */
const GOLD = "#D0A734";
const GOLD_SOFT = "#E7D5A2";
const SILVER = "#D6D7D2";
const WHITE = "#FFFFFF";
const FONT = "IBM Plex Sans Arabic";
const TIP = { background: "rgba(24,28,33,.92)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 12, color: "#fff", fontFamily: FONT, fontSize: 12, direction: "rtl" as const };

const SKILL_ICONS: Record<string, typeof Brain> = {
  S1: Brain, S2: Handshake, S3: Timer, S4: ShieldCheck, S5: FileText, S6: HeartHandshake, S7: LifeBuoy, S8: Lightbulb, S9: Presentation, S10: Search,
};
const DOMAIN: Record<string, { short: string; icon: typeof Brain }> = {
  G1: { short: "الرقمنة والذكاء الاصطناعي", icon: Cpu },
  G2: { short: "القيادة والاستراتيجية", icon: Compass },
  G3: { short: "الموارد البشرية", icon: Users },
  G4: { short: "المالية والامتثال", icon: Landmark },
  G5: { short: "المشاريع والجودة", icon: ClipboardCheck },
  G6: { short: "الجاهزية المهنية", icon: Briefcase },
};

const glass = "rounded-2xl border border-white/30 bg-white/[.13] shadow-[inset_0_1px_0_0_rgba(255,255,255,.35),0_18px_40px_-24px_rgba(0,0,0,.6)] backdrop-blur-md";

export function Infographics({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const sum = useGetAdminSummary(params, { query: { queryKey: getGetAdminSummaryQueryKey(params) } });
  const sk = useGetSkillsGap({ query: { queryKey: getGetSkillsGapQueryKey() } });
  const co = useGetCourseDemand(params, { query: { queryKey: getGetCourseDemandQueryKey(params) } });
  const tr = useGetTrackRanks(params, { query: { queryKey: getGetTrackRanksQueryKey(params) } });
  const qs = [sum, sk, co, tr];
  if (qs.some((q) => q.isLoading)) return <Skel rows={5} />;
  if (qs.some((q) => q.isError) || !sum.data || !sk.data || !co.data || !tr.data) return <Err onRetry={() => qs.forEach((q) => q.refetch())} />;
  const s = sum.data;
  if (!s.completed) return <Empty />;

  const key: "all" | "b2b" | "b2c" = path === "B2B" ? "b2b" : path === "B2C" ? "b2c" : "all";
  const skills = sk.data.items
    .map((i) => ({ id: i.skillId, label: SKILL_LABELS[i.skillId] ?? i.label, stat: i[key], b2b: i.b2b, b2c: i.b2c }))
    .filter((x) => x.stat.n > 0);
  const topGaps = [...skills].sort((a, b) => b.stat.weightedGap - a.stat.weightedGap).slice(0, 4);
  const maxGap = Math.max(...topGaps.map((g) => Math.abs(g.stat.weightedGap)), 0.1);
  const courses = co.data.items.filter((c) => c.shown > 0);
  const rank = (a: CourseDemandItem, b: CourseDemandItem) => b.needIndex - a.needIndex || b.bookNowShare - a.bookNowShare || b.shown - a.shown;
  const domains = Object.keys(GROUP_LABELS).map((g) => ({
    id: g, label: GROUP_LABELS[g], ...DOMAIN[g],
    top: courses.filter((c) => c.groupId === g).sort(rank).slice(0, 3),
    gate: co.data!.groups.find((x) => x.groupId === g),
  }));
  const topCourse = [...courses].sort(rank)[0];
  const tracks = tr.data.items.filter((t) => t.trackId in GROUP_LABELS && t.n > 0).sort((a, b) => b.score - a.score);
  const topTrack = tracks[0];
  const topGap = topGaps[0];
  const ipaData = skills.map((x) => ({ id: x.id, label: x.label, imp: round(x.stat.meanImportance), perf: round(x.stat.meanPerformance) }));
  const pathData = skills.map((x) => ({ id: x.id, label: x.label, b2b: x.b2b.n ? round(x.b2b.weightedGap) : null, b2c: x.b2c.n ? round(x.b2c.weightedGap) : null }));
  const pathLabel = path === "B2B" ? "المؤسسات (B2B)" : path === "B2C" ? "الأفراد (B2C)" : "كل المشاركين";
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="grid gap-4">
      <Reveal i={0}>
        <section className="relative overflow-hidden rounded-3xl text-white shadow-2xl" data-testid="infographic-poster" style={{ background: "linear-gradient(160deg, #1b2027, #24303a 55%, #3a3220)" }}>
          {/* blurred teamwork photo, tinted charcoal + gold so the glass panels and logo colours read on top */}
          <div aria-hidden className="absolute inset-0 scale-105 bg-cover bg-center" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}infographic-backdrop.jpg)`, filter: "blur(4px) saturate(.85)" }} />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(22,27,33,.86) 0%, rgba(34,44,54,.74) 48%, rgba(74,60,26,.68) 100%)" }} />
          <div aria-hidden className="absolute -start-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: GOLD }} />
          <div aria-hidden className="absolute -bottom-32 end-10 h-96 w-96 rounded-full opacity-25 blur-3xl" style={{ background: SILVER }} />

          <div className="relative p-5 sm:p-7">
            {/* header strip */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-lg ring-2 ring-white/40">
                <img src={`${import.meta.env.BASE_URL}asdc-logo.jpg`} alt="شعار مركز عبدالعزيز حمد الصقر للتنمية والتطوير" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-[220px] flex-1">
                <p className="font-display text-[11px] font-semibold tracking-[.2em]" style={{ color: GOLD_SOFT }}>ASDC · KCCI · إنفوجرافيك النتائج</p>
                <h2 className="font-display mt-0.5 text-xl font-bold leading-snug sm:text-2xl">أبرز ما كشفته استبانة الاحتياجات التدريبية 2026/2027</h2>
                <p className="mt-1 text-xs text-white/75">فجوة المهارات والورش الأعلى طلباً في كل مجال · {pathLabel}</p>
              </div>
              <div className={cn(glass, "flex items-center gap-3 px-4 py-2.5 text-xs")}>
                <CalendarCheck className="h-4 w-4" style={{ color: GOLD_SOFT }} />
                <span><b className="font-display text-base tabular-nums">{s.completed}</b> رداً مكتملاً · حتى {today}</span>
              </div>
            </div>

            {/* row A: ring hero + skill-gap bars/lines */}
            <div className="mt-7 grid gap-5 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <RingHero
                  b2b={s.b2b} b2c={s.b2c} completed={s.completed}
                  callouts={[
                    { title: "العينة الميدانية", lines: [`${s.completed} رداً مكتملاً من ${s.total} بداية`, `${s.b2b} مؤسسة · ${s.b2c} فرداً`, `معدل الإكمال ${fmt(s.completionRate, 0)}%`] },
                    { title: "أكبر فجوة مهارية", lines: topGap ? [topGap.label, `فجوة مرجّحة ${fmt(topGap.stat.weightedGap, 2)} · ${fmt(topGap.stat.highGapShare, 0)}% فجوة حادة`] : ["لم تُقيَّم المهارات بعد"] },
                    { title: "الورشة الأعلى طلباً", lines: topCourse ? [COURSE_LABELS[topCourse.courseId] ?? topCourse.label, `مؤشر الاحتياج ${fmt(topCourse.needIndex, 0)} · حجز فوري ${fmt(topCourse.bookNowShare, 0)}%`] : ["لم تُعرض الورش بعد"] },
                    { title: "المسار الأول 2026/2027", lines: topTrack ? [GROUP_LABELS[topTrack.trackId] ?? topTrack.label, `درجة Borda ${fmt(topTrack.score, 0)} · في المركز الأول عند ${fmt(topTrack.firstPlaceShare, 0)}%`] : ["لم تُرتَّب المسارات بعد"] },
                  ]}
                />
              </div>
              <div className="grid content-start gap-4 xl:col-span-5">
                <div className={cn(glass, "p-4")}>
                  <p className="text-sm font-semibold">أكبر أربع فجوات مهارية</p>
                  <p className="text-[11px] text-white/70">الفجوة المرجّحة = (الأهمية − الأداء) × الأهمية · {pathLabel}</p>
                  <div className="mt-4 grid gap-3.5">
                    {topGaps.length ? topGaps.map((g, i) => <GapBar key={g.id} id={g.id} label={g.label} stat={g.stat} max={maxGap} i={i} />)
                      : <p className="text-xs text-white/70">لا تقييمات مهارات في هذا المسار بعد.</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MiniLine title="الأهمية مقابل الأداء" sub={`متوسط 1–5 لكل مهارة · ${pathLabel}`} data={ipaData} domain={[1, 5]}
                    lines={[{ key: "imp", label: "الأهمية", color: WHITE }, { key: "perf", label: "الأداء", color: GOLD }]} />
                  <MiniLine title="فجوة المؤسسات مقابل الأفراد" sub="الفجوة المرجّحة لكل مهارة · كل الردود" data={pathData}
                    lines={[{ key: "b2b", label: "المؤسسات B2B", color: WHITE }, { key: "b2c", label: "الأفراد B2C", color: SILVER }]} />
                </div>
              </div>
            </div>

            {/* row B: layered bars per domain + top workshop cards */}
            <div className="mt-5 grid gap-5 xl:grid-cols-12">
              <div className={cn(glass, "p-4 xl:col-span-5")}>
                <p className="text-sm font-semibold">الورش الثلاث الأعلى طلباً في كل مجال</p>
                <p className="text-[11px] text-white/70">مؤشر الاحتياج (0–100) · العمود الأعرض هو الورشة الأولى في المجال، ثم الثانية فالثالثة</p>
                <LayerBars domains={domains} />
              </div>
              <div className="xl:col-span-7">
                <TagCards domains={domains} />
              </div>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-white/65">
              المصدر: استبانة دراسة التموضع التنافسي والاحتياجات التدريبية في الكويت 2026/2027 · عينة طوعية ({s.completed} رداً مكتملاً) · مؤشر الاحتياج يُحسب بين من عُرضت عليهم الورشة فقط ·
              الفجوة على مقياس 1–5 · ألوان الإنفوجرافيك مستمدة من شعار المركز (الذهبي والفضي).
            </p>
          </div>
        </section>
      </Reveal>
      <Reveal i={1}>
        <Panel title="كيف تقرأ هذا الإنفوجرافيك؟" sub="ثلاثة مقاييس تتكرر في اللوحة">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <Def icon={Target} title="الفجوة المرجّحة" text="الفرق بين أهمية المهارة ومستوى الأداء الحالي مضروباً في الأهمية؛ كلما ارتفعت كان التدخل التدريبي أكثر إلحاحاً. «الفجوة الحادة» نسبة من بلغت فجوتهم درجتين فأكثر." />
            <Def icon={GraduationCap} title="مؤشر الاحتياج" text="متوسط اختيارات المشاركين (0 غير مهتم، 1 مهتم مستقبلاً، 2 أرغب بالحجز فوراً) ÷ 2 × 100، محسوباً فقط بين من عُرضت عليهم الورشة." />
            <Def icon={Route} title="درجة Borda" text="كل مشارك يرتّب المسارات الستة؛ يحصل المسار على نقاط بحسب مركزه وتُعاير الدرجة على 0–100. تُعرض فقط المسارات الستة الحالية." />
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

function Def({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-[hsl(32_70%_28%)]"><Icon className="h-[18px] w-[18px]" /></span>
      <div><p className="font-semibold">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p></div>
    </div>
  );
}

/* ---------- ring hero: the central ring with four icons and four callouts ---------- */
function RingHero({ b2b, b2c, completed, callouts }: { b2b: number; b2c: number; completed: number; callouts: { title: string; lines: string[] }[] }) {
  const r = 100, circ = 2 * Math.PI * r, total = Math.max(b2b + b2c, 1);
  const b2bLen = (b2b / total) * circ, b2cLen = (b2c / total) * circ;
  const Callout = ({ c, side }: { c: { title: string; lines: string[] }; side: "start" | "end" }) => (
    <div className={cn("py-1", side === "start" ? "border-e border-white/60 pe-4" : "border-s border-white/60 ps-4")}>
      <p className="font-display text-base font-bold leading-snug">{c.title}</p>
      {c.lines.map((l, i) => <p key={i} className={cn("leading-relaxed", i === 0 ? "mt-1 text-[13px] font-medium text-white/95" : "text-[11px] text-white/75")}>{l}</p>)}
    </div>
  );
  return (
    <div className="grid h-full items-center gap-6 md:grid-cols-[1fr_auto_1fr]" data-testid="info-ring">
      <div className="grid gap-8"><Callout c={callouts[0]} side="start" /><Callout c={callouts[1]} side="start" /></div>
      <div className="relative mx-auto h-[280px] w-[280px]" dir="ltr">
        <svg viewBox="0 0 280 280" className="h-full w-full">
          <defs>
            <linearGradient id="info-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={GOLD_SOFT} /><stop offset="1" stopColor={GOLD} /></linearGradient>
            <linearGradient id="info-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F2F2EF" /><stop offset="1" stopColor={SILVER} /></linearGradient>
          </defs>
          <circle cx="140" cy="140" r={r + 24} fill="rgba(255,255,255,.07)" />
          <circle cx="140" cy="140" r={r} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="24" />
          <g transform="rotate(-90 140 140)">
            <motion.circle cx="140" cy="140" r={r} fill="none" stroke="url(#info-gold)" strokeWidth="24" strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${b2bLen} ${circ}` }} transition={{ duration: 1, ease: "easeOut" }} />
            <motion.circle cx="140" cy="140" r={r} fill="none" stroke="url(#info-silver)" strokeWidth="24" strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${circ}`, strokeDashoffset: -b2bLen }} animate={{ strokeDasharray: `${b2cLen} ${circ}`, strokeDashoffset: -b2bLen }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} />
          </g>
          <circle cx="140" cy="140" r={r - 22} fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.35)" />
          {/* the four tabs of the reference design */}
          {[[140, 14, 28, 9], [140, 266, 28, 9], [14, 140, 9, 28], [266, 140, 9, 28]].map(([cx, cy, w, h], i) => (
            <rect key={i} x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="3" fill="rgba(255,255,255,.85)" />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center" dir="rtl">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {[Users, Target, GraduationCap, Route].map((I, i) => <I key={i} className="h-8 w-8 text-white drop-shadow" strokeWidth={1.6} />)}
          </div>
        </div>
        <div className="absolute inset-x-0 -bottom-7 flex justify-center gap-4 text-[11px] text-white/80" dir="rtl">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: GOLD }} />مؤسسات {b2b}</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SILVER }} />أفراد {b2c}</span>
          <span className="text-white/60">· {completed} رداً</span>
        </div>
      </div>
      <div className="grid gap-8"><Callout c={callouts[2]} side="end" /><Callout c={callouts[3]} side="end" /></div>
    </div>
  );
}

/* ---------- icon + pill bar for one skill gap ---------- */
function GapBar({ id, label, stat, max, i }: { id: string; label: string; stat: SkillStats; max: number; i: number }) {
  const Icon = SKILL_ICONS[id] ?? ClipboardList;
  const pct = Math.max(4, (Math.max(stat.weightedGap, 0) / max) * 100);
  return (
    <div className="grid grid-cols-[42px_1fr] items-center gap-3" data-testid={`info-gap-${id}`}>
      <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/40 bg-white/15"><Icon className="h-5 w-5" strokeWidth={1.7} /></span>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[13px] font-medium" title={label}><span className="me-1 text-[10px] text-white/60">{id}</span>{label}</p>
          <span className="font-display shrink-0 text-sm font-semibold tabular-nums" dir="ltr">{fmt(stat.weightedGap, 2)}</span>
        </div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/20 shadow-inner" dir="ltr">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 * i }} className="h-full rounded-full"
            style={{ background: i === 0 ? `linear-gradient(90deg, ${GOLD_SOFT}, ${GOLD})` : "linear-gradient(90deg, rgba(255,255,255,.95), rgba(255,255,255,.7))" }} />
        </div>
        <p className="mt-1 text-[10px] text-white/65">{fmt(stat.highGapShare, 0)}% فجوة حادة · n={stat.n}</p>
      </div>
    </div>
  );
}

/* ---------- small white line chart, as in the reference design ---------- */
function MiniLine({ title, sub, data, lines, domain }: {
  title: string; sub?: string; data: Record<string, string | number | null>[]; lines: { key: string; label: string; color: string }[]; domain?: [number, number];
}) {
  const tick = { fontSize: 10, fill: "rgba(255,255,255,.8)", fontFamily: FONT };
  return (
    <div className={cn(glass, "p-3")}>
      <p className="text-xs font-semibold">{title}</p>
      {sub && <p className="text-[10px] text-white/65">{sub}</p>}
      <div className="mt-2 h-[140px]" dir="ltr">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
            <XAxis dataKey="id" reversed tick={tick} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,.55)" }} interval={0} />
            <YAxis domain={domain ?? ["auto", "auto"]} width={10} tick={false} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,.55)" }} />
            <Tooltip contentStyle={TIP} labelStyle={{ color: GOLD_SOFT }} itemStyle={{ color: "#fff" }} formatter={(v: number) => fmt(v, 2)}
              labelFormatter={(l, p) => `${l} · ${(p?.[0]?.payload as { label?: string } | undefined)?.label ?? ""}`} />
            {lines.map((l) => (
              <Line key={l.key} type="linear" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2} connectNulls isAnimationActive={false}
                dot={{ r: 3.5, fill: l.color, stroke: "rgba(0,0,0,.3)", strokeWidth: 1 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/80">
        {lines.map((l) => <span key={l.key} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: l.color }} />{l.label}</span>)}
      </div>
    </div>
  );
}

type Domain = { id: string; label: string; short: string; icon: typeof Brain; top: CourseDemandItem[]; gate?: { selectedShare: number; selected: number } };

/* ---------- layered bar chart: three nested bars per domain ---------- */
function LayerBars({ domains }: { domains: Domain[] }) {
  const layers = [{ w: "78%", a: 0.38 }, { w: "52%", a: 0.6 }, { w: "28%", a: 0.92 }];
  return (
    <div className="mt-5 grid grid-cols-[22px_1fr] gap-2" dir="ltr">
      <div className="relative h-56 border-r border-white/60">
        {[100, 75, 50, 25, 0].map((t) => (
          <span key={t} className="absolute -translate-y-1/2 pr-1.5 text-right text-[9px] tabular-nums text-white/70" style={{ top: `${100 - t}%`, right: 0, width: 22 }}>{t}</span>
        ))}
        {[100, 75, 50, 25].map((t) => <span key={t} className="absolute right-0 h-px w-1.5 bg-white/60" style={{ top: `${100 - t}%` }} />)}
      </div>
      <div className="min-w-0">
        <div className="relative flex h-56 items-end gap-1.5 border-b border-white/60" dir="rtl">
          {domains.map((d) => (
            <div key={d.id} className="relative h-full flex-1" data-testid={`info-domain-${d.id}`}
              title={d.top.length ? d.top.map((c, i) => `${i + 1}. ${COURSE_LABELS[c.courseId] ?? c.label} — ${fmt(c.needIndex, 0)}`).join("\n") : "لم تُعرض ورش هذا المجال بعد"}>
              {d.top.map((c, i) => (
                <motion.div key={c.courseId} className="absolute bottom-0 left-1/2 rounded-t-md" style={{ width: layers[i].w, background: i === 0 ? `linear-gradient(180deg, ${GOLD_SOFT}, ${GOLD})` : WHITE, opacity: layers[i].a, x: "-50%" }}
                  initial={{ height: 0 }} animate={{ height: `${Math.max(c.needIndex, 1.5)}%` }} transition={{ duration: 0.8, delay: 0.08 * i }} />
              ))}
              {d.top[0] && <span className="font-display absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold tabular-nums drop-shadow" style={{ bottom: `calc(${Math.max(d.top[0].needIndex, 1.5)}% + 4px)` }}>{fmt(d.top[0].needIndex, 0)}</span>}
              {!d.top.length && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/50">—</span>}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5" dir="rtl">
          {domains.map((d) => <p key={d.id} className="flex-1 text-center text-[10px] leading-tight text-white/85">{d.short}</p>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- tag-shaped cards: the top workshop per domain, with a timeline of selection shares ---------- */
function TagCards({ domains }: { domains: Domain[] }) {
  const clip = "polygon(0 0, 100% 0, 100% calc(100% - 16px), 50% 100%, 0 calc(100% - 16px))";
  return (
    <div className="h-full">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {domains.map((d, i) => {
          const c = d.top[0];
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
              className="flex flex-col border border-white/30 bg-white/[.13] text-center backdrop-blur-md" style={{ clipPath: clip, borderRadius: 18 }} data-testid={`info-card-${d.id}`}>
              <div className="bg-white/25 px-2 py-2.5"><p className="font-display text-[12px] font-bold leading-snug">{d.short}</p></div>
              <div className="flex flex-1 flex-col px-2.5 pb-7 pt-3">
                {c ? (
                  <>
                    <p className="line-clamp-3 text-[11px] font-medium leading-snug" title={COURSE_LABELS[c.courseId] ?? c.label}>{COURSE_LABELS[c.courseId] ?? c.label}</p>
                    <p className="font-display mt-2 text-2xl font-bold tabular-nums leading-none" style={{ color: GOLD_SOFT }}>{fmt(c.needIndex, 0)}</p>
                    <p className="text-[9px] text-white/70">مؤشر الاحتياج</p>
                    <p className="mt-1.5 text-[10px] text-white/85">حجز فوري {fmt(c.bookNowShare, 0)}% · عُرضت على {c.shown}</p>
                  </>
                ) : <p className="text-[11px] text-white/70">لم تُعرض ورش هذا المجال بعد</p>}
                <p className="mt-1 text-[10px] text-white/70 xl:hidden"><b className="font-display tabular-nums">{d.gate ? fmt(d.gate.selectedShare, 0) : 0}%</b> اختاروا المجال</p>
                <div className="mt-auto flex justify-center pt-3"><d.icon className="h-6 w-6 text-white/90" strokeWidth={1.6} /></div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* the dotted timeline of the reference design: one dot per domain, gold when at least half the sample chose it; on narrow screens the share moves into the card */}
      <div className="relative mt-3 hidden xl:block" data-testid="info-timeline">
        <div className="absolute inset-x-[8%] top-[7px] h-[3px] rounded-full bg-white/35" />
        <div className="relative grid grid-cols-6 gap-3">
          {domains.map((d) => (
            <div key={d.id} className="flex flex-col items-center">
              <span className="h-4 w-4 rounded-full border-2 border-white/70 bg-white shadow" style={{ background: d.gate && d.gate.selectedShare >= 50 ? GOLD : WHITE }} />
              <p className="mt-1 text-[10px] text-white/80"><b className="font-display tabular-nums">{d.gate ? fmt(d.gate.selectedShare, 0) : 0}%</b> اختاروا المجال</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

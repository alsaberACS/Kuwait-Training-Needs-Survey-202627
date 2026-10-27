import { useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from "recharts";
import {
  Search, Download, Printer, ChevronDown, Users2, Layers3, Share2, Quote, Lightbulb, Scale, Flag, BookOpen, AlertTriangle, SearchX, FileText, ArrowLeftRight,
} from "lucide-react";
import {
  useGetFocusGroupAnalysis, getGetFocusGroupAnalysisQueryKey,
  type FocusGroupAnalysis, type FocusGroupTheme, type FocusGroupSignalStatus, type FocusGroupThemePriority,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Panel, Err, Empty, Kpi, Chips, Pill, AX, GRID, C } from "@/components/admin/shared";
import { CiteButton, EvidenceDialog, EvidenceProvider, useEvidence, type EvidenceRequest } from "@/components/admin/focus-groups-evidence";
import "./focus-groups.css";

const PRIORITY: Record<FocusGroupThemePriority, { label: string; tone: "navy" | "teal" | "gold"; fill: string }> = {
  shared: { label: "مشترك (3 مجموعات)", tone: "navy", fill: C.navy },
  targeted: { label: "مُوجَّه (مجموعتان)", tone: "teal", fill: C.teal },
  specialist: { label: "متخصص (مجموعة واحدة)", tone: "gold", fill: C.gold },
};
const STATUS: Record<FocusGroupSignalStatus, { label: string; short: string }> = {
  explicit: { label: "احتياج أو فجوة صريحة", short: "صريح" },
  context: { label: "نقاش ذو صلة فقط (ليس دعماً مباشراً)", short: "سياق" },
  not_observed: { label: "لا دليل واضح في هذا السجل (لا يعني انعدام الطلب)", short: "غير ملحوظ" },
};

type Ranked = FocusGroupTheme & { rank: number; tied: boolean };
const TIER_OPTIONS: { id: "all" | FocusGroupThemePriority; label: string }[] = [
  { id: "all", label: "الكل" }, { id: "shared", label: "مشترك" },
  { id: "targeted", label: "مُوجَّه" }, { id: "specialist", label: "متخصص" },
];
// Specialize outside JSX: preview instrumentation inserts attributes before
// inline JSX type arguments, which otherwise breaks the development transform.
const TierChips = Chips<"all" | FocusGroupThemePriority>;

function rankThemes(themes: FocusGroupTheme[]): Ranked[] {
  const sorted = [...themes].sort((a, b) => b.coverage - a.coverage);
  return sorted.map((t) => {
    const rank = 1 + sorted.filter((o) => o.coverage > t.coverage).length;
    const tied = sorted.filter((o) => o.coverage === t.coverage).length > 1;
    return { ...t, rank, tied };
  });
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export function FocusGroupAnalysisView() {
  const q = useGetFocusGroupAnalysis({ query: { queryKey: getGetFocusGroupAnalysisQueryKey(), staleTime: 300000, refetchOnWindowFocus: false } });
  if (q.isLoading) return <LoadingBrief />;
  if (q.isError) return <Err onRetry={() => q.refetch()} />;
  if (!q.data || !q.data.themes.length) return <Empty title="لا يوجد تحليل نوعي بعد" text="سيظهر ملخص المجموعات البؤرية هنا عند توفّره من الخادم." />;
  return <Report data={q.data} />;
}

function LoadingBrief() {
  return (
    <div className="grid gap-4" data-testid="loading-focus-groups" aria-busy="true">
      <div className="h-56 animate-pulse rounded-3xl bg-[hsl(206_40%_85%)]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><div className="h-80 animate-pulse rounded-2xl bg-muted" /><div className="h-80 animate-pulse rounded-2xl bg-muted" /></div>
    </div>
  );
}

function Report({ data }: { data: FocusGroupAnalysis }) {
  const reduce = useReducedMotion();
  const [req, setReq] = useState<EvidenceRequest | null>(null);
  const evidenceTrigger = useRef<HTMLElement | null>(null);
  const openEvidence = (request: EvidenceRequest) => {
    evidenceTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setReq(request);
  };
  const evidence = useMemo(() => new Map(data.evidence.map((e) => [e.id, e])), [data.evidence]);
  const groups = useMemo(() => new Map(data.groups.map((g) => [g.id, g])), [data.groups]);
  const ranked = useMemo(() => rankThemes(data.themes), [data.themes]);
  const themeTitle = useMemo(() => new Map(data.themes.map((t) => [t.id, t.title])), [data.themes]);

  const exportCsv = () => {
    const head = ["الترتيب", "العائلة التدريبية", "التغطية (مجموعات من 3)", "الاتساع", ...data.groups.map((g) => g.label), "أفكار دورات مقترحة (اقتراح تحليلي)", "الجمهور", "نصيحة التقديم"];
    const rows = ranked.map((t) => [
      t.tied ? `${t.rank}=` : t.rank, t.title, t.coverage, PRIORITY[t.priority].label,
      ...data.groups.map((g) => STATUS[t.signals.find((s) => s.groupId === g.id)?.status ?? "not_observed"].short),
      t.courseIdeas.join(" | "), t.audience, t.deliveryAdvice,
    ]);
    const body = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kuwait-focus-groups-themes-${data.analysisDate.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const fade = (i: number) => reduce ? {} : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" }, transition: { duration: 0.4, delay: Math.min(i, 6) * 0.05 } };

  return (
    <EvidenceProvider value={{ open: openEvidence }}>
      <div className="focus-groups-report grid min-w-0 gap-5" data-testid="view-focus-groups">
        {/* Brief cover */}
        <motion.section {...fade(0)} className="ink-panel relative overflow-hidden rounded-3xl p-6 sm:p-8" data-testid="section-brief">
          <div className="absolute inset-x-0 top-0 h-2 sadu opacity-70" />
          <div className="pointer-events-none absolute -start-24 -bottom-24 h-72 w-72 rounded-full bg-[hsl(var(--teal)/.35)] blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-3xl">
              <p className="font-display text-[11px] font-semibold tracking-[.2em] text-accent">موجز تنفيذي · {data.title}</p>
              <h2 className="mt-3 text-2xl font-bold leading-snug sm:text-[2rem]" data-testid="text-headline">{data.headline}</h2>
              <p className="mt-3 text-sm leading-loose text-white/75">{data.synopsis}</p>
              <p className="mt-4 text-[11px] text-white/50">تاريخ التحليل <bdi dir="ltr" className="tabular-nums">{data.analysisDate.slice(0, 10)}</bdi> · مستقل عن الاستبانة الكمية وليس توقعاً للمبيعات</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5" data-testid="button-export-focus-csv"><Download className="h-4 w-4" />CSV التحليل</button>
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-white/20 px-3.5 py-2 text-sm text-white/85 hover:bg-white/10" data-testid="button-print-focus"><Printer className="h-4 w-4" />طباعة</button>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="مجموعات بؤرية" value={String(data.stats.groups)} icon={Users2} accent hint="سجلات نوعية لا مشاركون في الاستبانة" />
          <Kpi label="عائلات تدريبية مُرمَّزة" value={String(data.stats.codedThemes)} icon={Layers3} />
          <Kpi label="مشتركة بين كل المجموعات" value={String(data.stats.sharedThemes)} icon={Share2} hint={`دليل صريح في ${data.stats.groups} من ${data.stats.groups}`} />
          <Kpi label="مقتطفات دليل" value={String(data.stats.evidenceExcerpts)} icon={Quote} hint="قابلة للفتح مع رقم السطر" />
        </div>

        {/* Findings */}
        <motion.div {...fade(1)}>
          <SectionHead n="أ" title="ما الذي يجب أن يعرفه صانع القرار" icon={Lightbulb} />
          <div className="grid gap-3 md:grid-cols-2">
            {data.executiveFindings.map((f, i) => (
              <article key={f.id} className="group relative min-w-0 rounded-2xl border border-card-border bg-card p-5 transition-shadow hover:shadow-md" data-testid={`card-finding-${f.id}`}>
                <span className="font-display absolute end-4 top-3 text-3xl font-bold text-accent/25 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="pe-10 font-semibold leading-snug text-primary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <CiteButton className="mt-3" ids={f.evidenceIds} title={f.title} />
              </article>
            ))}
          </div>
        </motion.div>

        {/* Coverage chart + tier breakdown */}
        <motion.div {...fade(2)}>
          <SectionHead n="ب" title="الاحتياجات المشتركة والمتخصصة عبر المجموعات" icon={Layers3} />
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Panel title="التغطية لكل عائلة تدريبية" sub="الوحدة: عدد المجموعات البؤرية التي ظهر فيها احتياج صريح (من 3). كل مجموعة تُحسب مرة واحدة." note={data.methodology.countUnit}>
              <CoverageChart ranked={ranked} total={data.groups.length} />
            </Panel>
            <Panel title="توزيع العائلات حسب الاتساع" sub="الاتساع يعني عدد المجموعات فقط، لا الأهمية ولا القيمة التجارية.">
              <TierStack ranked={ranked} />
            </Panel>
          </div>
        </motion.div>

        <motion.div {...fade(3)}>
          <Panel title="مصفوفة الإشارات: العائلة × المجموعة" sub="الحالات فئوية لا شدّة. اضغط أي خلية لفتح الدليل المُستشهد به." testId="panel-matrix">
            <SignalMatrix data={data} ranked={ranked} />
          </Panel>
        </motion.div>

        {/* Course priority table */}
        <motion.div {...fade(4)}>
          <SectionHead n="ج" title="أولويات البرامج: ماذا نقدّم ولمن" icon={BookOpen} />
          <PriorityTable data={data} ranked={ranked} />
        </motion.div>

        {/* Group explorer */}
        <motion.div {...fade(5)}>
          <SectionHead n="د" title="كل مجموعة على حدة" icon={Users2} />
          <GroupExplorer data={data} themeTitle={themeTitle} />
        </motion.div>

        {/* Issues & tensions */}
        <motion.div {...fade(6)}>
          <SectionHead n="هـ" title="العوائق التنظيمية والتشغيلية" icon={AlertTriangle} />
          <IssuesTable data={data} />
        </motion.div>

        {data.tensions.length > 0 && (
          <motion.div {...fade(6)}>
            <SectionHead n="و" title="وجهات نظر متباينة وكيف نوفّق بينها" icon={Scale} />
            <div className="grid gap-3">
              {data.tensions.map((t) => (
                <article key={t.id} className="min-w-0 rounded-2xl border border-card-border bg-card p-5" data-testid={`card-tension-${t.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-primary">{t.title}</h3><CiteButton ids={t.evidenceIds} title={t.title} /></div>
                  <div className="mt-3 grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr]">
                    <p className="min-w-0 rounded-xl bg-secondary p-3 text-sm leading-relaxed text-secondary-foreground">{t.firstPosition}</p>
                    <ArrowLeftRight className="mx-auto h-5 w-5 self-center text-accent" />
                    <p className="min-w-0 rounded-xl bg-[hsl(14_60%_52%/.1)] p-3 text-sm leading-relaxed text-[hsl(14_55%_30%)]">{t.secondPosition}</p>
                  </div>
                  <p className="mt-3 border-s-4 border-accent ps-3 text-sm leading-relaxed"><span className="font-semibold">التوفيق المقترح: </span>{t.resolution}</p>
                </article>
              ))}
            </div>
          </motion.div>
        )}

        {/* Roadmap */}
        <motion.div {...fade(6)}>
          <SectionHead n="ز" title="خطة عمل مقترحة على ثلاث مراحل" icon={Flag} />
          <Roadmap data={data} themeTitle={themeTitle} />
        </motion.div>

        <motion.div {...fade(6)}>
          <Methodology data={data} />
        </motion.div>
      </div>
      <EvidenceDialog request={req} onClose={() => setReq(null)} restoreFocus={() => evidenceTrigger.current?.focus()} evidence={evidence} groups={groups} />
    </EvidenceProvider>
  );
}

function SectionHead({ n, title, icon: Icon }: { n: string; title: string; icon: typeof Lightbulb }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-accent">{n}</span>
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function CoverageChart({ ranked, total }: { ranked: Ranked[]; total: number }) {
  const rows = ranked.map((t) => ({ name: t.title, coverage: t.coverage, priority: t.priority }));
  const ticks = Array.from({ length: total + 1 }, (_, i) => i);
  return (
    <div dir="ltr" className="w-full" data-testid="chart-coverage">
      <ResponsiveContainer width="100%" height={Math.max(260, rows.length * 32 + 40)} debounce={0}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 8, left: 36, bottom: 18 }}>
          <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, total]} ticks={ticks} allowDecimals={false} reversed tick={AX} axisLine={false} tickLine={false}
            label={{ value: `عدد المجموعات (من ${total})`, position: "insideBottom", offset: -10, style: { ...AX, fontSize: 11 } }} />
          <YAxis type="category" dataKey="name" orientation="right" width={170} tick={{ ...AX, fill: "hsl(206 55% 18%)", textAnchor: "start", dx: 6 } as never} interval={0}
            tickFormatter={(v: string) => (v.length > 26 ? v.slice(0, 25) + "…" : v)} axisLine={false} tickLine={false} mirror={false} />
          <Tooltip cursor={{ fill: "hsl(38 25% 91% / .6)" }} isAnimationActive={false}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!active || !p) return null;
              return (
                <div dir="rtl" className="max-w-xs rounded-xl border border-border bg-card p-3 text-xs shadow-lg">
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-1 text-muted-foreground">احتياج صريح في <bdi className="font-semibold tabular-nums text-foreground">{p.coverage}</bdi> من <bdi className="tabular-nums">{total}</bdi> مجموعات · {PRIORITY[p.priority].label}</p>
                </div>
              );
            }} />
          <Bar dataKey="coverage" radius={[6, 0, 0, 6]} barSize={16} isAnimationActive={false}>
            {rows.map((r) => <Cell key={r.name} fill={PRIORITY[r.priority].fill} />)}
            <LabelList dataKey="coverage" position="right" style={{ ...AX, fontWeight: 600 }} formatter={(v: number) => `${v}/${total}`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TierStack({ ranked }: { ranked: Ranked[] }) {
  const reduce = useReducedMotion();
  const tiers = (Object.keys(PRIORITY) as FocusGroupThemePriority[]).map((p) => ({ p, items: ranked.filter((t) => t.priority === p) }));
  const total = ranked.length || 1;
  return (
    <div className="grid gap-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted" aria-hidden>
        {tiers.map(({ p, items }) => (
          <motion.div key={p} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6 }}
            style={{ width: `${(items.length / total) * 100}%`, background: PRIORITY[p].fill, transformOrigin: "right" }} />
        ))}
      </div>
      {tiers.map(({ p, items }) => (
        <div key={p} className="min-w-0" data-testid={`tier-${p}`}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-sm" style={{ background: PRIORITY[p].fill }} />{PRIORITY[p].label}</span>
            <span className="text-xs text-muted-foreground"><bdi className="font-display text-base font-bold tabular-nums text-foreground">{items.length}</bdi> عائلة</span>
          </div>
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {items.map((t) => <li key={t.id} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{t.title}</li>)}
            {!items.length && <li className="text-[11px] text-muted-foreground">لا عائلات في هذه الفئة</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

function StatusMark({ status }: { status: FocusGroupSignalStatus }) {
  return (
    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md",
      status === "explicit" && "bg-primary",
      status === "context" && "border-2 border-accent bg-[repeating-linear-gradient(135deg,hsl(var(--gold)/.35)_0_3px,transparent_3px_6px)]",
      status === "not_observed" && "border-2 border-dashed border-border")} aria-label={STATUS[status].label} />
  );
}

function SignalMatrix({ data, ranked }: { data: FocusGroupAnalysis; ranked: Ranked[] }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        {(Object.keys(STATUS) as FocusGroupSignalStatus[]).map((s) => <span key={s} className="flex items-center gap-1.5"><StatusMark status={s} />{STATUS[s].label}</span>)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-1 text-sm">
          <thead><tr className="text-[11px] text-muted-foreground">
            <th className="pb-1 text-start font-medium">العائلة التدريبية</th>
            {data.groups.map((g) => <th key={g.id} className="px-2 pb-1 text-center font-medium">{g.label}</th>)}
            <th className="pb-1 text-center font-medium">التغطية</th>
          </tr></thead>
          <tbody>
            {ranked.map((t) => (
              <tr key={t.id} className="group" data-testid={`row-matrix-${t.id}`}>
                <td className="rounded-s-lg bg-muted/40 px-3 py-1.5 text-[13px] group-hover:bg-muted">{t.title}</td>
                {data.groups.map((g) => {
                  const s = t.signals.find((x) => x.groupId === g.id);
                  const status = s?.status ?? "not_observed";
                  const has = !!s && s.evidenceIds.length > 0;
                  return (
                    <td key={g.id} className="bg-muted/40 px-2 py-1.5 text-center group-hover:bg-muted">
                      <CellButton disabled={!has} title={`${t.title} · ${g.label}: ${STATUS[status].label}`} ids={s?.evidenceIds ?? []} note={s?.note} testId={`cell-${t.id}-${g.id}`}>
                        <StatusMark status={status} />
                      </CellButton>
                    </td>
                  );
                })}
                <td className="rounded-e-lg bg-muted/40 px-3 py-1.5 text-center font-display font-semibold tabular-nums group-hover:bg-muted"><bdi>{t.coverage}/{data.groups.length}</bdi></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellButton({ disabled, title, ids, note, testId, children }: { disabled: boolean; title: string; ids: string[]; note?: string; testId: string; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  if (disabled) return <span className="inline-flex" title={note ? `${title} — ${note}` : title} data-testid={testId}>{children}</span>;
  return (
    <span className="relative inline-flex" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <OpenEvidence ids={ids} title={title} note={note} testId={testId}>{children}</OpenEvidence>
      {hover && note && (
        <span role="tooltip" className="pointer-events-none absolute bottom-full start-1/2 z-10 mb-1 w-56 -translate-x-1/2 rounded-lg bg-primary p-2 text-start text-[11px] leading-relaxed text-primary-foreground shadow-lg rtl:translate-x-1/2">{note}</span>
      )}
    </span>
  );
}

function OpenEvidence({ ids, title, note, testId, children }: { ids: string[]; title: string; note?: string; testId: string; children: ReactNode }) {
  return (
    <CiteTrigger ids={ids} title={title} note={note} testId={testId}>{children}</CiteTrigger>
  );
}

function CiteTrigger({ ids, title, note, testId, children }: { ids: string[]; title: string; note?: string; testId: string; children: ReactNode }) {
  const { open } = useEvidence();
  return (
    <button type="button" onClick={() => open({ title, ids, note })} aria-label={`${title} — فتح الدليل`} data-testid={testId}
      className="inline-flex rounded-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {children}
    </button>
  );
}

function PriorityTable({ data, ranked }: { data: FocusGroupAnalysis; ranked: Ranked[] }) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<"all" | FocusGroupThemePriority>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = ranked.filter((t) => {
    if (tier !== "all" && t.priority !== tier) return false;
    const s = query.trim().toLowerCase();
    if (!s) return true;
    return [t.title, t.summary, t.audience, t.deliveryAdvice, ...t.courseIdeas].some((x) => x.toLowerCase().includes(s));
  });
  return (
    <Panel title="جدول الأولويات" sub="مرتّب حسب التغطية الصريحة فقط؛ التعادل يُعرض بعلامة «=» ولا يوجد فائز وحيد. أفكار الدورات اقتراحات تحليلية لا عروض قائمة أو اعتمادات مؤكدة."
      action={<span className="text-[11px] text-muted-foreground"><bdi className="tabular-nums">{rows.length}</bdi> من <bdi className="tabular-nums">{ranked.length}</bdi></span>} testId="panel-priority">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" aria-label="البحث في العائلات التدريبية" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في العائلات وأفكار الدورات والجمهور…" data-testid="input-search-themes"
            className="h-10 w-full rounded-xl border border-input bg-background ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
        </label>
        <TierChips value={tier} onChange={setTier} testId="filter-tier" options={TIER_OPTIONS} />
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center" data-testid="empty-search">
          <SearchX className="h-7 w-7 text-muted-foreground" />
          <p className="mt-2 font-semibold">لا نتائج مطابقة</p>
          <button onClick={() => { setQuery(""); setTier("all"); }} className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground" data-testid="button-clear-search">مسح البحث والتصفية</button>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((t) => {
            const open = openId === t.id;
            return (
              <div key={t.id} className={cn("min-w-0 overflow-hidden rounded-2xl border transition-colors", open ? "border-accent/60 bg-background" : "border-border")} data-testid={`row-theme-${t.id}`}>
                <button type="button" onClick={() => setOpenId(open ? null : t.id)} aria-expanded={open} data-testid={`button-expand-${t.id}`}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-3 text-start hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[auto_1fr_auto_auto_auto]">
                  <span className="font-display w-9 text-center text-lg font-bold tabular-nums text-primary"><bdi>{t.rank}{t.tied ? "=" : ""}</bdi></span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{t.title}</span>
                    <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{t.courseIdeas.slice(0, 2).join(" · ")}</span>
                  </span>
                  <span className="hidden gap-1 sm:flex">{data.groups.map((g) => <StatusMark key={g.id} status={t.signals.find((s) => s.groupId === g.id)?.status ?? "not_observed"} />)}</span>
                  <Pill tone={PRIORITY[t.priority].tone} className="hidden sm:inline-flex"><bdi>{t.coverage}/{data.groups.length}</bdi></Pill>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                      <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[1.2fr_1fr]">
                        <div className="min-w-0">
                          <p className="text-sm leading-relaxed">{t.summary}</p>
                          <p className="mt-3 text-[11px] font-semibold text-muted-foreground">أفكار دورات مقترحة (اقتراح تحليلي)</p>
                          <ul className="mt-1.5 grid gap-1.5">
                            {t.courseIdeas.map((c) => <li key={c} className="flex gap-2 rounded-lg bg-secondary/60 px-3 py-1.5 text-sm text-secondary-foreground"><BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />{c}</li>)}
                          </ul>
                          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-lg bg-muted/60 p-2.5"><dt className="text-[11px] text-muted-foreground">الجمهور</dt><dd className="mt-0.5 leading-relaxed">{t.audience}</dd></div>
                            <div className="rounded-lg bg-muted/60 p-2.5"><dt className="text-[11px] text-muted-foreground">نصيحة التقديم</dt><dd className="mt-0.5 leading-relaxed">{t.deliveryAdvice}</dd></div>
                          </dl>
                        </div>
                        <div className="grid content-start gap-2">
                          <p className="text-[11px] font-semibold text-muted-foreground">الإشارة في كل مجموعة</p>
                          {data.groups.map((g) => {
                            const s = t.signals.find((x) => x.groupId === g.id);
                            const status = s?.status ?? "not_observed";
                            return (
                              <div key={g.id} className="min-w-0 rounded-xl border border-border p-2.5">
                                <div className="flex items-center gap-2"><StatusMark status={status} /><span className="text-sm font-semibold">{g.label}</span><span className="text-[11px] text-muted-foreground">{STATUS[status].short}</span>
                                  {s && s.evidenceIds.length > 0 && <CiteButton className="ms-auto" ids={s.evidenceIds} title={`${t.title} · ${g.label}`} note={s.note} />}
                                </div>
                                {s?.note && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.note}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function GroupExplorer({ data, themeTitle }: { data: FocusGroupAnalysis; themeTitle: Map<string, string> }) {
  const reduce = useReducedMotion();
  const [gid, setGid] = useState(data.groups[0]?.id ?? "");
  const g = data.groups.find((x) => x.id === gid) ?? data.groups[0];
  if (!g) return null;
  const explicit = data.themes.filter((t) => t.signals.some((s) => s.groupId === g.id && s.status === "explicit"));
  return (
    <div className="min-w-0 rounded-2xl border border-card-border bg-card">
      <div role="tablist" aria-label="المجموعات البؤرية" className="flex gap-1 overflow-x-auto border-b border-border p-2">
        {data.groups.map((x) => (
          <button key={x.id} id={`focus-group-tab-${x.id}`} role="tab" aria-selected={x.id === g.id} aria-controls={`focus-group-panel-${x.id}`}
            tabIndex={x.id === g.id ? 0 : -1} onClick={() => setGid(x.id)} data-testid={`tab-group-${x.id}`}
            onKeyDown={(event) => {
              const index = data.groups.findIndex((item) => item.id === x.id);
              const next = event.key === "ArrowLeft" ? (index + 1) % data.groups.length
                : event.key === "ArrowRight" ? (index - 1 + data.groups.length) % data.groups.length
                : event.key === "Home" ? 0 : event.key === "End" ? data.groups.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault();
              setGid(data.groups[next].id);
              document.getElementById(`focus-group-tab-${data.groups[next].id}`)?.focus();
            }}
            className={cn("shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", x.id === g.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            {x.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={g.id} id={`focus-group-panel-${g.id}`} role="tabpanel" aria-labelledby={`focus-group-tab-${g.id}`}
          initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
          className="grid gap-5 p-5 lg:grid-cols-[1.3fr_1fr]" data-testid={`panel-group-${g.id}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /><bdi dir="ltr" className="font-mono">{g.sourceFile}</bdi></span>
              <Pill>{g.sourceLanguage === "en" ? "سجل بالإنجليزية" : "سجل بالعربية"}</Pill>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{g.context}</p>
            <p className="mt-3 border-s-4 border-accent ps-3 text-base font-semibold leading-relaxed text-primary">{g.takeaway}</p>
            {g.distinctiveThemes.length > 0 && (
              <><p className="mt-4 text-[11px] font-semibold text-muted-foreground">ما يميّز هذه المجموعة</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">{g.distinctiveThemes.map((d) => <li key={d} className="rounded-lg bg-accent/15 px-2 py-1 text-xs">{themeTitle.get(d) ?? d}</li>)}</ul></>
            )}
            <CiteButton className="mt-4" ids={data.evidence.filter((e) => e.groupId === g.id).map((e) => e.id)} title={`مقتطفات ${g.label}`} label="كل مقتطفات المجموعة" />
          </div>
          <div className="min-w-0 rounded-xl bg-muted/50 p-4">
            <p className="text-[11px] font-semibold text-muted-foreground">احتياجات صريحة في هذا السجل · <bdi className="tabular-nums">{explicit.length}</bdi> من <bdi className="tabular-nums">{data.themes.length}</bdi> عائلة</p>
            <ul className="mt-2 grid gap-1.5">
              {explicit.map((t) => <li key={t.id} className="flex items-center gap-2 text-sm"><span className="h-2 w-2 shrink-0 rounded-full bg-primary" />{t.title}</li>)}
              {!explicit.length && <li className="text-sm text-muted-foreground">لا احتياجات صريحة مُرمَّزة.</li>}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function IssuesTable({ data }: { data: FocusGroupAnalysis }) {
  if (!data.issues.length) return <p className="text-sm text-muted-foreground">لا عوائق مُرمَّزة.</p>;
  return (
    <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
      <div className="hidden grid-cols-[1fr_1.2fr_1.2fr_1.2fr_auto] gap-4 bg-primary px-4 py-2.5 text-[11px] font-semibold text-primary-foreground md:grid">
        <span>العائق</span><span>ما لوحظ</span><span>الأثر على البرامج</span><span>التوصية</span><span className="w-16" />
      </div>
      {data.issues.map((i, n) => (
        <div key={i.id} className={cn("grid min-w-0 gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_1.2fr_1.2fr_1.2fr_auto] md:gap-4", n % 2 && "bg-muted/40")} data-testid={`row-issue-${i.id}`}>
          <p className="font-semibold text-primary">{i.title}</p>
          <p className="leading-relaxed text-muted-foreground"><span className="font-semibold md:hidden">ما لوحظ: </span>{i.observation}</p>
          <p className="leading-relaxed"><span className="font-semibold md:hidden">الأثر: </span>{i.implication}</p>
          <p className="leading-relaxed text-secondary-foreground"><span className="font-semibold md:hidden">التوصية: </span>{i.recommendation}</p>
          <div className="w-16"><CiteButton ids={i.evidenceIds} title={i.title} /></div>
        </div>
      ))}
    </div>
  );
}

function Roadmap({ data, themeTitle }: { data: FocusGroupAnalysis; themeTitle: Map<string, string> }) {
  const stages = [1, 2, 3].map((s) => ({ s, items: data.recommendations.filter((r) => r.stage === s) })).filter((x) => x.items.length);
  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">النوافذ الزمنية مقترحة للتخطيط، وليست التزامات صادرة عن الاجتماعات. مقاييس النجاح مقترحة دون خط أساس.</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {stages.map(({ s, items }) => (
          <div key={s} className="min-w-0 rounded-2xl border border-card-border bg-card" data-testid={`stage-${s}`}>
            <div className={cn("flex items-center gap-3 rounded-t-2xl p-4", s === 1 ? "ink-panel" : s === 2 ? "bg-secondary" : "bg-muted")}>
              <span className="font-display text-3xl font-bold tabular-nums text-accent">{s}</span>
              <div className="min-w-0"><p className="text-sm font-semibold">المرحلة {s}</p><p className={cn("text-[11px]", s === 1 ? "text-white/65" : "text-muted-foreground")}>{items[0].timeframe}</p></div>
            </div>
            <div className="grid gap-3 p-4">
              {items.map((r) => (
                <article key={r.id} className="min-w-0 border-b border-dashed border-border pb-3 last:border-0 last:pb-0" data-testid={`card-action-${r.id}`}>
                  <h3 className="font-semibold leading-snug text-primary">{r.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.action}</p>
                  <dl className="mt-2 grid gap-1 text-xs">
                    <div className="flex gap-1"><dt className="shrink-0 font-semibold">المسؤول:</dt><dd>{r.owner}</dd></div>
                    <div className="flex gap-1"><dt className="shrink-0 font-semibold">مقياس النجاح:</dt><dd>{r.successMeasure}</dd></div>
                    {r.timeframe !== items[0].timeframe && <div className="flex gap-1"><dt className="shrink-0 font-semibold">النافذة:</dt><dd>{r.timeframe}</dd></div>}
                  </dl>
                  {r.themeIds.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{r.themeIds.map((t) => <Pill key={t}>{themeTitle.get(t) ?? t}</Pill>)}</div>}
                  <CiteButton className="mt-2" ids={r.evidenceIds} title={r.title} />
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Methodology({ data }: { data: FocusGroupAnalysis }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const m = data.methodology;
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card" data-testid="section-methodology">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} data-testid="button-toggle-methodology"
        className="flex w-full items-center gap-3 p-5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <BookOpen className="h-5 w-5 text-accent" />
        <span className="min-w-0 flex-1"><span className="block font-semibold text-primary">المنهجية وحدود القراءة</span><span className="block text-xs text-muted-foreground">كيف رُمّزت السجلات، ووحدة العدّ، وما لا يمكن استنتاجه.</span></span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="grid gap-4 border-t border-border p-5 md:grid-cols-2">
              {[["المقاربة", m.approach], ["وحدة العدّ", m.countUnit], ["قاعدة الترتيب", m.rankingRule], ["قاعدة الدليل", m.evidenceRule], ["النطاق", m.scopeNote]].map(([k, v]) => (
                <div key={k} className="min-w-0"><p className="text-[11px] font-semibold text-accent">{k}</p><p className="mt-1 text-sm leading-relaxed">{v}</p></div>
              ))}
              <div className="min-w-0 md:col-span-2">
                <p className="text-[11px] font-semibold text-[hsl(14_60%_40%)]">القيود</p>
                <ul className="mt-1.5 grid gap-1.5">{m.limitations.map((l) => <li key={l} className="flex gap-2 text-sm leading-relaxed"><AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-[hsl(14_60%_50%)]" />{l}</li>)}</ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  KeyRound, Loader2, LogOut, LayoutDashboard, Activity, GraduationCap, ListOrdered, SlidersHorizontal, Target, Table2,
  Download, ChevronRight, ChevronLeft, X, Inbox, AlertTriangle, RefreshCw, Users, CheckCircle2, Clock, Bookmark, Contact, Menu,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend,
} from "recharts";
import {
  setAuthTokenGetter, useVerifyAdminKey, useGetAdminSummary, getGetAdminSummaryQueryKey, useListAdminResponses,
  getListAdminResponsesQueryKey, useGetSkillsGap, getGetSkillsGapQueryKey, useGetCourseDemand, getGetCourseDemandQueryKey,
  useGetTrackRanks, getGetTrackRanksQueryKey, useGetPreferences, getGetPreferencesQueryKey, useGetMatchingResults,
  getGetMatchingResultsQueryKey, useListCatalogue, getListCatalogueQueryKey, useExportResponsesCsv, getExportResponsesCsvQueryKey,
  type CountItem, type SurveyResponse, type SkillStats, type ListAdminResponsesParams, type SurveyPath,
} from "@workspace/api-client-react";
import { TRAINING_TOPICS } from "@workspace/api-zod/training";
import { cn } from "@/lib/utils";
import {
  SURVEY_TITLE, QUESTION_LABELS, SKILL_LABELS, TRACK_LABELS, COURSE_LABELS, LEVEL_LABELS, SUB_LABELS, optionLabel, Q, SKILLS, GROUP_LABELS,
} from "@/lib/survey-definition";

setAuthTokenGetter(() => sessionStorage.getItem("adminKey"));

type Tab = "overview" | "skills" | "courses" | "tracks" | "prefs" | "matching" | "responses";
const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "skills", label: "فجوة المهارات", icon: Activity },
  { id: "courses", label: "الطلب على الدورات", icon: GraduationCap },
  { id: "tracks", label: "المسارات المستقبلية", icon: ListOrdered },
  { id: "prefs", label: "التفضيلات", icon: SlidersHorizontal },
  { id: "matching", label: "المطابقة", icon: Target },
  { id: "responses", label: "الردود", icon: Table2 },
];
const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: d }) : "–");
const AX = { fontSize: 11, fontFamily: "IBM Plex Sans Arabic", fill: "hsl(208 15% 40%)" };

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("adminKey"));
  if (!authed) return <KeyGate onOk={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem("adminKey"); setAuthed(false); }} />;
}

function KeyGate({ onOk }: { onOk: () => void }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const verify = useVerifyAdminKey();
  const submit = async () => {
    if (!key.trim()) { setErr("يرجى إدخال مفتاح الوصول"); return; }
    sessionStorage.setItem("adminKey", key.trim());
    try {
      await verify.mutateAsync();
      onOk();
    } catch {
      sessionStorage.removeItem("adminKey");
      setErr("المفتاح غير صحيح أو تعذّر الاتصال. تحقق وأعد المحاولة.");
    }
  };
  return (
    <div className="min-h-[100dvh] grain ink-panel relative flex items-center justify-center overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-2.5 sadu opacity-70" />
      <div className="absolute -end-40 top-10 h-96 w-96 rounded-full bg-[hsl(var(--teal)/.3)] blur-3xl" />
      <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="relative w-full max-w-sm rounded-3xl bg-card p-7 text-foreground shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><KeyRound className="h-6 w-6" /></div>
        <h1 className="mt-6 text-2xl font-bold text-primary">لوحة فريق البحث</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{SURVEY_TITLE}</p>
        <label className="mt-6 block text-sm font-medium">مفتاح الوصول</label>
        <input type="password" dir="ltr" value={key} onChange={(e) => { setKey(e.target.value); setErr(""); }} autoFocus data-testid="input-admin-key"
          className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-4 text-end outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
        {err && <p className="mt-2 text-sm text-destructive" data-testid="error-admin-key">{err}</p>}
        <button type="submit" disabled={verify.isPending} data-testid="button-admin-login"
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-70">
          {verify.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "دخول"}
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">مفتاح مشترك لفريق البحث. يُحفظ لهذه الجلسة فقط.</p>
      </motion.form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [path, setPath] = useState<SurveyPath | undefined>(undefined);
  const [navOpen, setNavOpen] = useState(false);
  const csv = useExportResponsesCsv({ query: { enabled: false, queryKey: getExportResponsesCsvQueryKey() } });
  const download = async () => {
    const r = await csv.refetch();
    if (!r.data) return;
    const blob = new Blob(["\ufeff" + r.data], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kuwait-tna-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const showPath = ["overview", "courses", "tracks", "prefs"].includes(tab);
  return (
    <div className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={cn("fixed inset-y-0 start-0 z-50 w-[250px] bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
        navOpen ? "translate-x-0" : "translate-x-full")}>
        <div className="h-2 sadu opacity-70" />
        <div className="p-5">
          <p className="font-display text-xs font-semibold tracking-wider text-sidebar-primary">ASDC · KCCI</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">دراسة الاحتياجات التدريبية 2026/2027</p>
        </div>
        <nav className="grid gap-0.5 px-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setNavOpen(false); }} data-testid={`tab-${t.id}`}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                tab === t.id ? "bg-sidebar-accent font-semibold text-white" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60")}>
              <t.icon className={cn("h-4 w-4", tab === t.id && "text-sidebar-primary")} />{t.label}
            </button>
          ))}
        </nav>
        <div className="absolute inset-x-3 bottom-4 grid gap-1">
          <button onClick={download} disabled={csv.isFetching} className="flex items-center gap-3 rounded-lg bg-sidebar-primary px-3 py-2.5 text-sm font-semibold text-sidebar-primary-foreground" data-testid="button-export-csv">
            {csv.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تصدير CSV
          </button>
          {csv.isError && <p className="px-2 text-xs text-red-300">تعذّر التصدير، أعد المحاولة.</p>}
          <button onClick={onLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60" data-testid="button-logout">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </button>
        </div>
      </aside>
      {navOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setNavOpen(false)} />}
      <main className="min-w-0 px-4 py-5 sm:px-8">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border p-2 lg:hidden" onClick={() => setNavOpen(true)} data-testid="button-menu"><Menu className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-primary">{TABS.find((t) => t.id === tab)?.label}</h1>
          {showPath && (
            <div className="ms-auto flex rounded-xl border border-border bg-card p-1 text-sm" data-testid="filter-path">
              {[{ v: undefined, l: "الكل" }, { v: "B2B" as const, l: "B2B" }, { v: "B2C" as const, l: "B2C" }].map((o) => (
                <button key={o.l} onClick={() => setPath(o.v)} className={cn("rounded-lg px-4 py-1.5 font-medium", path === o.v ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>{o.l}</button>
              ))}
            </div>
          )}
        </header>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {tab === "overview" && <Overview path={path} />}
          {tab === "skills" && <SkillsGap />}
          {tab === "courses" && <Courses path={path} />}
          {tab === "tracks" && <Tracks path={path} />}
          {tab === "prefs" && <Prefs path={path} />}
          {tab === "matching" && <Matching />}
          {tab === "responses" && <Responses />}
        </motion.div>
      </main>
    </div>
  );
}

/* ---------- shared ---------- */
function Panel({ title, sub, children, className }: { title?: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-card-border bg-card p-5", className)}>
      {title && <h2 className="font-semibold">{title}</h2>}
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
function Skel({ rows = 4 }: { rows?: number }) {
  return <div className="grid gap-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>;
}
function Err({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="mt-3 font-medium">تعذّر تحميل البيانات</p>
      <button onClick={onRetry} className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" data-testid="button-retry"><RefreshCw className="h-4 w-4" /> إعادة المحاولة</button>
    </div>
  );
}
function Empty({ title = "لا توجد ردود مكتملة بعد", text = "ستظهر النتائج هنا تلقائياً فور وصول أول ردود من الميدان. شارك رابط الاستبانة لبدء جمع البيانات." }: { title?: string; text?: string }) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-dashed border-border bg-card p-12 text-center" data-testid="empty-state">
      <div className="absolute inset-x-0 top-0 h-1.5 sadu opacity-40" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><Inbox className="h-7 w-7" /></div>
      <p className="mt-4 text-lg font-semibold text-primary">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
function HBars({ items, color = "bg-primary" }: { items: CountItem[]; color?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">لا بيانات</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="grid gap-2.5">
      {items.map((i) => (
        <div key={i.key}>
          <div className="mb-1 flex justify-between gap-2 text-[13px]"><span className="leading-snug">{i.label}</span><span className="shrink-0 tabular-nums text-muted-foreground">{i.count} · {fmt(i.pct)}%</span></div>
          <div className="h-2 rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${(i.count / max) * 100}%` }} className={cn("h-2 rounded-full", color)} /></div>
        </div>
      ))}
    </div>
  );
}
function Kpi({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof Users; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", accent ? "ink-panel border-transparent" : "border-card-border bg-card")}>
      <div className="flex items-center justify-between"><span className={cn("text-xs", accent ? "text-white/70" : "text-muted-foreground")}>{label}</span><Icon className={cn("h-4 w-4", accent ? "text-accent" : "text-muted-foreground")} /></div>
      <p className="font-display mt-2 text-3xl font-semibold tabular-nums" data-testid={`kpi-${label}`}>{value}</p>
    </div>
  );
}

/* ---------- overview ---------- */
function Overview({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetAdminSummary(params, { query: { queryKey: getGetAdminSummaryQueryKey(params) } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const s = q.data;
  const maxReach = Math.max(...s.dropOff.map((d) => d.reached), 1);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi accent label="إجمالي البدايات" value={fmt(s.total, 0)} icon={Users} />
        <Kpi label="مكتملة" value={fmt(s.completed, 0)} icon={CheckCircle2} />
        <Kpi label="معدل الإكمال" value={`${fmt(s.completionRate)}%`} icon={Activity} />
        <Kpi label="B2B / B2C" value={`${s.b2b} / ${s.b2c}`} icon={Target} />
        <Kpi label="متوسط المدة" value={`${fmt(s.avgDurationSec / 60)} د`} icon={Clock} />
        <Kpi label="حجوزات من التقييم السابق" value={fmt(s.bookNowRespondents, 0)} icon={Bookmark} />
        <Kpi label="بيانات تواصل" value={fmt(s.contactsCaptured, 0)} icon={Contact} />
      </div>
      {s.total === 0 ? <Empty /> : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Panel title="الردود اليومية" sub="البدايات مقابل الإكمال">
              <div className="h-64" dir="ltr">
                <ResponsiveContainer>
                  <AreaChart data={s.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 22% 88%)" />
                    <XAxis dataKey="date" tick={AX} reversed />
                    <YAxis tick={AX} orientation="right" allowDecimals={false} />
                    <Tooltip contentStyle={{ fontFamily: "IBM Plex Sans Arabic", direction: "rtl", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="started" name="بدأ" stroke="hsl(var(--chart-5))" fill="hsl(var(--chart-5) / .2)" />
                    <Area type="monotone" dataKey="completed" name="أكمل" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-2) / .35)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="مسار التسرب حسب القسم" sub="عدد من وصل إلى كل قسم ومن توقف عنده">
              <div className="grid gap-3">
                {s.dropOff.map((d) => (
                  <div key={d.step}>
                    <div className="mb-1 flex justify-between text-[13px]"><span>{d.label}</span><span className="tabular-nums text-muted-foreground">{d.reached} وصل · <span className="text-destructive">{d.stuck} توقف</span></span></div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                      <div className="bg-primary" style={{ width: `${((d.reached - d.stuck) / maxReach) * 100}%` }} />
                      <div className="bg-destructive/70" style={{ width: `${(d.stuck / maxReach) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Panel title="الجنسية"><HBars items={s.byNationality} /></Panel>
            <Panel title="الجنس"><HBars items={s.byGender} color="bg-[hsl(var(--teal))]" /></Panel>
            <Panel title="الفئة العمرية"><HBars items={s.byAge} color="bg-accent" /></Panel>
            <Panel title="المستوى التعليمي"><HBars items={s.byEducation} /></Panel>
            <Panel title="القطاع"><HBars items={s.bySector} color="bg-[hsl(var(--teal))]" /></Panel>
            <Panel title="المستوى الوظيفي"><HBars items={s.byJobLevel} color="bg-accent" /></Panel>
            <Panel title="حجم المؤسسة (B2B)"><HBars items={s.byOrgSize} /></Panel>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- skills ---------- */
function StatCells({ s }: { s: SkillStats }) {
  const gapColor = s.meanGap > 1 ? "bg-destructive/15 text-destructive" : s.meanGap > 0.5 ? "bg-accent/20 text-[hsl(32_70%_30%)]" : "bg-secondary text-secondary-foreground";
  return (
    <>
      <td className="px-2 py-2.5 text-center tabular-nums">{s.n}</td>
      <td className="px-2 py-2.5 text-center tabular-nums">{fmt(s.meanImportance, 2)}</td>
      <td className="px-2 py-2.5 text-center tabular-nums">{fmt(s.meanPerformance, 2)}</td>
      <td className="px-2 py-2.5 text-center"><span className={cn("rounded-md px-2 py-0.5 font-semibold tabular-nums", s.n ? gapColor : "")}>{fmt(s.meanGap, 2)}</span></td>
      <td className="px-2 py-2.5 text-center tabular-nums font-medium">{fmt(s.weightedGap, 2)}</td>
    </>
  );
}
function SkillsGap() {
  const q = useGetSkillsGap({ query: { queryKey: getGetSkillsGapQueryKey() } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const items = q.data.items;
  if (!items.length || items.every((i) => i.all.n === 0)) return <Empty />;
  const chart = (key: "b2b" | "b2c") => items.map((i) => ({ name: i.skillId, imp: i[key].meanImportance, perf: i[key].meanPerformance }));
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {(["b2b", "b2c"] as const).map((k) => (
          <Panel key={k} title={k === "b2b" ? "B2B · تقييم أصحاب العمل لفرقهم" : "B2C · التقييم الذاتي للأفراد"} sub="الأهمية مقابل الأداء (1-5)">
            <div className="h-64" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={chart(k)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 22% 88%)" vertical={false} />
                  <XAxis dataKey="name" tick={AX} reversed />
                  <YAxis domain={[0, 5]} tick={AX} orientation="right" />
                  <Tooltip labelFormatter={(l) => SKILL_LABELS[String(l)] ?? l} contentStyle={{ fontFamily: "IBM Plex Sans Arabic", direction: "rtl", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontFamily: "IBM Plex Sans Arabic", fontSize: 12 }} />
                  <Bar dataKey="imp" name="الأهمية" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perf" name="الأداء" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ))}
      </div>
      <Panel title="جدول الفجوات" sub="الفجوة = الأهمية − الأداء · الفجوة المرجّحة = الفجوة × الأهمية">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-2 text-start">المهارة</th>
                <th colSpan={5} className="border-s border-border bg-primary/5 py-2">B2B</th>
                <th colSpan={5} className="border-s border-border bg-accent/10 py-2">B2C</th>
              </tr>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th />
                {[0, 1].map((x) => ["n", "أهمية", "أداء", "فجوة", "مرجّحة"].map((h) => <th key={x + h} className="px-2 py-1.5 font-medium">{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...items].sort((a, b) => b.all.weightedGap - a.all.weightedGap).map((i) => (
                <tr key={i.skillId} data-testid={`row-skill-${i.skillId}`}>
                  <td className="py-2.5 pe-3"><span className="me-1.5 text-xs text-muted-foreground">{i.skillId}</span>{SKILL_LABELS[i.skillId] ?? i.label}</td>
                  <StatCells s={i.b2b} /><StatCells s={i.b2c} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- courses ---------- */
function Courses({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetCourseDemand(params, { query: { queryKey: getGetCourseDemandQueryKey(params) } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const { items, topics, enquiries } = q.data;
  const legacy = items.filter((i) => i.shown > 0);
  const hasTopics = topics.some((t) => t.selected > 0 || t.respondents > 0);
  if (!hasTopics && !enquiries.some((e) => e.recommended > 0) && !legacy.length) return <Empty />;
  const gate = new Map(q.data.groups.map((g) => [g.groupId, g]));
  const sortedTopics = [...topics].sort((a, b) => b.selected - a.selected);
  const maxTopic = Math.max(...sortedTopics.map((t) => t.selected), 1);
  // inferred workshop relevance: sum of selections of every topic that maps to the workshop
  const inferred = new Map<string, { n: number; topics: string[] }>();
  topics.forEach((t) => t.courseIds.forEach((c) => {
    const cur = inferred.get(c) ?? { n: 0, topics: [] };
    cur.n += t.selected; if (t.selected > 0) cur.topics.push(t.label);
    inferred.set(c, cur);
  }));
  const inferredRows = [...inferred.entries()].filter(([, v]) => v.n > 0).sort((a, b) => b[1].n - a[1].n);
  const maxInf = Math.max(...inferredRows.map(([, v]) => v.n), 1);
  const enqRows = [...enquiries].filter((e) => e.recommended > 0 || e.enquiries > 0).sort((a, b) => b.enquiries - a.enquiries || b.recommended - a.recommended);
  const legacyGroups = Array.from(new Set(legacy.map((i) => i.groupId)));
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 rounded-2xl border border-card-border bg-card p-4 text-xs leading-relaxed text-muted-foreground md:grid-cols-3">
        <p><b className="text-foreground">1 · أولويات الموضوعات:</b> ما اختاره المشاركون مباشرة.</p>
        <p><b className="text-foreground">2 · صلة الورش المستنتجة:</b> تقدير تخطيطي عبر ربط الموضوعات بالورش، وليس تقييماً مباشراً للورشة.</p>
        <p><b className="text-foreground">3 · طلبات التفاصيل:</b> طلب صريح للتفاصيل، وليس حجزاً مؤكداً. غياب الطلب لا يعني عدم الاهتمام.</p>
      </div>
      <Panel title="1 · أولويات الموضوعات المختارة مباشرة" sub="النسبة محسوبة ممن أجابوا عن الأولويات واختاروا مسار الموضوع؛ لكل مشارك حتى ثلاثة موضوعات إجمالاً. عدم اختيار موضوع لا يعني عدم الاهتمام.">
        {!hasTopics ? <p className="text-sm text-muted-foreground">لا توجد اختيارات موضوعات بعد.</p> : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {sortedTopics.map((t) => (
              <div key={t.topicId} data-testid={`row-topic-${t.topicId}`}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="leading-snug"><span className="me-1.5 text-xs text-muted-foreground">{GROUP_LABELS[t.groupId]?.split("،")[0]}</span>{t.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground"><b className="text-foreground">{fmt(t.selectedShare, 0)}%</b> · {t.selected}/{t.respondents}</span>
                </div>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-[hsl(var(--teal))]" style={{ width: `${(t.selected / maxTopic) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="2 · صلة الورش المستنتجة عبر الموضوعات" sub="مجموع اختيارات الموضوعات المرتبطة بكل ورشة. مؤشر تخطيط وليس تقييماً مباشراً.">
        {!inferredRows.length ? <p className="text-sm text-muted-foreground">ستظهر الصلة المستنتجة عند اختيار الموضوعات.</p> : (
          <div className="grid gap-2.5">
            {inferredRows.map(([cid, v]) => (
              <div key={cid} className="grid items-center gap-2 md:grid-cols-[1fr_240px_70px]" data-testid={`row-inferred-${cid}`}>
                <div className="text-sm"><span className="me-1.5 text-xs text-muted-foreground">{cid}</span>{COURSE_LABELS[cid] ?? cid}
                  <p className="text-[11px] text-muted-foreground">عبر: {v.topics.join("، ")}</p></div>
                <div className="h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-gradient-to-l from-accent to-primary" style={{ width: `${(v.n / maxInf) * 100}%` }} /></div>
                <span className="text-end text-sm font-semibold tabular-nums">{v.n}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="3 · طلبات تفاصيل الدورات الصريحة" sub="عدد من طلبوا التفاصيل من بين من عُرضت عليهم الدورة كمقترح. غياب الطلب لا يعني عدم الاهتمام.">
        {!enqRows.length ? <p className="text-sm text-muted-foreground">لم تُعرض دورات مقترحة بعد.</p> : (
          <div className="grid gap-2.5">
            {enqRows.map((e) => (
              <div key={e.courseId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm" data-testid={`row-enquiry-${e.courseId}`}>
                <span><span className="me-1.5 text-xs text-muted-foreground">{e.courseId}</span>{COURSE_LABELS[e.courseId] ?? e.label}</span>
                <span className="flex items-center gap-2 text-xs tabular-nums">
                  <span className="text-muted-foreground">عُرضت {e.recommended}</span>
                  {e.enquiries > 0
                    ? <span className="rounded bg-accent/20 px-1.5 py-0.5 font-medium text-[hsl(32_70%_28%)]">طلبات {e.enquiries} · {fmt(e.enquiryShare, 0)}%</span>
                    : <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">لا طلبات</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
      {legacy.length > 0 && (
        <section className="grid gap-4 rounded-2xl border border-dashed border-border bg-muted/30 p-4" data-testid="section-legacy-ratings">
          <div>
            <h2 className="font-semibold">تقييمات الدورات التاريخية (الاستبانة السابقة)</h2>
            <p className="text-xs text-muted-foreground">ردود قديمة قيّم فيها المشاركون كل دورة مباشرة. لا تتأثر بالتدفق الجديد. حجز فوري هنا يعني الاختيار القديم فقط.</p>
          </div>
          {legacyGroups.sort((a, b) => (gate.get(b)?.selected ?? 0) - (gate.get(a)?.selected ?? 0)).map((g) => {
            const rows = legacy.filter((i) => i.groupId === g).sort((a, b) => b.needIndex - a.needIndex);
            return (
              <Panel key={g} title={rows[0].groupLabel}>
                <div className="grid gap-3">
                  {rows.map((r) => (
                    <div key={r.courseId} className="grid items-center gap-2 md:grid-cols-[1fr_260px_140px]" data-testid={`row-course-${r.courseId}`}>
                      <p className="text-sm"><span className="me-1.5 text-xs text-muted-foreground">{r.courseId}</span>{COURSE_LABELS[r.courseId] ?? r.label}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-gradient-to-l from-accent to-primary" style={{ width: `${r.needIndex}%` }} /></div>
                        <span className="w-10 text-end font-semibold tabular-nums">{fmt(r.needIndex, 0)}</span>
                      </div>
                      <div className="flex gap-1.5 text-xs tabular-nums text-muted-foreground">
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 font-medium text-[hsl(32_70%_28%)]">حجز {fmt(r.bookNowShare)}%</span>
                        <span>n={r.shown}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })}
        </section>
      )}
    </div>
  );
}

/* ---------- tracks ---------- */
function Tracks({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetTrackRanks(params, { query: { queryKey: getGetTrackRanksQueryKey(params) } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const items = [...q.data.items].sort((a, b) => b.score - a.score);
  if (!items.length || items.every((i) => i.n === 0)) return <Empty />;
  return (
    <Panel title="أولوية المسارات المستقبلية" sub="درجة Borda المعيارية (0-100) · متوسط الترتيب · نسبة المركز الأول">
      <div className="grid gap-3">
        {items.map((t, i) => (
          <div key={t.trackId} className="flex items-center gap-4 rounded-xl border border-border p-3" data-testid={`row-track-${t.trackId}`}>
            <span className={cn("font-display flex h-10 w-10 items-center justify-center rounded-xl font-bold", i === 0 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}>{i + 1}</span>
            <div className="flex-1">
              <p className="font-medium">{TRACK_LABELS[t.trackId] ?? t.label}</p>
              <div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-[hsl(var(--teal))]" style={{ width: `${t.score}%` }} /></div>
            </div>
            <div className="text-end text-xs tabular-nums text-muted-foreground">
              <p className="font-display text-xl font-semibold text-foreground">{fmt(t.score, 0)}</p>
              <p>متوسط {fmt(t.meanRank, 2)} · أول {fmt(t.firstPlaceShare)}%</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- preferences ---------- */
function Prefs({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetPreferences(params, { query: { queryKey: getGetPreferencesQueryKey(params) } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const qs = q.data.questions;
  if (!qs.length || qs.every((x) => x.respondents === 0)) return <Empty />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {qs.map((x, i) => (
        <Panel key={x.questionId} title={QUESTION_LABELS[x.questionId] ?? x.label} sub={`${x.questionId} · ${x.respondents} مجيب`}>
          <HBars items={x.options.map((o) => ({ ...o, label: optionLabel(x.questionId, o.key) === o.key ? o.label : optionLabel(x.questionId, o.key) }))}
            color={["bg-primary", "bg-[hsl(var(--teal))]", "bg-accent"][i % 3]} />
        </Panel>
      ))}
    </div>
  );
}

/* ---------- matching ---------- */
const CELL: Record<string, { label: string; cls: string }> = {
  confirmed_priority: { label: "أولوية مؤكدة", cls: "bg-primary text-primary-foreground" },
  new_demand: { label: "طلب جديد", cls: "bg-accent text-accent-foreground" },
  evidence_led: { label: "مسار تقوده الأدلة", cls: "bg-[hsl(var(--teal))] text-white" },
  defer: { label: "تأجيل", cls: "bg-muted text-muted-foreground" },
};
function Matching() {
  const [w, setW] = useState(40);
  const params = { needWeight: w };
  const q = useGetMatchingResults(params, { query: { queryKey: getGetMatchingResultsQueryKey(params), placeholderData: (p) => p } });
  const cat = useListCatalogue({ query: { queryKey: getListCatalogueQueryKey() } });
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    q.data?.items.forEach((i) => (c[i.gridCell] = (c[i.gridCell] ?? 0) + 1));
    return c;
  }, [q.data]);
  return (
    <div className="grid gap-4">
      <Panel>
        <div className="flex flex-wrap items-center gap-5">
          <div className="min-w-[240px] flex-1">
            <p className="text-sm font-semibold">وزن الاحتياج الميداني: <span className="font-display text-accent tabular-nums">{w}%</span></p>
            <p className="text-xs text-muted-foreground">بقية الأوزان (الأدلة 30 · الأثر 20 · الجاهزية 10) تُعاد موازنتها تناسبياً</p>
            <input type="range" min={30} max={50} step={1} value={w} onChange={(e) => setW(Number(e.target.value))} className="mt-3 w-full accent-[hsl(38_72%_52%)]" data-testid="slider-need-weight" />
            <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums"><span>30</span><span>40</span><span>50</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(CELL).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border p-3 text-center">
                <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", v.cls)}>{v.label}</span>
                <p className="font-display mt-1.5 text-2xl font-semibold tabular-nums">{counts[k] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          الكتالوج: {cat.isLoading ? "…" : `${cat.data?.length ?? 0} ورشة · ${cat.data?.filter((c) => c.shortlisted).length ?? 0} ضمن القائمة المختصرة`}
          {q.data && ` · المجيبون: ${q.data.respondents}`}
        </p>
      </Panel>
      {q.isLoading ? <Skel /> : q.isError || !q.data ? <Err onRetry={() => q.refetch()} /> : !q.data.items.length ? (
        <Empty title="لا توجد نتائج مطابقة بعد" text="تعتمد المطابقة على ردود الميدان مقابل أدلة الدراسة المكتبية. ستُحسب الأولويات بمجرد توفر ردود مكتملة." />
      ) : (
        <Panel title="محفظة الورش مرتبة حسب الدرجة المركّبة">
          <p className="mb-3 rounded-lg bg-secondary p-2.5 text-xs leading-relaxed">مؤشر الأسئلة المرتبطة يأتي من فجوات المهارات وترتيب المسارات والتقييمات التاريخية للورش، وليس تقييماً مباشراً مؤكداً للورشة. أولوية الموضوع مستنتجة. تعتمد الدرجة المركّبة على الأعلى بينهما كمكوّن للاحتياج، وطلبات التفاصيل تُعرض منفصلة ولا تدخل في الدرجات، ولا يتغير تصنيف الخلية بإشارات الموضوعات وحدها.</p>
          {q.data.respondents === 0 && <p className="mb-3 rounded-lg bg-accent/15 p-2.5 text-xs">لا توجد ردود ميدانية بعد. الترتيب الحالي مبني على أدلة الدراسة المكتبية فقط.</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>{["#", "الورشة", "المجال", "الخلية", "الدرجة", "مؤشر الأسئلة المرتبطة", "أولوية الموضوع (مستنتجة)", "طلبات التفاصيل", "الأدلة", "التوريد", "التحول", "المستوى"].map((h) => <th key={h} className="px-2 py-2 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {q.data.items.map((m) => (
                  <tr key={m.workshop.id} data-testid={`row-match-${m.workshop.id}`}>
                    <td className="px-2 py-2.5 font-display font-semibold tabular-nums">{m.rank}</td>
                    <td className="px-2 py-2.5"><p className="font-medium">{m.workshop.titleAr}</p><p dir="ltr" className="text-end text-xs text-muted-foreground">{m.workshop.titleEn}</p></td>
                    <td className="px-2 py-2.5 text-xs">{m.workshop.categoryLabel}</td>
                    <td className="px-2 py-2.5"><span className={cn("whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold", CELL[m.gridCell]?.cls)}>{CELL[m.gridCell]?.label}</span></td>
                    <td className="px-2 py-2.5 font-semibold tabular-nums">{fmt(m.compositeScore)}</td>
                    <td className="px-2 py-2.5 tabular-nums">{fmt(m.fieldNeed, 0)} <span className="text-xs text-muted-foreground">n={m.fieldN}</span></td>
                    <td className="px-2 py-2.5 tabular-nums">{fmt(m.topicPriorityShare, 0)}% <span className="text-xs text-muted-foreground">{m.topicSelected}/{m.topicRespondents}</span></td>
                    <td className="px-2 py-2.5 tabular-nums">{m.enquiryCount > 0 ? m.enquiryCount : <span className="text-xs text-muted-foreground">لا طلبات</span>}</td>
                    <td className="px-2 py-2.5 tabular-nums">{fmt(m.workshop.evidenceScore, 0)}</td>
                    <td className="px-2 py-2.5"><span className="rounded border border-border px-1.5 py-0.5 text-xs font-medium">{m.supplyAction}</span></td>
                    <td className={cn("px-2 py-2.5 tabular-nums text-xs font-semibold", m.rankShift > 0 ? "text-[hsl(var(--teal))]" : m.rankShift < 0 ? "text-destructive" : "text-muted-foreground")}>
                      {m.rankShift > 0 ? `▲ ${m.rankShift}` : m.rankShift < 0 ? `▼ ${Math.abs(m.rankShift)}` : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-xs">{m.workshop.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------- responses ---------- */
function Responses() {
  const [f, setF] = useState<ListAdminResponsesParams>({ page: 1, pageSize: 20 });
  const [open, setOpen] = useState<SurveyResponse | null>(null);
  const q = useListAdminResponses(f, { query: { queryKey: getListAdminResponsesQueryKey(f), placeholderData: (p) => p } });
  const upd = (p: Partial<ListAdminResponsesParams>) => setF({ ...f, ...p, page: p.page ?? 1 });
  const sel = "h-10 rounded-lg border border-input bg-card px-3 text-sm";
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={f.path ?? ""} onChange={(e) => upd({ path: (e.target.value || undefined) as SurveyPath | undefined })} data-testid="filter-resp-path">
          <option value="">كل المسارات</option><option value="B2B">B2B</option><option value="B2C">B2C</option>
        </select>
        <select className={sel} value={f.status ?? ""} onChange={(e) => upd({ status: (e.target.value || undefined) as ListAdminResponsesParams["status"] })} data-testid="filter-resp-status">
          <option value="">كل الحالات</option><option value="complete">مكتملة</option><option value="draft">مسودة</option>
        </select>
        <select className={sel} value={f.sector ?? ""} onChange={(e) => upd({ sector: e.target.value || undefined })} data-testid="filter-resp-sector">
          <option value="">كل القطاعات</option>{Q.Q5.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select className={sel} value={f.nationality ?? ""} onChange={(e) => upd({ nationality: e.target.value || undefined })} data-testid="filter-resp-nationality">
          <option value="">كل الجنسيات</option>{Q.Q1.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm">
          <input type="checkbox" checked={!!f.hasContact} onChange={(e) => upd({ hasContact: e.target.checked || undefined })} data-testid="filter-resp-contact" /> لديه بيانات تواصل
        </label>
      </div>
      {q.isLoading ? <Skel /> : q.isError || !q.data ? <Err onRetry={() => q.refetch()} /> : !q.data.items.length ? (
        <Empty title="لا توجد ردود مطابقة" text="غيّر عوامل التصفية، أو انتظر وصول الردود الأولى من الميدان." />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>{["التاريخ", "الحالة", "المسار", "القطاع", "الجنسية", "المدة", "التواصل", ""].map((h) => <th key={h} className="px-2 py-2 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {q.data.items.map((r) => {
                  const a = r.answers as Record<string, unknown>;
                  const sector = (a.Q5 as { sector?: string } | undefined)?.sector;
                  return (
                    <tr key={r.id} className="hover:bg-muted/40" data-testid={`row-response-${r.id}`}>
                      <td className="px-2 py-2.5 tabular-nums text-xs">{new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="px-2 py-2.5"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", r.status === "complete" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>{r.status === "complete" ? "مكتملة" : "مسودة"}</span></td>
                      <td className="px-2 py-2.5 font-medium">{r.path ?? "—"}</td>
                      <td className="px-2 py-2.5 text-xs">{sector ? optionLabel("Q5", sector) : "—"}</td>
                      <td className="px-2 py-2.5 text-xs">{a.Q1 ? optionLabel("Q1", String(a.Q1)) : "—"}</td>
                      <td className="px-2 py-2.5 tabular-nums text-xs">{r.durationSec ? `${fmt(r.durationSec / 60)} د` : "—"}</td>
                      <td className="px-2 py-2.5 text-xs">{r.contact?.name || r.contact?.email || r.contact?.phone ? <span dir="auto">{r.contact?.name ?? r.contact?.email ?? r.contact?.phone}</span> : "—"}</td>
                      <td className="px-2 py-2.5"><button onClick={() => setOpen(r)} className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:border-primary" data-testid={`button-open-${r.id}`}>عرض</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground tabular-nums">{q.data.total} رد · صفحة {q.data.page} من {pages}</span>
            <div className="flex gap-1">
              <button disabled={(f.page ?? 1) <= 1} onClick={() => setF({ ...f, page: (f.page ?? 1) - 1 })} className="rounded-lg border border-border p-2 disabled:opacity-40" data-testid="button-prev-page"><ChevronRight className="h-4 w-4" /></button>
              <button disabled={(f.page ?? 1) >= pages} onClick={() => setF({ ...f, page: (f.page ?? 1) + 1 })} className="rounded-lg border border-border p-2 disabled:opacity-40" data-testid="button-next-page"><ChevronLeft className="h-4 w-4" /></button>
            </div>
          </div>
        </Panel>
      )}
      {open && <ResponseDrawer r={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function renderAnswer(qid: string, v: unknown): ReactNode {
  if (v === undefined || v === null) return "—";
  if (qid === "Q5") {
    const x = v as { sector?: string; sub?: string; other?: string };
    return [x.sector && optionLabel("Q5", x.sector), x.sub && (SUB_LABELS[x.sector ?? ""]?.[x.sub] ?? x.sub), x.other].filter(Boolean).join(" · ");
  }
  if (qid === "Q14" || qid === "Q18") {
    const m = v as Record<string, { importance?: number; performance?: number }>;
    return (
      <div className="grid gap-1">
        {SKILLS.map((s) => <div key={s.id} className="flex justify-between gap-3 text-xs"><span>{s.label}</span><span className="shrink-0 tabular-nums">أهمية {m[s.id]?.importance ?? "–"} · أداء {m[s.id]?.performance ?? "–"}</span></div>)}
      </div>
    );
  }
  if (qid === "Q24") return <ol className="list-inside list-decimal text-xs">{(v as string[]).map((t) => <li key={t}>{TRACK_LABELS[t] ?? t}</li>)}</ol>;
  if (qid === "Q25T") {
    const t = new Map(TRAINING_TOPICS.map((x) => [x.id, x.label]));
    return <ul className="list-inside list-disc text-xs">{(v as string[]).map((x) => <li key={x}>{t.get(x) ?? x}</li>)}</ul>;
  }
  if (qid === "Q25I" || qid === "Q25Shown") {
    const ids = v as string[];
    if (!ids.length) return <span className="text-xs text-muted-foreground">{qid === "Q25I" ? "لم يطلب تفاصيل أي دورة (لا يعني عدم الاهتمام)" : "—"}</span>;
    return <ul className="list-inside list-disc text-xs">{ids.map((x) => <li key={x}>{COURSE_LABELS[x] ?? x}</li>)}</ul>;
  }
  if (qid === "Q25") {
    const m = v as Record<string, number>;
    return (
      <div className="grid gap-1">
        {Object.entries(m).map(([c, l]) => (
          <div key={c} className="flex justify-between gap-3 text-xs"><span>{COURSE_LABELS[c] ?? c}</span>
            <span className={cn("shrink-0 rounded px-1.5", l === 2 ? "bg-accent/25 font-semibold" : l === 1 ? "bg-secondary" : "text-muted-foreground")}>{LEVEL_LABELS[l] ?? l}</span></div>
        ))}
      </div>
    );
  }
  if (Array.isArray(v)) return (v as string[]).map((x) => optionLabel(qid, x)).join("، ");
  return optionLabel(qid, String(v));
}

function ResponseDrawer({ r, onClose }: { r: SurveyResponse; onClose: () => void }) {
  const order = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q14", "Q15", "Q18", "Q19", "Q20", "Q21", "Q22", "Q23", "Q24", "Q25G", "Q25T", "Q25I", "Q25Shown", "Q25", "Q26"];
  const a = r.answers as Record<string, unknown>;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", damping: 26, stiffness: 240 }}
        onClick={(e) => e.stopPropagation()} className="absolute inset-y-0 start-0 w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl" data-testid="drawer-response">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground" dir="ltr">{r.id}</p>
            <h2 className="mt-1 text-xl font-bold text-primary">رد {r.path ?? ""} · {r.status === "complete" ? "مكتمل" : "مسودة"}</h2>
            <p className="text-xs text-muted-foreground">{r.device ?? "—"} · {r.sourceTag ? `src=${r.sourceTag}` : "بدون مصدر"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted" data-testid="button-close-drawer"><X className="h-5 w-5" /></button>
        </div>
        {(r.contact?.name || r.contact?.email || r.contact?.phone) && (
          <div className="mt-4 rounded-xl ink-panel p-4 text-sm">
            <p className="font-semibold text-accent">بيانات التواصل</p>
            <p className="mt-1">{r.contact?.name}</p>
            <p dir="ltr" className="text-end">{r.contact?.email}</p>
            <p dir="ltr" className="text-end">{r.contact?.phone}</p>
          </div>
        )}
        <dl className="mt-5 divide-y divide-border">
          {order.filter((k) => a[k] !== undefined).map((k) => (
            <div key={k} className="py-3">
              <dt className="text-xs font-semibold text-muted-foreground">{k} · {QUESTION_LABELS[k] ?? (k === "Q25Shown" ? "الدورات المقترحة التي عُرضت" : k)}</dt>
              <dd className="mt-1 text-sm">{renderAnswer(k, a[k])}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </div>
  );
}

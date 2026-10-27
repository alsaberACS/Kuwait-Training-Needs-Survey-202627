import { useState } from "react";
import { motion } from "framer-motion";
import {
  KeyRound, Loader2, LogOut, LayoutDashboard, Activity, GraduationCap, ListOrdered, SlidersHorizontal, Target, Table2, Download, Menu, Layers, Sparkles, Route, Presentation, MessagesSquare,
} from "lucide-react";
import { setAuthTokenGetter, useVerifyAdminKey, useExportResponsesCsv, getExportResponsesCsvQueryKey, type SurveyPath } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { SURVEY_TITLE } from "@/lib/survey-definition";
import { CHAPTERS } from "@/lib/study-context";
import { Overview } from "@/components/admin/overview";
import { Infographics } from "@/components/admin/infographics";
import { SkillsGap } from "@/components/admin/skills";
import { Courses } from "@/components/admin/courses";
import { Tracks } from "@/components/admin/tracks";
import { Prefs } from "@/components/admin/prefs";
import { Segments } from "@/components/admin/segments";
import { Matching } from "@/components/admin/matching";
import { Responses } from "@/components/admin/responses";
import { TrainingPathways } from "@/components/admin/training-pathways";
import { CourseInsight } from "@/components/admin/course-insight";
import { FocusGroupAnalysisView } from "@/components/admin/focus-groups";

setAuthTokenGetter(() => sessionStorage.getItem("adminKey"));

type Tab = "overview" | "infographics" | "pathways" | "course-insight" | "focus-groups" | "skills" | "courses" | "tracks" | "prefs" | "segments" | "matching" | "responses";
const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "infographics", label: "إنفوجرافيك", icon: Sparkles },
  { id: "pathways", label: "لوحة المسارات التدريبية", icon: Route },
  { id: "course-insight", label: "الوضع للدورة", icon: Presentation },
  { id: "focus-groups", label: "التحليل النوعي", icon: MessagesSquare },
  { id: "skills", label: "فجوة المهارات", icon: Activity },
  { id: "courses", label: "الطلب على الدورات", icon: GraduationCap },
  { id: "tracks", label: "المسارات المستقبلية", icon: ListOrdered },
  { id: "prefs", label: "التفضيلات", icon: SlidersHorizontal },
  { id: "segments", label: "الشرائح", icon: Layers },
  { id: "matching", label: "المطابقة", icon: Target },
  { id: "responses", label: "الردود", icon: Table2 },
];

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
  const showPath = ["overview", "infographics", "pathways", "course-insight", "courses", "tracks", "prefs"].includes(tab);
  const chapter = CHAPTERS[tab];
  return (
    <div className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={cn("fixed inset-y-0 start-0 z-50 flex w-[250px] flex-col bg-sidebar lg:sticky lg:top-0 lg:h-[100dvh] text-sidebar-foreground transition-transform lg:translate-x-0",
        navOpen ? "translate-x-0" : "translate-x-full")}>
        <div className="h-2 sadu opacity-70" />
        <div className="shrink-0 p-5">
          <p className="font-display text-xs font-semibold tracking-wider text-sidebar-primary">ASDC · KCCI</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">دراسة الاحتياجات التدريبية 2026/2027</p>
        </div>
        <nav className="grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto px-3 pb-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setNavOpen(false); }} data-testid={`tab-${t.id}`}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                tab === t.id ? "bg-sidebar-accent font-semibold text-white" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60")}>
              <span className={cn("font-display w-5 shrink-0 text-center text-[11px] tabular-nums", tab === t.id ? "text-sidebar-primary" : "text-sidebar-foreground/40")}>{CHAPTERS[t.id].number}</span>
              <t.icon className={cn("h-4 w-4 shrink-0", tab === t.id && "text-sidebar-primary")} />{t.label}
            </button>
          ))}
        </nav>
        <div className="grid shrink-0 gap-1 border-t border-sidebar-border px-3 pb-4 pt-3">
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
        <header className="mb-6 flex flex-wrap items-start gap-3">
          <button className="rounded-lg border border-border p-2 lg:hidden" onClick={() => setNavOpen(true)} data-testid="button-menu"><Menu className="h-5 w-5" /></button>
          <div className="min-w-[240px] flex-1">
            <p className="font-display text-[11px] font-semibold tracking-[.18em] text-accent" data-testid="chapter-eyebrow">الفصل {chapter.number} · {TABS.find((t) => t.id === tab)?.label}</p>
            <h1 className="mt-0.5 text-2xl font-bold leading-snug text-primary" data-testid="chapter-title">{chapter.question}</h1>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{chapter.method}</p>
          </div>
          {showPath && (
            <div className="flex rounded-xl border border-border bg-card p-1 text-sm" data-testid="filter-path">
              {[{ v: undefined, l: "الكل" }, { v: "B2B" as const, l: "B2B" }, { v: "B2C" as const, l: "B2C" }].map((o) => (
                <button key={o.l} onClick={() => setPath(o.v)} className={cn("rounded-lg px-4 py-1.5 font-medium", path === o.v ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>{o.l}</button>
              ))}
            </div>
          )}
        </header>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {tab === "overview" && <Overview path={path} />}
          {tab === "infographics" && <Infographics path={path} />}
          {tab === "pathways" && <TrainingPathways path={path} />}
          {tab === "course-insight" && <CourseInsight path={path} />}
          {tab === "focus-groups" && <FocusGroupAnalysisView />}
          {tab === "skills" && <SkillsGap />}
          {tab === "courses" && <Courses path={path} />}
          {tab === "tracks" && <Tracks path={path} />}
          {tab === "prefs" && <Prefs path={path} />}
          {tab === "segments" && <Segments />}
          {tab === "matching" && <Matching />}
          {tab === "responses" && <Responses />}
        </motion.div>
      </main>
    </div>
  );
}

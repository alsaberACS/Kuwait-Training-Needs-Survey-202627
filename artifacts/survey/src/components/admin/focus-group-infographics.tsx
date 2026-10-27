import { useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { BookOpen, Pause, Play, Printer } from "lucide-react";
import { useGetFocusGroupAnalysis, getGetFocusGroupAnalysisQueryKey, type FocusGroupAnalysis } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Err, Empty } from "@/components/admin/shared";
import { EvidenceDialog, EvidenceProvider, type EvidenceRequest } from "@/components/admin/focus-groups-evidence";
import { HubPoster } from "./focus-infographics/hub-poster";
import { BreadthPoster } from "./focus-infographics/breadth-poster";
import { DesignPoster } from "./focus-infographics/design-poster";
import { ActionsPoster } from "./focus-infographics/actions-poster";
import { MixedMethodsPosters } from "./focus-infographics/mixed-methods-posters";
import "./focus-infographics/fi.css";

export function FocusGroupInfographics({ onOpenAnalysis }: { onOpenAnalysis: () => void }) {
  const q = useGetFocusGroupAnalysis({ query: { queryKey: getGetFocusGroupAnalysisQueryKey(), staleTime: 300000, refetchOnWindowFocus: false } });
  if (q.isLoading) return (
    <div className="grid gap-4" data-testid="view-focus-infographics" aria-busy="true">
      <div className="h-96 animate-pulse rounded-[1.75rem] bg-[hsl(206_40%_80%)]" />
      <div className="h-72 animate-pulse rounded-[1.75rem] bg-muted" />
    </div>
  );
  if (q.isError) return <div data-testid="view-focus-infographics"><Err onRetry={() => q.refetch()} /></div>;
  if (!q.data || !q.data.themes.length) return <div data-testid="view-focus-infographics"><Empty title="لا يوجد تحليل نوعي بعد" text="ستظهر الإنفوجرافيك هنا عند توفّر تحليل المجموعات البؤرية." /></div>;
  return <Board data={q.data} onOpenAnalysis={onOpenAnalysis} />;
}

function Board({ data, onOpenAnalysis }: { data: FocusGroupAnalysis; onOpenAnalysis: () => void }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [req, setReq] = useState<EvidenceRequest | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const evidence = useMemo(() => new Map(data.evidence.map((e) => [e.id, e])), [data.evidence]);
  const groups = useMemo(() => new Map(data.groups.map((g) => [g.id, g])), [data.groups]);
  const ctx = useMemo(() => ({ open: (r: EvidenceRequest) => { trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setReq(r); } }), []);
  const btn = "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <EvidenceProvider value={ctx}>
      <div dir="rtl" data-testid="view-focus-infographics" className={cn("grid min-w-0 gap-6", paused && "fi-paused")}>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <p className="me-auto text-xs text-muted-foreground">موجز بصري لـ{data.title} · <bdi dir="ltr">{data.analysisDate}</bdi></p>
          <button type="button" className={cn(btn, "disabled:cursor-default disabled:opacity-60")} onClick={() => setPaused((p) => !p)} disabled={!!reduce} aria-pressed={paused || !!reduce} data-testid="button-fi-motion">
            {paused && !reduce ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{reduce ? "الحركة مخففة حسب إعدادات الجهاز" : paused ? "استئناف الحركة" : "إيقاف الحركة"}
          </button>
          <button type="button" className={btn} onClick={() => window.print()} data-testid="button-fi-print"><Printer className="h-3.5 w-3.5" />طباعة</button>
          <button type="button" onClick={onOpenAnalysis} data-testid="button-fi-open-analysis"
            className={cn(btn, "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}><BookOpen className="h-3.5 w-3.5" />التقرير النوعي المفصّل</button>
        </div>
        <nav aria-label="أقسام الإنفوجرافيك" className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 print:hidden">
          <span className="me-auto text-sm font-semibold">قراءة متكاملة: النوعي × الكمي × مستويات التدريب</span>
          <a href="#fi-agreement" className={btn} data-testid="link-fi-agreement">تقاطع المجالات الستة</a>
          <a href="#fi-levels" className={btn} data-testid="link-fi-levels">مصفوفة المستويات</a>
          <a href="#fi-blindspots" className={btn}>حدود المقارنة والمنهجية</a>
        </nav>
        <HubPoster data={data} />
        <BreadthPoster data={data} />
        <DesignPoster data={data} />
        <ActionsPoster data={data} />
        <MixedMethodsPosters groups={data.groups} />
        <p className="text-[11px] leading-relaxed text-muted-foreground">{data.methodology.scopeNote} {data.methodology.evidenceRule} الملصقات المدمجة تقرأ أرقام الاستبانة بجانب الدليل النوعي دون دمجهما رياضياً.</p>
      </div>
      <EvidenceDialog request={req} onClose={() => setReq(null)} restoreFocus={() => trigger.current?.focus()} evidence={evidence} groups={groups} />
    </EvidenceProvider>
  );
}

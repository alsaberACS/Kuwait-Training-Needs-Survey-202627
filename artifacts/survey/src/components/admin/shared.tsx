import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Inbox, Info, RefreshCw, Users } from "lucide-react";
import type { CountItem } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: d }) : "–");
export const AX = { fontSize: 11, fontFamily: "IBM Plex Sans Arabic", fill: "hsl(208 15% 40%)" };
export const TOOLTIP_STYLE = { fontFamily: "IBM Plex Sans Arabic", direction: "rtl" as const, borderRadius: 12, fontSize: 12, border: "1px solid hsl(36 22% 86%)" };
export const GRID = "hsl(36 22% 88%)";

/** Brand palette as CSS colour strings (navy, gold, teal, terracotta, slate). */
export const C = {
  navy: "hsl(var(--chart-1))",
  gold: "hsl(var(--chart-2))",
  teal: "hsl(var(--chart-3))",
  clay: "hsl(var(--chart-4))",
  slate: "hsl(var(--chart-5))",
  muted: "hsl(38 25% 86%)",
};
export const SERIES = [C.navy, C.gold, C.teal, C.clay, C.slate, "hsl(206 40% 45%)", "hsl(38 55% 70%)"];

export function Reveal({ i = 0, children, className }: { i?: number; children: ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.06, duration: 0.35, ease: "easeOut" }} className={cn("min-w-0", className)}>
      {children}
    </motion.div>
  );
}

export function Panel({ title, sub, note, action, children, className, testId }: {
  title?: string; sub?: string; note?: string; action?: ReactNode; children: ReactNode; className?: string; testId?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-2xl border border-card-border bg-card p-5", className)} data-testid={testId}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-semibold leading-snug">{title}</h2>}
            {sub && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("min-w-0 flex-1", title || action ? "mt-4" : "")}>{children}</div>
      {note && (
        <p className="mt-4 flex gap-1.5 border-t border-dashed border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span>{note}</span>
        </p>
      )}
    </section>
  );
}

export function Skel({ rows = 4 }: { rows?: number }) {
  return <div className="grid gap-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>;
}

export function Err({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="mt-3 font-medium">تعذّر تحميل البيانات</p>
      <button onClick={onRetry} className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" data-testid="button-retry"><RefreshCw className="h-4 w-4" /> إعادة المحاولة</button>
    </div>
  );
}

export function Empty({ title = "لا توجد ردود مكتملة بعد", text = "ستظهر النتائج هنا تلقائياً فور وصول أول ردود من الميدان. شارك رابط الاستبانة لبدء جمع البيانات." }: { title?: string; text?: string }) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-dashed border-border bg-card p-12 text-center" data-testid="empty-state">
      <div className="absolute inset-x-0 top-0 h-1.5 sadu opacity-40" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><Inbox className="h-7 w-7" /></div>
      <p className="mt-4 text-lg font-semibold text-primary">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

export function HBars({ items, color = "bg-primary", max: maxOverride }: { items: CountItem[]; color?: string; max?: number }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">لا بيانات</p>;
  const max = maxOverride ?? Math.max(...items.map((i) => i.count), 1);
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

export function Kpi({ label, value, icon: Icon, accent, hint }: { label: string; value: string; icon: typeof Users; accent?: boolean; hint?: string }) {
  return (
    <div className={cn("rounded-2xl border p-4", accent ? "ink-panel border-transparent" : "border-card-border bg-card")}>
      <div className="flex items-center justify-between"><span className={cn("text-xs", accent ? "text-white/70" : "text-muted-foreground")}>{label}</span><Icon className={cn("h-4 w-4", accent ? "text-accent" : "text-muted-foreground")} /></div>
      <p className={cn("font-display mt-2 whitespace-nowrap font-semibold tabular-nums", value.length > 6 ? "text-2xl" : "text-3xl")} data-testid={`kpi-${label}`}>{value}</p>
      {hint && <p className={cn("mt-1 text-[11px]", accent ? "text-white/60" : "text-muted-foreground")}>{hint}</p>}
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange, testId }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" data-testid={testId}>
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} data-testid={testId ? `${testId}-${o.id}` : undefined}
          className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", value === o.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "gold" | "teal" | "navy" | "clay"; className?: string }) {
  const cls = {
    muted: "bg-muted text-muted-foreground",
    gold: "bg-accent/20 text-[hsl(32_70%_28%)]",
    teal: "bg-secondary text-secondary-foreground",
    navy: "bg-primary text-primary-foreground",
    clay: "bg-[hsl(14_60%_52%/.15)] text-[hsl(14_60%_35%)]",
  }[tone];
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", cls, className)}>{children}</span>;
}

/** Small-n warning used wherever a segment is too thin to read as more than indicative. */
export function LowN({ n, min }: { n: number; min: number }) {
  if (n >= min) return null;
  return <Pill tone="clay">n={n} · للاستئناس</Pill>;
}

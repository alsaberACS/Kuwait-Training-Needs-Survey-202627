import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea, LabelList, ZAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { fmt, AX, GRID, TOOLTIP_STYLE, C, LowN } from "./shared";

/* ---------- donut ---------- */
export type Slice = { key: string; label: string; value: number; color: string };

export function Donut({ data, center, centerLabel, height = 200, testId }: { data: Slice[]; center?: string; centerLabel?: string; height?: number; testId?: string }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const shown = data.filter((d) => d.value > 0);
  if (!total) return <p className="text-sm text-muted-foreground">لا بيانات</p>;
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" data-testid={testId}>
      <div className="relative mx-auto w-full max-w-[200px]" style={{ height }} dir="ltr">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={shown} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="92%" paddingAngle={shown.length > 1 ? 2 : 0} stroke="none" startAngle={90} endAngle={-270}>
              {shown.map((d) => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v} · ${fmt((v / total) * 100, 0)}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
          <span className="font-display text-2xl font-semibold tabular-nums leading-none">{center ?? fmt(total, 0)}</span>
          {centerLabel && <span className="mt-1 text-[11px] text-muted-foreground">{centerLabel}</span>}
        </div>
      </div>
      <ul className="grid gap-2 text-[13px]">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden" title={d.label}>{d.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground"><b className="text-foreground">{d.value}</b> · {fmt((d.value / total) * 100, 0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- heatmap ---------- */
export type HeatPalette = "gap" | "need" | "score";

/** Cell colour. Gaps diverge around zero (teal below, clay above) scaled by |max|; need/score scale between the observed min and max so small differences stay visible. */
function heatColor(v: number, scale: { min: number; max: number }, palette: HeatPalette): { bg: string; fg: string } {
  const t = palette === "gap"
    ? (scale.max > 0 ? Math.min(1, Math.abs(v) / scale.max) : 0)
    : (scale.max > scale.min ? (v - scale.min) / (scale.max - scale.min) : 0.5);
  const alpha = palette === "gap" && v === 0 ? 0.05 : 0.1 + 0.85 * t;
  const hue = palette === "gap" ? (v < 0 ? "178 45% 32%" : "14 60% 48%") : palette === "need" ? "206 62% 22%" : "178 45% 32%";
  return { bg: `hsl(${hue} / ${alpha.toFixed(2)})`, fg: alpha > 0.55 ? "white" : "hsl(206 62% 14%)" };
}

export function Heatmap({ rows, cols, value, palette, domainMax, format = (v) => fmt(v, palette === "gap" ? 2 : 0), lowN = 5, rowHeader = "", testId }: {
  rows: { id: string; label: string }[];
  cols: { id: string; label: string; n: number }[];
  value: (rowId: string, colId: string) => number | undefined;
  palette: HeatPalette;
  domainMax?: number;
  format?: (v: number) => string;
  lowN?: number;
  rowHeader?: string;
  testId?: string;
}) {
  const vals = rows.flatMap((r) => cols.map((c) => value(r.id, c.id))).filter((v): v is number => typeof v === "number");
  const scale = palette === "gap"
    ? { min: 0, max: domainMax ?? Math.max(...vals.map((v) => Math.abs(v)), 0.01) }
    : { min: vals.length ? Math.min(...vals) : 0, max: domainMax ?? (vals.length ? Math.max(...vals) : 1) };
  if (!cols.length) return <p className="text-sm text-muted-foreground">لا توجد شرائح تحتوي ردوداً بعد</p>;
  return (
    <div className="overflow-x-auto" data-testid={testId}>
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="min-w-[180px] py-1 text-start font-medium text-muted-foreground">{rowHeader}</th>
            {cols.map((c) => (
              <th key={c.id} className={cn("min-w-[88px] px-1 py-1 text-center font-medium leading-snug", c.n < lowN ? "text-muted-foreground" : "")}>
                <span className="block">{c.label}</span>
                <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-muted-foreground">n={c.n}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="py-0.5 pe-2 leading-snug"><span className="me-1 text-[10px] text-muted-foreground">{r.id}</span>{r.label}</td>
              {cols.map((c) => {
                const v = value(r.id, c.id);
                if (typeof v !== "number") return <td key={c.id} className="rounded-md bg-muted/40 text-center text-muted-foreground">—</td>;
                const { bg, fg } = heatColor(v, scale, palette);
                return (
                  <td key={c.id} title={`${r.label} · ${c.label}: ${format(v)}`} className={cn("rounded-md text-center font-semibold tabular-nums", c.n < lowN && "opacity-60")}
                    style={{ background: bg, color: fg, height: 34 }}>
                    <span dir="ltr">{format(v)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- quadrant scatter ---------- */
export type QPoint = { id: string; label: string; x: number; y: number; color?: string; z?: number; meta?: string };

export function QuadrantScatter({ points, xLabel, yLabel, xRef, yRef, quadrants, xDomain = [0, 100], yDomain = [0, 100], autoDomain = false, height = 320, showIds = true, testId }: {
  points: QPoint[];
  xLabel: string; yLabel: string;
  xRef: number; yRef: number;
  quadrants: { tl: string; tr: string; bl: string; br: string };
  xDomain?: [number, number]; yDomain?: [number, number];
  /** Tighten both axes around the data instead of using the full scale. */
  autoDomain?: boolean;
  height?: number; showIds?: boolean; testId?: string;
}) {
  // "auto" tightens the axis around the data (plus the reference line) so clustered points spread out
  const fit = (vals: number[], ref: number, d: [number, number], auto: boolean): [number, number] => {
    if (!auto || !vals.length) return d;
    const lo = Math.min(...vals, ref), hi = Math.max(...vals, ref);
    const pad = Math.max((hi - lo) * 0.15, 0.2);
    return [Math.max(d[0], Math.floor((lo - pad) * 4) / 4), Math.min(d[1], Math.ceil((hi + pad) * 4) / 4)];
  };
  const xd = fit(points.map((p) => p.x), xRef, xDomain, autoDomain);
  const yd = fit(points.map((p) => p.y), yRef, yDomain, autoDomain);
  const [x0, x1] = xd, [y0, y1] = yd;
  const areaCls = { fontFamily: "IBM Plex Sans Arabic", fontSize: 11, fill: "hsl(208 15% 45%)" };
  return (
    <div style={{ height }} dir="ltr" data-testid={testId}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 18, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis type="number" dataKey="x" domain={xd} allowDataOverflow tick={AX} name={xLabel} label={{ value: xLabel, position: "insideBottom", offset: -12, ...areaCls }} />
          <YAxis type="number" dataKey="y" domain={yd} allowDataOverflow tick={AX} name={yLabel} label={{ value: yLabel, angle: -90, position: "insideLeft", ...areaCls }} />
          <ZAxis type="number" dataKey="z" range={[60, 260]} />
          <ReferenceArea x1={x0} x2={xRef} y1={yRef} y2={y1} fill="hsl(14 60% 52% / .06)" label={{ value: quadrants.tl, position: "insideTopLeft", ...areaCls }} />
          <ReferenceArea x1={xRef} x2={x1} y1={yRef} y2={y1} fill="hsl(206 62% 22% / .05)" label={{ value: quadrants.tr, position: "insideTopRight", ...areaCls }} />
          <ReferenceArea x1={x0} x2={xRef} y1={y0} y2={yRef} fill="transparent" label={{ value: quadrants.bl, position: "insideBottomLeft", ...areaCls }} />
          <ReferenceArea x1={xRef} x2={x1} y1={y0} y2={yRef} fill="hsl(178 45% 32% / .05)" label={{ value: quadrants.br, position: "insideBottomRight", ...areaCls }} />
          <ReferenceLine x={xRef} stroke="hsl(38 72% 45%)" strokeDasharray="4 3" />
          <ReferenceLine y={yRef} stroke="hsl(38 72% 45%)" strokeDasharray="4 3" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
            const p = payload?.[0]?.payload as QPoint | undefined;
            if (!p) return null;
            return (
              <div dir="rtl" className="max-w-[260px] rounded-xl border border-border bg-card p-2.5 text-xs shadow-lg">
                <p className="font-semibold leading-snug"><span className="me-1 text-muted-foreground">{p.id}</span>{p.label}</p>
                <p className="mt-1 tabular-nums text-muted-foreground">{xLabel}: <b className="text-foreground">{fmt(p.x, 2)}</b> · {yLabel}: <b className="text-foreground">{fmt(p.y, 2)}</b></p>
                {p.meta && <p className="mt-0.5 text-muted-foreground">{p.meta}</p>}
              </div>
            );
          }} />
          <Scatter data={points} isAnimationActive={false}>
            {points.map((p) => <Cell key={p.id} fill={p.color ?? C.navy} fillOpacity={0.85} stroke="white" strokeWidth={1} />)}
            {showIds && <LabelList dataKey="id" position="top" offset={7} style={{ fontSize: 11, fontWeight: 600, fontFamily: "IBM Plex Sans Arabic", fill: "hsl(206 62% 20%)", paintOrder: "stroke", stroke: "white", strokeWidth: 3 }} />}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- 100% stacked bar (CSS) ---------- */
export type Part = { key: string; label: string; value: number; color: string };

export function StackedBar({ parts, height = 10, className }: { parts: Part[]; height?: number; className?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <div className={cn("flex w-full overflow-hidden rounded-full bg-muted", className)} style={{ height }}>
      {total > 0 && parts.map((p) => (
        <motion.div key={p.key} initial={{ width: 0 }} animate={{ width: `${(p.value / total) * 100}%` }} title={`${p.label}: ${p.value} (${fmt((p.value / total) * 100, 0)}%)`}
          style={{ background: p.color }} className="h-full" />
      ))}
    </div>
  );
}

export function Legend({ items, className }: { items: { label: string; color: string }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground", className)}>
      {items.map((i) => <span key={i.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />{i.label}</span>)}
    </div>
  );
}

/* ---------- funnel ---------- */
export function Funnel({ steps }: { steps: { label: string; value: number; color: string; hint?: string }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="grid gap-2.5">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : s.value;
        const conv = prev ? (s.value / prev) * 100 : 0;
        return (
          <div key={s.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="mb-1 flex justify-between text-[13px]"><span>{s.label}</span><span className="tabular-nums text-muted-foreground"><b className="text-foreground">{s.value}</b>{i > 0 && ` · ${fmt(conv, 0)}% من السابق`}</span></div>
              <div className="h-3 rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${(s.value / max) * 100}%` }} className="h-3 rounded-full" style={{ background: s.color }} /></div>
              {s.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- range (min–max across segments) ---------- */
export function RangeBars({ rows, domain, format = (v) => fmt(v, 2), lowN = 5 }: {
  rows: { id: string; label: string; min: { v: number; label: string; n: number }; max: { v: number; label: string; n: number } }[];
  domain: [number, number];
  format?: (v: number) => string;
  lowN?: number;
}) {
  const [d0, d1] = domain;
  const pos = (v: number) => ((v - d0) / (d1 - d0 || 1)) * 100;
  return (
    <div className="grid gap-4">
      {rows.map((r) => (
        <div key={r.id} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="leading-snug"><span className="me-1 text-[10px] text-muted-foreground">{r.id}</span>{r.label}</span>
            <span className="shrink-0 tabular-nums text-xs text-muted-foreground">مدى <b className="text-foreground" dir="ltr">{format(r.max.v - r.min.v)}</b></span>
          </div>
          <div className="relative h-4" dir="ltr">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            {d0 < 0 && d1 > 0 && <div className="absolute top-0.5 bottom-0.5 w-px bg-muted-foreground/40" style={{ left: `${pos(0)}%` }} />}
            <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[hsl(var(--teal))] to-[hsl(var(--chart-4))]" style={{ left: `${pos(r.min.v)}%`, width: `${Math.max(0.5, pos(r.max.v) - pos(r.min.v))}%` }} />
            <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[hsl(var(--teal))] shadow" style={{ left: `${pos(r.min.v)}%` }} />
            <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[hsl(var(--chart-4))] shadow" style={{ left: `${pos(r.max.v)}%` }} />
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-[11px] leading-snug text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(var(--teal))]" />أدنى: {r.min.label} <b className="tabular-nums text-foreground" dir="ltr">{format(r.min.v)}</b>{r.min.n < lowN && <span title="شريحة صغيرة">*</span>}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]" />أعلى: {r.max.label} <b className="tabular-nums text-foreground" dir="ltr">{format(r.max.v)}</b>{r.max.n < lowN && <span title="شريحة صغيرة">*</span>}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-display mt-1 text-xl font-semibold tabular-nums leading-none">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
      {children}
    </div>
  );
}

export { LowN };

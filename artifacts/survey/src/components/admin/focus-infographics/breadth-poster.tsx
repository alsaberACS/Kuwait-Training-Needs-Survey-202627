import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FocusGroupAnalysis, FocusGroupThemePriority } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Poster, GlassCite, TIER } from "./common";

const ORDER: FocusGroupThemePriority[] = ["shared", "targeted", "specialist"];
const STATUS_MARK = { explicit: "صريح", context: "سياق", not_observed: "غير ملحوظ" } as const;

export function BreadthPoster({ data }: { data: FocusGroupAnalysis }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<FocusGroupThemePriority | null>(null);
  const total = data.themes.length;
  const counts = ORDER.map((p) => ({ p, n: data.themes.filter((t) => t.priority === p).length }));
  const R = 70, Cc = 2 * Math.PI * R;
  let acc = 0;
  const themes = [...data.themes].sort((a, b) => b.coverage - a.coverage);
  return (
    <Poster id="breadth" bg="infographic-backdrop.jpg" kicker="اتساع الاحتياج" title={`${total} عائلة احتياج حسب عدد المجموعات`}
      lead="الحلقة تُظهر تركيب العائلات حسب الاتساع فقط (عدد المجموعات المميّزة التي عبّرت صراحة عن الاحتياج)، لا حجم التأييد أو عدد المشاركين.">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="min-w-0">
          <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[280px]" role="img" aria-label={counts.map((c) => `${TIER[c.p].label}: ${c.n} من ${total}`).join("، ")} data-testid="chart-fi-breadth">
            <circle cx="100" cy="100" r="92" className="fi-line" strokeOpacity=".3" />
            <g transform="rotate(-90 100 100)">
              {counts.map((c, i) => {
                const len = (c.n / Math.max(total, 1)) * Cc; const off = acc; acc += len;
                return (
                  <motion.circle key={c.p} cx="100" cy="100" r={R} fill="none" stroke={TIER[c.p].color} strokeWidth={hover === c.p ? 26 : 20}
                    strokeDasharray={`${Math.max(len - 3, 0)} ${Cc}`} strokeDashoffset={-off} style={{ transition: "stroke-width .25s" }}
                    initial={reduce ? false : { opacity: 0 }} whileInView={{ opacity: hover && hover !== c.p ? 0.35 : 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.25 }}
                    onMouseEnter={() => setHover(c.p)} onMouseLeave={() => setHover(null)} />
                );
              })}
            </g>
            <text x="100" y="98" textAnchor="middle" className="font-display" fontSize="38" fontWeight="700" fill="hsl(40 40% 97%)">{total}</text>
            <text x="100" y="120" textAnchor="middle" fontSize="11" fill="hsl(40 25% 86%)">عائلة مُرمَّزة</text>
          </svg>
          <ul className="mt-4 grid gap-2">
            {counts.map((c) => (
              <li key={c.p} data-testid={`legend-tier-${c.p}`} onMouseEnter={() => setHover(c.p)} onMouseLeave={() => setHover(null)}
                className={cn("fi-glass flex items-center gap-3 rounded-xl px-3 py-2 transition", hover === c.p && "bg-[hsl(40_40%_96%/.16)]")}>
                <span className="h-3 w-3 rounded-full" style={{ background: TIER[c.p].color }} />
                <span className="text-sm font-semibold">{TIER[c.p].label}</span>
                <span className="fi-muted text-xs">{TIER[c.p].sub}</span>
                <span className="ms-auto font-display text-lg font-bold tabular-nums">{c.n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-y-1.5 text-sm" data-testid="matrix-fi-signals">
            <caption className="fi-muted mb-2 text-right text-xs">مؤشر فئوي لكل مجموعة، لا يعبّر عن الشدّة. غياب الدليل لا يعني معارضة.</caption>
            <thead><tr className="fi-muted text-xs">
              <th className="text-right font-medium">العائلة</th>
              {data.groups.map((g) => <th key={g.id} className="px-2 font-medium">{g.label}</th>)}
              <th className="px-2 font-medium">التغطية</th><th />
            </tr></thead>
            <tbody>
              {themes.map((t, i) => (
                <motion.tr key={t.id} data-testid={`row-fi-theme-${t.id}`} className="transition"
                  initial={reduce ? false : { opacity: 0, x: -16 }} whileInView={{ opacity: hover && hover !== t.priority ? 0.4 : 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.04 * i }}>
                  <td className="rounded-s-xl bg-[hsl(40_40%_96%/.07)] px-3 py-2 font-semibold">
                    <span className="me-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: TIER[t.priority].color }} />{t.title}
                  </td>
                  {data.groups.map((g) => {
                    const s = t.signals.find((x) => x.groupId === g.id)?.status ?? "not_observed";
                    return (
                      <td key={g.id} className="bg-[hsl(40_40%_96%/.07)] px-2 text-center" title={STATUS_MARK[s]}>
                        <span className={cn("inline-block h-3.5 w-3.5 rounded-full border", s === "explicit" ? "border-transparent bg-[hsl(38_72%_60%)]" : s === "context" ? "border-[hsl(40_40%_96%/.8)] bg-[hsl(40_40%_96%/.25)]" : "border-dashed border-[hsl(40_40%_96%/.4)]")} />
                        <span className="sr-only">{STATUS_MARK[s]}</span>
                      </td>
                    );
                  })}
                  <td className="bg-[hsl(40_40%_96%/.07)] px-2 text-center font-display font-bold tabular-nums"><bdi dir="ltr">{t.coverage}/{data.groups.length}</bdi></td>
                  <td className="rounded-e-xl bg-[hsl(40_40%_96%/.07)] px-2"><GlassCite ids={t.signals.flatMap((s) => s.evidenceIds)} title={t.title} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <p className="fi-muted mt-2 flex flex-wrap gap-4 text-[11px]">
            <span><span className="me-1 inline-block h-2.5 w-2.5 rounded-full bg-[hsl(38_72%_60%)]" />احتياج صريح (يُحتسب)</span>
            <span><span className="me-1 inline-block h-2.5 w-2.5 rounded-full border bg-[hsl(40_40%_96%/.25)]" />سياق فقط (لا يُحتسب)</span>
            <span><span className="me-1 inline-block h-2.5 w-2.5 rounded-full border border-dashed" />لا دليل واضح</span>
            <span>تساوي التغطية = تعادل في الترتيب.</span>
          </p>
        </div>
      </div>
    </Poster>
  );
}

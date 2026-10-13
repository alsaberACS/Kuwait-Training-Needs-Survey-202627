import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RLegend, Cell, ReferenceLine } from "recharts";
import { useGetSkillsGap, getGetSkillsGapQueryKey, type SkillStats } from "@workspace/api-client-react";
import { SKILL_LABELS } from "@/lib/survey-definition";
import { cn } from "@/lib/utils";
import { fmt, AX, GRID, TOOLTIP_STYLE, C, Panel, Skel, Err, Empty, Pill, Reveal } from "./shared";
import { QuadrantScatter } from "./charts";
import { SegmentHeatmap } from "./segment-heatmap";

function StatCells({ s }: { s: SkillStats }) {
  const gapColor = s.meanGap > 1 ? "bg-destructive/15 text-destructive" : s.meanGap > 0.5 ? "bg-accent/20 text-[hsl(32_70%_30%)]" : "bg-secondary text-secondary-foreground";
  return (
    <>
      <td className="px-2 py-2.5 text-center tabular-nums">{s.n}</td>
      <td className="px-2 py-2.5 text-center tabular-nums">{fmt(s.meanImportance, 2)}</td>
      <td className="px-2 py-2.5 text-center tabular-nums">{fmt(s.meanPerformance, 2)}</td>
      <td className="px-2 py-2.5 text-center"><span dir="ltr" className={cn("inline-block rounded-md px-2 py-0.5 font-semibold tabular-nums", s.n ? gapColor : "")}>{fmt(s.meanGap, 2)}</span></td>
      <td className="px-2 py-2.5 text-center tabular-nums font-medium" dir="ltr">{fmt(s.weightedGap, 2)}</td>
      <td className="px-2 py-2.5 text-center tabular-nums text-xs text-muted-foreground">{s.n ? `${fmt(s.highGapShare, 0)}%` : "–"}</td>
    </>
  );
}

export function SkillsGap() {
  const q = useGetSkillsGap({ query: { queryKey: getGetSkillsGapQueryKey() } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const items = q.data.items;
  if (!items.length || items.every((i) => i.all.n === 0)) return <Empty />;
  const chart = (key: "b2b" | "b2c") => items.map((i) => ({ name: i.skillId, imp: i[key].meanImportance, perf: i[key].meanPerformance }));
  const rated = items.filter((i) => i.all.n > 0);
  const meanImp = rated.reduce((a, i) => a + i.all.meanImportance, 0) / Math.max(rated.length, 1);
  const meanPerf = rated.reduce((a, i) => a + i.all.meanPerformance, 0) / Math.max(rated.length, 1);
  const ranked = [...rated].sort((a, b) => b.all.weightedGap - a.all.weightedGap);
  const maxGap = Math.max(...ranked.map((i) => Math.abs(i.all.weightedGap)), 0.5);
  const both = items.filter((i) => i.b2b.n > 0 && i.b2c.n > 0);
  const diverge = both.map((i) => ({ name: i.skillId, diff: Number((i.b2c.meanPerformance - i.b2b.meanPerformance).toFixed(2)) }));
  const skillRows = items.map((i) => ({ id: i.skillId, label: SKILL_LABELS[i.skillId] ?? i.label }));
  return (
    <div className="grid gap-4">
      <Reveal i={0}>
        <div className="grid gap-4 xl:grid-cols-2">
          {(["b2b", "b2c"] as const).map((k) => (
            <Panel key={k} title={k === "b2b" ? "B2B · تقييم أصحاب العمل لفرقهم" : "B2C · التقييم الذاتي للأفراد"} sub="الأهمية مقابل الأداء (1-5)">
              <div className="h-64" dir="ltr">
                <ResponsiveContainer>
                  <BarChart data={chart(k)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="name" tick={AX} reversed />
                    <YAxis domain={[0, 5]} tick={AX} orientation="right" />
                    <Tooltip labelFormatter={(l) => SKILL_LABELS[String(l)] ?? l} contentStyle={TOOLTIP_STYLE} />
                    <RLegend wrapperStyle={{ fontFamily: "IBM Plex Sans Arabic", fontSize: 12 }} />
                    <Bar dataKey="imp" name="الأهمية" fill={C.navy} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perf" name="الأداء" fill={C.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          ))}
        </div>
      </Reveal>
      <Reveal i={1}>
        <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
          <Panel title="مصفوفة الأهمية – الأداء (IPA)" sub="كل نقطة مهارة؛ الخطوط المتقطعة عند متوسط الأهمية ومتوسط الأداء لكل المشاركين"
            note="الربع الأعلى يساراً (أهمية عالية وأداء منخفض) هو منطقة التدخل التدريبي الأولى؛ الربع الأعلى يميناً يُحافَظ عليه.">
            <QuadrantScatter testId="chart-ipa" xLabel="الأداء الحالي" yLabel="الأهمية" xDomain={[1, 5]} yDomain={[1, 5]} autoDomain xRef={Number(meanPerf.toFixed(2))} yRef={Number(meanImp.toFixed(2))}
              quadrants={{ tl: "ركّز هنا", tr: "حافظ على المستوى", bl: "أولوية منخفضة", br: "جهد زائد محتمل" }}
              points={rated.map((i) => ({ id: i.skillId, label: SKILL_LABELS[i.skillId] ?? i.label, x: i.all.meanPerformance, y: i.all.meanImportance, z: Math.max(i.all.weightedGap, 0) * 100 + 40, meta: `فجوة مرجّحة ${fmt(i.all.weightedGap, 2)} · n=${i.all.n}`,
                color: i.all.meanImportance >= meanImp && i.all.meanPerformance < meanPerf ? C.clay : i.all.meanImportance >= meanImp ? C.navy : C.slate }))} />
          </Panel>
          <Panel title="ترتيب أولويات المهارات" sub="الفجوة المرجّحة بالأهمية (كل المشاركين) · نسبة من أبلغوا عن فجوة حادة (≥ 2 درجة)">
            <div className="grid gap-2.5">
              {ranked.map((i, k) => (
                <div key={i.skillId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3" data-testid={`rank-skill-${i.skillId}`}>
                  <span className={cn("font-display flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold", k < 3 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>{k + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] leading-snug" title={SKILL_LABELS[i.skillId]}><span className="me-1 text-[10px] text-muted-foreground">{i.skillId}</span>{SKILL_LABELS[i.skillId] ?? i.label}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full" style={{ width: `${(Math.max(i.all.weightedGap, 0) / maxGap) * 100}%`, background: k < 3 ? C.clay : C.navy }} /></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-end">
                    <span className="font-display w-11 text-base font-semibold tabular-nums" dir="ltr">{fmt(i.all.weightedGap, 2)}</span>
                    <Pill tone={i.all.highGapShare >= 25 ? "clay" : "muted"}>{fmt(i.all.highGapShare, 0)}% حادة</Pill>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Reveal>
      <Reveal i={2}>
        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Panel title="تباين الإدراك: الأفراد مقابل أصحاب العمل" sub="فرق متوسط الأداء: التقييم الذاتي (B2C) − تقييم أصحاب العمل (B2B)"
            note="تتوقع الدراسة أن يقيّم الموظفون أنفسهم أعلى مما يقيّمهم أصحاب العمل؛ القيم الموجبة تؤكد ذلك، والسالبة تشير إلى مهارات يقلّل الأفراد من شأن أدائهم فيها.">
            {diverge.length ? (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer>
                  <BarChart data={diverge} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                    <XAxis type="number" domain={[-2, 2]} tick={AX} tickFormatter={(v) => (v > 0 ? `+${v}` : String(v))} />
                    <YAxis type="category" dataKey="name" tick={AX} width={32} />
                    <ReferenceLine x={0} stroke="hsl(206 62% 22%)" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => SKILL_LABELS[String(l)] ?? l} formatter={(v: number) => [v > 0 ? `+${v}` : v, "الفرق"]} />
                    <Bar dataKey="diff" radius={4}>
                      {diverge.map((d) => <Cell key={d.name} fill={d.diff >= 0 ? C.gold : C.teal} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">يتطلب هذا الرسم ردوداً من المسارين معاً (B2B وB2C).</p>}
          </Panel>
          <SegmentHeatmap testId="heatmap-skills" title="خريطة الفجوات حسب الشريحة" sub="الفجوة المرجّحة لكل مهارة داخل كل شريحة؛ الأحمر فجوة أكبر، الأخضر أداء يفوق الأهمية"
            note="تُحسب القيم على ردود الشريحة فقط؛ الأعمدة الباهتة تمثل شرائح يقل عددها عن 5 ردود." rows={skillRows} pick={(s) => s.skillGaps} palette="gap" />
        </div>
      </Reveal>
      <Reveal i={3}>
        <Panel title="جدول الفجوات" sub="الفجوة = الأهمية − الأداء · الفجوة المرجّحة = الفجوة × الأهمية · حادة = نسبة من بلغت فجوتهم درجتين فأكثر">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="py-2 text-start">المهارة</th>
                  <th colSpan={6} className="border-s border-border bg-primary/5 py-2">B2B</th>
                  <th colSpan={6} className="border-s border-border bg-accent/10 py-2">B2C</th>
                </tr>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th />
                  {[0, 1].map((x) => ["n", "أهمية", "أداء", "فجوة", "مرجّحة", "حادة"].map((h) => <th key={x + h} className="px-2 py-1.5 font-medium">{h}</th>))}
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
      </Reveal>
    </div>
  );
}

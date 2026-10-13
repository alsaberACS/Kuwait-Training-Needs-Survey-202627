import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RLegend } from "recharts";
import { Users } from "lucide-react";
import type { SegmentSlice } from "@workspace/api-client-react";
import { SKILL_LABELS, GROUP_LABELS, COURSE_LABELS, optionLabel } from "@/lib/survey-definition";
import { LOW_N } from "@/lib/study-context";
import { cn } from "@/lib/utils";
import { fmt, AX, GRID, TOOLTIP_STYLE, SERIES, Panel, Skel, Err, Empty, Chips, Pill, Reveal, LowN } from "./shared";
import { Heatmap, RangeBars } from "./charts";
import { useSegmentReport, sliceLabel, dimOptions } from "./segment-heatmap";

const topOf = (m: Record<string, number>, desc = true) => {
  const e = Object.entries(m);
  if (!e.length) return undefined;
  return e.sort((a, b) => (desc ? b[1] - a[1] : a[1] - b[1]))[0];
};

export function Segments() {
  const [dim, setDim] = useState("stakeholder");
  const q = useSegmentReport();
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  if (!q.data.respondents) return <Empty />;
  const d = q.data.dimensions.find((x) => x.id === dim) ?? q.data.dimensions[0];
  const live = d.slices.filter((s) => s.n > 0);
  const cols = live.map((s) => ({ id: s.key, label: sliceLabel(d, s), n: s.n }));
  const skillRanges = Object.entries(SKILL_LABELS).map(([id, label]) => {
    const vals = live.map((s) => ({ v: s.skillGaps[id] ?? 0, label: sliceLabel(d, s), n: s.n }));
    const min = vals.reduce((a, b) => (b.v < a.v ? b : a), vals[0]);
    const max = vals.reduce((a, b) => (b.v > a.v ? b : a), vals[0]);
    return { id, label, min, max };
  }).sort((a, b) => (b.max.v - b.min.v) - (a.max.v - a.min.v));
  const rangeDomain: [number, number] = [Math.min(-0.5, ...skillRanges.map((r) => r.min.v)) - 0.2, Math.max(1, ...skillRanges.map((r) => r.max.v)) + 0.2];
  const needData = Object.keys(GROUP_LABELS).map((g) => ({ name: g, ...Object.fromEntries(live.map((s) => [s.key, s.groupNeed[g] ?? 0])) }));
  return (
    <div className="grid gap-4">
      <Reveal i={0}>
        <Panel title="اختر بُعد المقارنة" sub={`${q.data.respondents} رداً مكتملاً موزعة على شرائح ${d.label}`}
          note={`الشرائح الموسومة «للاستئناس» تضم أقل من ${LOW_N} ردود؛ تُقرأ كإشارات أولية لا كنتائج. لا تُحسب اختبارات دلالة لعينة طوعية.`}>
          <Chips options={dimOptions(q.data)} value={dim} onChange={setDim} testId="segments-dim" />
        </Panel>
      </Reveal>
      <Reveal i={1}>
        <div className={cn("grid gap-3", live.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : live.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
          {d.slices.map((s, i) => <SliceCard key={s.key} s={s} label={sliceLabel(d, s)} color={SERIES[i % SERIES.length]} />)}
        </div>
      </Reveal>
      {live.length >= 2 && (
        <>
          <Reveal i={2}>
            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="أين تختلف الشرائح أكثر في فجوات المهارات؟" sub="المدى بين أدنى شريحة وأعلى شريحة لكل مهارة (الفجوة المرجّحة)، مرتب من الأكبر"
                note="مهارة ذات مدى واسع تحتاج مساراً مختلفاً لكل شريحة؛ مهارة ذات مدى ضيق تصلح لبرنامج موحّد. النجمة تعني شريحة صغيرة.">
                <RangeBars rows={skillRanges} domain={rangeDomain} lowN={LOW_N} />
              </Panel>
              <Panel title="الاحتياج على المسارات التدريبية حسب الشريحة" sub="مؤشر الاحتياج المجمّع (0–100) لكل مسار، عمود لكل شريحة">
                <div className="h-80" dir="ltr">
                  <ResponsiveContainer>
                    <BarChart data={needData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                      <XAxis dataKey="name" tick={AX} reversed />
                      <YAxis domain={[0, 100]} tick={AX} orientation="right" width={32} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => GROUP_LABELS[String(l)] ?? l} formatter={(v: number) => fmt(v, 0)} />
                      <RLegend wrapperStyle={{ fontFamily: "IBM Plex Sans Arabic", fontSize: 11 }} />
                      {live.map((s, i) => <Bar key={s.key} dataKey={s.key} name={`${sliceLabel(d, s)} (n=${s.n})`} fill={SERIES[i % SERIES.length]} radius={[3, 3, 0, 0]} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          </Reveal>
          <Reveal i={3}>
            <Panel title="أولوية المسارات المستقبلية حسب الشريحة" sub="درجة Borda (0–100) لكل مسار داخل كل شريحة؛ الأغمق أولوية أعلى" testId="heatmap-segments-tracks">
              <Heatmap rows={Object.entries(GROUP_LABELS).map(([id, label]) => ({ id, label }))} cols={cols} palette="score" domainMax={100} lowN={LOW_N} rowHeader={d.label}
                value={(rowId, colId) => live.find((s) => s.key === colId)?.trackScores[rowId]} />
            </Panel>
          </Reveal>
        </>
      )}
    </div>
  );
}

function SliceCard({ s, label, color }: { s: SegmentSlice; label: string; color: string }) {
  if (!s.n) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground" data-testid={`slice-${s.key}`}>
        <p className="font-medium text-foreground/70">{label}</p>
        <p className="mt-1 text-xs">لا ردود من هذه الشريحة بعد</p>
      </div>
    );
  }
  const gap = topOf(s.skillGaps);
  const track = topOf(s.trackScores);
  const course = s.topCourses[0];
  const pref = (qid: string) => (s.prefs[qid] ? `${optionLabel(qid, s.prefs[qid])} (${fmt(s.prefShares[qid] ?? 0, 0)}%)` : "—");
  return (
    <div className="relative overflow-hidden rounded-2xl border border-card-border bg-card p-4" data-testid={`slice-${s.key}`}>
      <div className="absolute inset-y-0 start-0 w-1" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{label}</p>
        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground"><Users className="h-3.5 w-3.5" />{s.n}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5"><LowN n={s.n} min={LOW_N} /><Pill tone="gold">حجز فوري {fmt(s.bookNowShare, 0)}%</Pill></div>
      <dl className="mt-3 grid gap-2.5 text-xs">
        <Row k="أكبر فجوة مهارية" v={gap ? `${SKILL_LABELS[gap[0]] ?? gap[0]}` : "—"} meta={gap ? `فجوة مرجّحة ${fmt(gap[1], 2)}` : undefined} />
        <Row k="الدورة الأعلى طلباً" v={course ? COURSE_LABELS[course.courseId] ?? course.label : "—"} meta={course ? `مؤشر الاحتياج ${fmt(course.needIndex, 0)} · عُرضت على ${course.shown}` : undefined} />
        <Row k="المسار الأول" v={track ? GROUP_LABELS[track[0]] ?? track[0] : "—"} meta={track ? `درجة ${fmt(track[1], 0)}` : undefined} />
      </dl>
      <div className="mt-3 border-t border-dashed border-border pt-2.5">
        <p className="text-[11px] font-semibold text-muted-foreground">الخيار الأكثر تفضيلاً</p>
        <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          {([["Q19", "التنفيذ"], ["Q20", "المدة"], ["Q21", "التوقيت"], ["Q22", "اللغة"], ["Q23", "الاعتماد"]] as const).map(([qid, k]) => (
            <div key={qid} className="min-w-0">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="line-clamp-2 leading-snug" title={pref(qid)}>{pref(qid)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Row({ k, v, meta }: { k: string; v: string; meta?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 leading-snug">
        <span className="line-clamp-2 font-medium" title={v}>{v}</span>
        {meta && <span className="block text-[11px] tabular-nums text-muted-foreground">{meta}</span>}
      </dd>
    </div>
  );
}

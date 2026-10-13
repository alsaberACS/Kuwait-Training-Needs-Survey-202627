import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RLegend } from "recharts";
import { useGetCourseDemand, getGetCourseDemandQueryKey, type SurveyPath, type CourseDemandItem } from "@workspace/api-client-react";
import { COURSE_LABELS, GROUP_LABELS } from "@/lib/survey-definition";
import { cn } from "@/lib/utils";
import { fmt, AX, GRID, TOOLTIP_STYLE, C, Panel, Skel, Err, Empty, Pill, Reveal } from "./shared";
import { StackedBar, Legend } from "./charts";
import { SegmentHeatmap } from "./segment-heatmap";

const LEVELS = [
  { key: "bookNow", label: "أرغب بالحجز فوراً", color: C.gold },
  { key: "future", label: "مهتم مستقبلاً", color: C.teal },
  { key: "notInterested", label: "غير مهتم", color: C.muted },
] as const;

const composition = (r: CourseDemandItem) => LEVELS.map((l) => ({ key: l.key, label: l.label, value: r[l.key], color: l.color }));

export function Courses({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetCourseDemand(params, { query: { queryKey: getGetCourseDemandQueryKey(params) } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const items = q.data.items;
  if (!items.length || items.every((i) => i.shown === 0)) return <Empty />;
  const gate = new Map(q.data.groups.map((g) => [g.groupId, g]));
  const groups = Array.from(new Set(items.map((i) => i.groupId))).sort((a, b) => (gate.get(b)?.selected ?? 0) - (gate.get(a)?.selected ?? 0));
  const groupStats = groups.map((g) => {
    const rows = items.filter((i) => i.groupId === g);
    const shown = rows.reduce((a, r) => a + r.shown, 0);
    const codes = rows.reduce((a, r) => a + r.future + 2 * r.bookNow, 0);
    const bookNow = rows.reduce((a, r) => a + r.bookNow, 0);
    return { groupId: g, name: g, label: GROUP_LABELS[g] ?? rows[0].groupLabel, shown, need: shown ? (codes / (2 * shown)) * 100 : 0, bookNow: shown ? (bookNow / shown) * 100 : 0, courses: rows.length };
  });
  const top = items.filter((i) => i.shown > 0).sort((a, b) => b.needIndex - a.needIndex || b.bookNowShare - a.bookNowShare || b.shown - a.shown).slice(0, 10);
  const groupRows = Object.entries(GROUP_LABELS).map(([id, label]) => ({ id, label }));
  return (
    <div className="grid gap-4">
      <Reveal i={0}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="المسارات التدريبية التي اختارها المشاركون" sub="نسبة من أجابوا عن سؤال المسارات واختاروا كل مسار. الدورات أدناه تُعرض فقط لمن اختار مسارها.">
            <div className="grid gap-2.5">
              {q.data.groups.slice().sort((a, b) => b.selected - a.selected).map((g) => (
                <div key={g.groupId} className="grid gap-1.5" data-testid={`row-group-${g.groupId}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{GROUP_LABELS[g.groupId] ?? g.label}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground"><b className="text-foreground">{fmt(g.selectedShare, 0)}%</b> · {g.selected}/{g.respondents}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-[hsl(var(--teal))]" style={{ width: `${g.selectedShare}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="شدة الاحتياج داخل كل مسار" sub="مؤشر الاحتياج المجمّع (0–100) وحصة «الحجز الفوري» بين كل تقييمات دورات المسار"
            note="الاختيار يقيس اتساع الاهتمام؛ المؤشر يقيس عمقه بين من دخلوا المسار فعلاً. مسار يُختار كثيراً بمؤشر منخفض يعني فضولاً أكثر من حاجة.">
            <div className="h-64" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={groupStats} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="name" tick={AX} reversed />
                  <YAxis domain={[0, 100]} tick={AX} orientation="right" width={32} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => GROUP_LABELS[String(l)] ?? l} formatter={(v: number, n: string, p) => [`${fmt(v, 0)} (تقييمات: ${(p.payload as { shown: number }).shown})`, n]} />
                  <RLegend wrapperStyle={{ fontFamily: "IBM Plex Sans Arabic", fontSize: 12 }} />
                  <Bar dataKey="need" name="مؤشر الاحتياج" fill={C.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookNow" name="حجز فوري %" fill={C.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </Reveal>
      <Reveal i={1}>
        <Panel title="أعلى 10 دورات طلباً" sub="مرتبة بمؤشر الاحتياج ثم بحصة الحجز الفوري؛ الشريط يُظهر تركيبة الإجابات بين من عُرضت عليهم الدورة" testId="top-courses"
          action={<Legend items={LEVELS.map((l) => ({ label: l.label, color: l.color }))} />}>
          <div className="grid gap-3 lg:grid-cols-2">
            {top.map((r, k) => (
              <div key={r.courseId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border p-3" data-testid={`top-course-${r.courseId}`}>
                <span className={cn("font-display flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold", k < 3 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}>{k + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium leading-snug" title={COURSE_LABELS[r.courseId] ?? r.label}>{COURSE_LABELS[r.courseId] ?? r.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{r.courseId} · {GROUP_LABELS[r.groupId] ?? r.groupLabel}</p>
                  <StackedBar parts={composition(r)} height={8} className="mt-1.5" />
                </div>
                <div className="text-end">
                  <p className="font-display text-xl font-semibold tabular-nums leading-none">{fmt(r.needIndex, 0)}</p>
                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">حجز {fmt(r.bookNowShare, 0)}% · n={r.shown}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Reveal>
      <Reveal i={2}>
        <SegmentHeatmap testId="heatmap-courses" title="خريطة الاحتياج حسب الشريحة" sub="مؤشر الاحتياج المجمّع لكل مسار داخل كل شريحة (0–100)"
          note="القيمة تُحسب فقط من تقييمات الدورات التي عُرضت على أفراد الشريحة؛ الخلايا «—» تعني أن أحداً من الشريحة لم يدخل المسار." rows={groupRows} pick={(s) => s.groupNeed} palette="need" domainMax={100} />
      </Reveal>
      {groups.map((g, gi) => {
        const rows = items.filter((i) => i.groupId === g).sort((a, b) => b.needIndex - a.needIndex);
        const gg = gate.get(g);
        return (
          <Reveal key={g} i={3 + gi}>
            <Panel title={GROUP_LABELS[g] ?? rows[0].groupLabel} sub={gg ? `اختار هذا المسار ${gg.selected} من ${gg.respondents} مشاركاً (${fmt(gg.selectedShare, 0)}%)` : undefined}
              action={<Legend items={LEVELS.map((l) => ({ label: l.label, color: l.color }))} />}>
              <div className="grid gap-3">
                {rows.map((r) => (
                  <div key={r.courseId} className="grid items-center gap-2 md:grid-cols-[1fr_260px_150px]" data-testid={`row-course-${r.courseId}`}>
                    <p className="text-sm"><span className="me-1.5 text-xs text-muted-foreground">{r.courseId}</span>{COURSE_LABELS[r.courseId] ?? r.label}</p>
                    <div className="flex items-center gap-2">
                      <StackedBar parts={composition(r)} height={10} className="flex-1" />
                      <span className="w-10 text-end font-semibold tabular-nums">{fmt(r.needIndex, 0)}</span>
                    </div>
                    <div className="flex gap-1.5 text-xs tabular-nums text-muted-foreground">
                      <Pill tone="gold">حجز {fmt(r.bookNowShare)}%</Pill>
                      <span>n={r.shown}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </Reveal>
        );
      })}
    </div>
  );
}

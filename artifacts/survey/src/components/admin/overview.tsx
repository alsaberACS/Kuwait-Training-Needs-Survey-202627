import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, ReferenceLine } from "recharts";
import { Users, CheckCircle2, Activity, Target, Clock, Bookmark, Contact, Flame, BookOpen, ClipboardList, Route, Map } from "lucide-react";
import {
  useGetAdminSummary, getGetAdminSummaryQueryKey, useGetMatchingResults, getGetMatchingResultsQueryKey, type SurveyPath, type AdminSummary,
} from "@workspace/api-client-react";
import { SUB_LABELS, optionLabel } from "@/lib/survey-definition";
import { DESK_STUDY } from "@/lib/study-context";
import { fmt, AX, GRID, TOOLTIP_STYLE, C, Panel, Skel, Err, Empty, HBars, Kpi, Reveal } from "./shared";
import { Donut, Funnel } from "./charts";

const STAKE_COLORS: Record<string, string> = { G: C.navy, P: C.teal, S: C.gold, I: C.clay };

export function Overview({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetAdminSummary(params, { query: { queryKey: getGetAdminSummaryQueryKey(params) } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const s = q.data;
  const maxReach = Math.max(...s.dropOff.map((d) => d.reached), 1);
  // The API returns raw option ids for single-choice demographics; label them from the survey definition.
  const labelled = (items: AdminSummary["byNationality"], qid: string) => items.map((i) => ({ ...i, label: optionLabel(qid, i.key) }));
  const subSectors = s.bySubSector.slice(0, 8).map((i) => {
    const [sector, sub] = i.key.split(":");
    return { ...i, label: `${SUB_LABELS[sector]?.[sub] ?? sub} · ${optionLabel("Q5", sector)}` };
  });
  return (
    <div className="grid gap-4">
      <Reveal i={0}><StudyPipeline s={s} /></Reveal>
      <Reveal i={1}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Kpi accent label="إجمالي البدايات" value={fmt(s.total, 0)} icon={Users} />
          <Kpi label="مكتملة" value={fmt(s.completed, 0)} icon={CheckCircle2} />
          <Kpi label="معدل الإكمال" value={`${fmt(s.completionRate)}%`} icon={Activity} />
          <Kpi label="B2B / B2C" value={`${s.b2b} / ${s.b2c}`} icon={Target} />
          <Kpi label="متوسط المدة" value={`${fmt(s.avgDurationSec / 60)} د`} icon={Clock} hint={`الوسيط ${fmt(s.medianDurationSec / 60)} د`} />
          <Kpi label="حجز فوري" value={fmt(s.bookNowRespondents, 0)} icon={Bookmark} />
          <Kpi label="بيانات تواصل" value={fmt(s.contactsCaptured, 0)} icon={Contact} />
          <Kpi label="فرص ساخنة" value={fmt(s.hotLeads, 0)} icon={Flame} hint="حجز فوري + تواصل" />
        </div>
      </Reveal>
      {s.total === 0 ? <Empty /> : (
        <>
          <Reveal i={2}>
            <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
              <Panel title="الردود اليومية" sub="البدايات مقابل الإكمال">
                <div className="h-64" dir="ltr">
                  <ResponsiveContainer>
                    <AreaChart data={s.byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="date" tick={AX} reversed />
                      <YAxis tick={AX} orientation="right" allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="started" name="بدأ" stroke={C.slate} fill="hsl(var(--chart-5) / .2)" />
                      <Area type="monotone" dataKey="completed" name="أكمل" stroke={C.navy} fill="hsl(var(--chart-2) / .35)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="مسار التسرب حسب القسم" sub="عدد من وصل إلى كل قسم ومن توقف عنده" note="التوقف عند قسم لا يُفسَّر كغياب للاحتياج؛ يُستخدم فقط لتحسين تجربة الاستبانة.">
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
          </Reveal>
          <Reveal i={3}>
            <div className="grid gap-4 xl:grid-cols-3">
              <Panel title="الفئات المعنية الأربع" sub="تصنيف الدراسة: حكومة (G) · قطاع خاص (P) · منشآت صغيرة ومتوسطة (S) · أفراد (I)"
                note="يُشتق التصنيف من مسار المشاركة والقطاع وحجم المؤسسة: الأفراد B2C ← I، الحكومة ← G، ريادة الأعمال أو أقل من 250 موظفاً ← S، وبقية المؤسسات ← P.">
                <Donut testId="chart-stakeholders" centerLabel="رد مكتمل"
                  data={(["G", "P", "S", "I"] as const).map((k) => {
                    const it = s.byStakeholder.find((x) => x.key === k);
                    return { key: k, label: it?.label ?? { G: "الجهات الحكومية (G)", P: "القطاع الخاص – مؤسسات كبرى (P)", S: "المنشآت الصغيرة والمتوسطة (S)", I: "الأفراد والمهنيون (I)" }[k], value: it?.count ?? 0, color: STAKE_COLORS[k] };
                  })} />
              </Panel>
              <Panel title="زمن الإكمال" sub="توزيع مدة الإجابة للردود المكتملة" note={`وعدت الاستبانة المشاركين بـ 5–7 دقائق؛ المتوسط ${fmt(s.avgDurationSec / 60)} د والوسيط ${fmt(s.medianDurationSec / 60)} د.`}>
                <DurationHistogram s={s} />
              </Panel>
              <Panel title="قمع الحجز" sub="من الإكمال إلى فرص الحجز الفعلية" note="الفرصة الساخنة = مشارك اختار «أرغب بالحجز فوراً» لدورة واحدة على الأقل وترك بيانات تواصل.">
                <Funnel steps={[
                  { label: "ردود مكتملة", value: s.completed, color: C.navy },
                  { label: "اختاروا الحجز الفوري", value: s.bookNowRespondents, color: C.teal },
                  { label: "تركوا بيانات تواصل", value: s.contactsCaptured, color: C.gold },
                  { label: "فرص ساخنة", value: s.hotLeads, color: C.clay },
                ]} />
              </Panel>
            </div>
          </Reveal>
          <Reveal i={4}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Panel title="الجنسية" sub="Q1"><HBars items={labelled(s.byNationality, "Q1")} /></Panel>
              <Panel title="الجنس" sub="Q2"><HBars items={labelled(s.byGender, "Q2")} color="bg-[hsl(var(--teal))]" /></Panel>
              <Panel title="الفئة العمرية" sub="Q3"><HBars items={labelled(s.byAge, "Q3")} color="bg-accent" /></Panel>
              <Panel title="المستوى التعليمي" sub="Q4"><HBars items={labelled(s.byEducation, "Q4")} /></Panel>
              <Panel title="القطاع" sub="Q5"><HBars items={labelled(s.bySector, "Q5")} color="bg-[hsl(var(--teal))]" /></Panel>
              <Panel title="المستوى الوظيفي" sub="Q6"><HBars items={labelled(s.byJobLevel, "Q6")} color="bg-accent" /></Panel>
              <Panel title="حجم المؤسسة (B2B)" sub="Q8 · المؤسسات فقط"><HBars items={labelled(s.byOrgSize, "Q8")} /></Panel>
              <Panel title="القطاعات الفرعية الأكثر حضوراً" sub="أعلى 8 قطاعات فرعية بين من حدّدوا قطاعاً فرعياً"><HBars items={subSectors} color="bg-[hsl(var(--teal))]" /></Panel>
              <Panel title="جهاز الإجابة"><HBars items={s.byDevice} color="bg-accent" /></Panel>
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}

function DurationHistogram({ s }: { s: AdminSummary }) {
  const data = s.durationBuckets.map((b) => ({ ...b, short: b.label.replace(" دقائق", "").replace("دقائق", "") }));
  const total = data.reduce((a, d) => a + d.count, 0);
  if (!total) return <p className="text-sm text-muted-foreground">لا بيانات مدة بعد</p>;
  const modal = Math.max(...data.map((d) => d.count));
  return (
    <div className="h-48" dir="ltr">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="short" tick={{ ...AX, fontSize: 10 }} reversed interval={0} />
          <YAxis tick={AX} orientation="right" allowDecimals={false} width={28} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} · ${fmt((v / total) * 100, 0)}%`, "ردود"]} labelFormatter={(l) => `${l} دقائق`} />
          <ReferenceLine y={0} stroke={GRID} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((d) => <Cell key={d.key} fill={d.count === modal ? C.gold : d.key === "5_7" ? C.teal : C.navy} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** The study storyline: desk study → field survey → matching → confirmed demand map. */
function StudyPipeline({ s }: { s: AdminSummary }) {
  const m = useGetMatchingResults({ needWeight: 40 }, { query: { queryKey: getGetMatchingResultsQueryKey({ needWeight: 40 }) } });
  const cells = { confirmed_priority: 0, new_demand: 0, evidence_led: 0, defer: 0 } as Record<string, number>;
  m.data?.items.forEach((i) => (cells[i.gridCell] = (cells[i.gridCell] ?? 0) + 1));
  const groups = s.byStakeholder.filter((g) => g.count > 0).length;
  const stages = [
    { icon: BookOpen, eyebrow: "المرحلة 1 · الدراسة المكتبية", big: DESK_STUDY.reports, unit: "تقريراً", lines: [`${DESK_STUDY.programmes} برنامجاً في ${DESK_STUDY.organisations} جهة`, `${DESK_STUDY.benchmarkedCourses} دورة معيارية ← ${DESK_STUDY.trends} اتجاهات`] },
    { icon: ClipboardList, eyebrow: "المرحلة 2 · الاستبانة الميدانية", big: s.completed, unit: "رداً مكتملاً", lines: [`${s.b2b} مؤسسات · ${s.b2c} أفراد`, `${groups} من الفئات الأربع ممثَّلة`] },
    { icon: Route, eyebrow: "المطابقة", big: DESK_STUDY.catalogueWorkshops, unit: "ورشة مُقيَّمة", lines: [m.data ? `${cells.confirmed_priority} أولوية مؤكدة · ${cells.new_demand} طلب جديد` : "…", m.data ? `${cells.evidence_led} تقودها الأدلة · ${cells.defer} مؤجلة` : ""] },
    { icon: Map, eyebrow: "المخرج", big: DESK_STUDY.shortlist, unit: "ورشة في القائمة المختصرة", lines: [`${DESK_STUDY.build} بناء · ${DESK_STUDY.expand} توسعة · ${DESK_STUDY.select} اختيار`, `${DESK_STUDY.trainingDays} يوماً تدريبياً · ${DESK_STUDY.participants} مشاركاً مستهدفاً`] },
  ];
  return (
    <section className="ink-panel grain relative overflow-hidden rounded-3xl p-5 sm:p-6" data-testid="study-pipeline">
      <div className="absolute inset-x-0 top-0 h-1.5 sadu opacity-70" />
      <div className="absolute -start-24 -bottom-24 h-64 w-64 rounded-full bg-[hsl(var(--teal)/.25)] blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-[11px] font-semibold tracking-[.2em] text-accent">من الأدلة المكتبية إلى خريطة الطلب المؤكدة</p>
          <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">مسار الدراسة في أربع محطات</h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-white/70">تختبر الاستبانة الميدانية ما رصدته الدراسة المكتبية من اتجاهات، ثم تُطابق النتيجتين لكل ورشة في الكتالوج لتحديد ما يُطلق أولاً.</p>
      </div>
      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((st, i) => (
          <div key={st.eyebrow} className="relative rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
            {i < stages.length - 1 && <span className="absolute -start-2.5 top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground xl:flex">←</span>}
            <div className="flex items-center gap-2 text-[11px] font-semibold text-accent"><st.icon className="h-3.5 w-3.5" />{st.eyebrow}</div>
            <p className="font-display mt-2 text-3xl font-semibold tabular-nums leading-none text-white">{fmt(st.big, 0)} <span className="text-sm font-normal text-white/70">{st.unit}</span></p>
            <ul className="mt-2.5 grid gap-0.5 text-xs leading-relaxed text-white/80">{st.lines.filter(Boolean).map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

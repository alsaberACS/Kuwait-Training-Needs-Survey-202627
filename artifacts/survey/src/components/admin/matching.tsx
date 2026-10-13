import { useMemo, useState } from "react";
import { useGetMatchingResults, getGetMatchingResultsQueryKey, useListCatalogue, getListCatalogueQueryKey, type MatchingItem } from "@workspace/api-client-react";
import { DESK_STUDY, TRENDS } from "@/lib/study-context";
import { cn } from "@/lib/utils";
import { fmt, C, Panel, Skel, Err, Empty, Pill, Reveal } from "./shared";
import { QuadrantScatter, Donut, StackedBar, Legend } from "./charts";

const CELL: Record<string, { label: string; cls: string; color: string; action: string }> = {
  confirmed_priority: { label: "أولوية مؤكدة", cls: "bg-primary text-primary-foreground", color: C.navy, action: "أطلق أولاً" },
  new_demand: { label: "طلب جديد", cls: "bg-accent text-accent-foreground", color: C.gold, action: "أضف للمحفظة واختبر" },
  evidence_led: { label: "مسار تقوده الأدلة", cls: "bg-[hsl(var(--teal))] text-white", color: C.teal, action: "احتفظ به وابنِ الوعي أولاً" },
  defer: { label: "تأجيل", cls: "bg-muted text-muted-foreground", color: "hsl(206 25% 70%)", action: "أرجئ للمراجعة التالية" },
};
const SUPPLY: Record<string, { label: string; color: string }> = {
  Build: { label: "بناء (Build)", color: C.clay },
  Expand: { label: "توسعة (Expand)", color: C.gold },
  Select: { label: "اختيار (Select)", color: C.teal },
};
const TIER_COLORS: Record<string, string> = { Foundation: C.slate, Practitioner: C.navy, Leadership: C.gold };

export function Matching() {
  const [w, setW] = useState(40);
  const params = { needWeight: w };
  const q = useGetMatchingResults(params, { query: { queryKey: getGetMatchingResultsQueryKey(params), placeholderData: (p) => p } });
  const cat = useListCatalogue({ query: { queryKey: getListCatalogueQueryKey() } });
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    q.data?.items.forEach((i) => (c[i.gridCell] = (c[i.gridCell] ?? 0) + 1));
    return c;
  }, [q.data]);
  const items = q.data?.items ?? [];
  const launch = items.filter((i) => i.gridCell === "confirmed_priority" || i.gridCell === "new_demand");
  const categories = useMemo(() => {
    const m = new Map<string, { id: number; label: string; items: MatchingItem[] }>();
    items.forEach((i) => {
      const k = i.workshop.categoryLabel;
      if (!m.has(k)) m.set(k, { id: i.workshop.categoryId, label: k, items: [] });
      m.get(k)!.items.push(i);
    });
    return [...m.values()].sort((a, b) => a.id - b.id).map((c) => {
      const rated = c.items.filter((i) => i.fieldN > 0);
      return {
        ...c,
        n: c.items.length,
        days: c.items.reduce((a, i) => a + i.workshop.days, 0),
        avgScore: c.items.reduce((a, i) => a + i.compositeScore, 0) / c.items.length,
        avgNeed: rated.length ? rated.reduce((a, i) => a + i.fieldNeed, 0) / rated.length : null,
        avgEvidence: c.items.reduce((a, i) => a + i.workshop.evidenceScore, 0) / c.items.length,
        cells: Object.keys(CELL).map((k) => ({ key: k, label: CELL[k].label, value: c.items.filter((i) => i.gridCell === k).length, color: CELL[k].color })),
        top: [...c.items].sort((a, b) => a.rank - b.rank)[0],
      };
    });
  }, [items]);
  const stable = items.filter((i) => i.rankShift === 0).length;
  return (
    <div className="grid gap-4">
      <Reveal i={0}>
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
                <div key={k} className="rounded-xl border border-border p-3 text-center" data-testid={`cell-count-${k}`}>
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", v.cls)}>{v.label}</span>
                  <p className="font-display mt-1.5 text-2xl font-semibold tabular-nums">{counts[k] ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">{v.action}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            الكتالوج: {cat.isLoading ? "…" : `${cat.data?.length ?? 0} ورشة · ${cat.data?.filter((c) => c.shortlisted).length ?? 0} ضمن القائمة المختصرة`}
            {q.data && ` · المجيبون: ${q.data.respondents}`}
            {items.length > 0 && ` · ثبات الترتيب عند تغيير الوزن: ${stable}/${items.length} ورشة لم تتحرك`}
          </p>
        </Panel>
      </Reveal>
      {q.isLoading ? <Skel /> : q.isError || !q.data ? <Err onRetry={() => q.refetch()} /> : !items.length ? (
        <Empty title="لا توجد نتائج مطابقة بعد" text="تعتمد المطابقة على ردود الميدان مقابل أدلة الدراسة المكتبية. ستُحسب الأولويات بمجرد توفر ردود مكتملة." />
      ) : (
        <>
          <Reveal i={1}>
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
              <Panel title="شبكة المطابقة: أدلة الدراسة المكتبية × احتياج الميدان" sub="كل نقطة ورشة من الكتالوج؛ الخط الرأسي عند درجة أدلة 60 والأفقي عند احتياج ميداني 50"
                note="الورش التي لم تُقيَّم ميدانياً بعد (n=0) تظهر عند احتياج 0 مؤقتاً وتُصنَّف وفق الأدلة فقط؛ لا يعني ذلك غياب الاحتياج.">
                <QuadrantScatter testId="chart-matching-grid" xLabel="درجة الأدلة المكتبية" yLabel="احتياج الميدان" xRef={60} yRef={50} height={360} showIds={false}
                  quadrants={{ tl: "طلب جديد", tr: "أولوية مؤكدة", bl: "تأجيل", br: "تقوده الأدلة" }}
                  points={items.map((i) => ({ id: `#${i.rank}`, label: i.workshop.titleAr, x: i.workshop.evidenceScore, y: i.fieldNeed, z: i.compositeScore * 2, color: CELL[i.gridCell]?.color, meta: `${CELL[i.gridCell]?.label} · درجة ${fmt(i.compositeScore)} · n=${i.fieldN} · ${i.workshop.categoryLabel}` }))} />
                <Legend className="mt-2" items={Object.values(CELL).map((c) => ({ label: c.label, color: c.color }))} />
              </Panel>
              <div className="grid gap-4">
                <Panel title="جاهزية التوريد لمجموعة الإطلاق" sub={`الورش المؤكدة والطلب الجديد (${launch.length}) حسب قرار التوريد`} note="Select = متاح محلياً ويُختار فوراً · Expand = يُوسَّع عرض قائم · Build = يُبنى من الصفر (الأبطأ).">
                  <Donut testId="donut-supply" centerLabel="ورشة" height={160} data={Object.keys(SUPPLY).map((k) => ({ key: k, label: SUPPLY[k].label, value: launch.filter((i) => i.supplyAction === k).length, color: SUPPLY[k].color }))} />
                </Panel>
                <Panel title="مستويات مجموعة الإطلاق" sub="Foundation · Practitioner · Leadership">
                  <Donut testId="donut-tier" centerLabel="ورشة" height={160} data={Object.keys(TIER_COLORS).map((k) => ({ key: k, label: k, value: launch.filter((i) => i.workshop.tier === k).length, color: TIER_COLORS[k] }))} />
                </Panel>
              </div>
            </div>
          </Reveal>
          <Reveal i={2}>
            <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
              <Panel title="الاتجاهات الخمسة للدراسة المكتبية" sub={`${DESK_STUDY.shortlist} ورشة في القائمة المختصرة موزعة على الاتجاهات، وما يختبره كل اتجاه في الاستبانة`}>
                <div className="grid gap-2.5">
                  {TRENDS.map((t) => (
                    <div key={t.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border p-3">
                      <span className="font-display flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{t.id}</span>
                      <div className="min-w-0"><p className="text-sm font-medium leading-snug">{t.label}</p><p className="text-[11px] text-muted-foreground">يُختبر عبر: {t.domains}</p></div>
                      <Pill tone="gold">{t.shortlisted} ورش</Pill>
                    </div>
                  ))}
                  <p className="text-[11px] leading-relaxed text-muted-foreground">الجاهزية المهنية (C12، C21–C23) ومسار التحكيم التجاري خارج القائمة المختصرة؛ أي احتياج ميداني عليهما يُحلَّل بوصفه «طلباً جديداً».</p>
                </div>
              </Panel>
              <Panel title="المجالات الستة للكتالوج" sub="متوسط الدرجة المركّبة والاحتياج والأدلة لكل مجال، وتوزيع خلايا الشبكة داخله" testId="category-rollup"
                action={<Legend items={Object.values(CELL).map((c) => ({ label: c.label, color: c.color }))} />}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground">
                      <tr>{["المجال", "ورش · أيام", "الدرجة", "الاحتياج", "الأدلة", "الشبكة", "الأعلى ترتيباً"].map((h) => <th key={h} className="px-2 py-2 text-start font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {categories.map((c) => (
                        <tr key={c.label} data-testid={`row-category-${c.id}`}>
                          <td className="px-2 py-2.5 font-medium">{c.label}</td>
                          <td className="px-2 py-2.5 text-xs tabular-nums text-muted-foreground">{c.n} · {c.days}</td>
                          <td className="px-2 py-2.5 font-semibold tabular-nums">{fmt(c.avgScore)}</td>
                          <td className="px-2 py-2.5 tabular-nums">{c.avgNeed === null ? <span className="text-xs text-muted-foreground">لم يُقيَّم</span> : fmt(c.avgNeed, 0)}</td>
                          <td className="px-2 py-2.5 tabular-nums">{fmt(c.avgEvidence, 0)}</td>
                          <td className="px-2 py-2.5"><StackedBar parts={c.cells} height={8} className="min-w-[90px]" /></td>
                          <td className="px-2 py-2.5 text-xs"><span className="font-display me-1 font-semibold">#{c.top.rank}</span>{c.top.workshop.titleAr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </Reveal>
          <Reveal i={3}>
            <Panel title="محفظة الورش مرتبة حسب الدرجة المركّبة" sub="خريطة الطلب المؤكدة: الترتيب، الخلية، الدرجة، الاحتياج الميداني، الأدلة، قرار التوريد، وتحوّل الترتيب عند تغيير الوزن">
              {q.data.respondents === 0 && <p className="mb-3 rounded-lg bg-accent/15 p-2.5 text-xs">لا توجد ردود ميدانية بعد. الترتيب الحالي مبني على أدلة الدراسة المكتبية فقط.</p>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>{["#", "الورشة", "المجال", "الخلية", "الدرجة", "الاحتياج", "الأدلة", "التوريد", "التحول", "المستوى"].map((h) => <th key={h} className="px-2 py-2 text-start font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((m) => (
                      <tr key={m.workshop.id} className={cn(m.gridCell === "confirmed_priority" && "bg-primary/[.03]")} data-testid={`row-match-${m.workshop.id}`}>
                        <td className="px-2 py-2.5 font-display font-semibold tabular-nums">{m.rank}</td>
                        <td className="px-2 py-2.5"><p className="font-medium">{m.workshop.titleAr}</p><p dir="ltr" className="text-end text-xs text-muted-foreground">{m.workshop.titleEn}</p></td>
                        <td className="px-2 py-2.5 text-xs">{m.workshop.categoryLabel}</td>
                        <td className="px-2 py-2.5"><span className={cn("whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold", CELL[m.gridCell]?.cls)}>{CELL[m.gridCell]?.label}</span></td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2"><span className="font-semibold tabular-nums">{fmt(m.compositeScore)}</span><div className="h-1.5 w-14 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, m.compositeScore)}%` }} /></div></div>
                        </td>
                        <td className="px-2 py-2.5 tabular-nums">{m.fieldN ? <>{fmt(m.fieldNeed, 0)} <span className="text-xs text-muted-foreground">n={m.fieldN}</span></> : <span className="text-xs text-muted-foreground">لم يُقيَّم</span>}</td>
                        <td className="px-2 py-2.5 tabular-nums">{fmt(m.workshop.evidenceScore, 0)}</td>
                        <td className="px-2 py-2.5"><span className="rounded border px-1.5 py-0.5 text-xs font-medium" style={{ borderColor: SUPPLY[m.supplyAction]?.color, color: SUPPLY[m.supplyAction]?.color }}>{m.supplyAction}</span></td>
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
          </Reveal>
        </>
      )}
    </div>
  );
}

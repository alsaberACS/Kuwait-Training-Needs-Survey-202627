import { motion } from "framer-motion";
import {
  LayoutGrid, Flame, Zap, CalendarRange, Clock3, Layers, Trophy, BookOpenCheck, TrendingUp, Flag, Store, Users2,
  MonitorPlay, CalendarDays, Clock, Languages, Award, Sparkles, Wallet, BadgeCheck, Hammer, type LucideIcon,
} from "lucide-react";
import type { CourseDemandItem, MatchingItem, TrackRankItem, QuestionBreakdown } from "@workspace/api-client-react";
import { COURSE_LABELS, GROUP_LABELS, optionLabel } from "@/lib/survey-definition";
import { cn } from "@/lib/utils";
import { fmt } from "./shared";
import { GOLD, GOLD_SOFT, SILVER, WHITE, GOLD_GRAD, glass, DOMAIN, CELL_AR, SUPPLY_AR, TIER_AR, LOCAL_AR, AUDIENCE_AR, GlassPanel, Chip, Medal, PosterKpi, GlassDonut, GlassStack } from "./infographic-kit";

export const dayWord = (n: number) => (n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n <= 10 ? `${n} أيام` : `${n} يوماً`);
const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0);

export type Lead = { c: CourseDemandItem; w?: MatchingItem };
export type DomainMix = {
  id: string; short: string; icon: LucideIcon; shown: number; courses: number; bookNow: number; future: number; notInterested: number;
  pooled: number | null; gate: number | null; days: number; top: Lead[];
};

/* =====================================================================
   Page 2 — demand for the workshops: leaderboard table + intent mix per domain
   ===================================================================== */
export function DemandPage({ leaders, courses, mix, catalogueCount, pathLabel }: { leaders: Lead[]; courses: CourseDemandItem[]; mix: DomainMix[]; catalogueCount: number; pathLabel: string }) {
  const strong = courses.filter((c) => c.needIndex >= 75).length;
  const hot = courses.filter((c) => c.bookNowShare >= 50).length;
  const days = leaders.reduce((a, l) => a + (l.w?.workshop.days ?? 0), 0);
  const covered = leaders.filter((l) => l.w).length;
  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PosterKpi icon={LayoutGrid} label="ورشة عُرضت للتقييم" value={`${courses.length} / ${catalogueCount}`} hint="من كتالوج المركز، بحسب المسارات التي اختارها كل مشارك" testId="info-kpi-shown" />
        <PosterKpi icon={Flame} label="ورشة بمؤشر احتياج 75 فأكثر" value={String(strong)} hint="من الورش المعروضة" testId="info-kpi-strong" />
        <PosterKpi icon={Zap} label="ورشة طلب نصف من رأوها حجزها فوراً" value={String(hot)} hint="نسبة الحجز الفوري 50% فأكثر" testId="info-kpi-hot" />
        <PosterKpi icon={CalendarRange} label="يوماً تدريبياً للورش العشر الأولى" value={String(days)} hint={covered < leaders.length ? `بحسب الكتالوج · ${covered} من ${leaders.length} ورش مرتبطة بالكتالوج` : "بحسب مدد الكتالوج"} testId="info-kpi-days" />
      </div>

      <div className="mt-5">
        <GlassPanel title="الورش العشر الأعلى طلباً" sub={`مرتبة بمؤشر الاحتياج ثم نسبة الحجز الفوري · ${pathLabel} · المدة والمستوى ودرجة الأدلة والتوصية من كتالوج المركز ومصفوفة المطابقة`} testId="info-leaderboard">
          {leaders.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-1.5 text-[12px] md:min-w-[560px]">
                <thead>
                  <tr className="text-[10px] text-white/65">
                    <th className="px-2 pb-1 text-start font-medium">#</th>
                    <th className="px-2 pb-1 text-start font-medium">الورشة</th>
                    <th className="px-2 pb-1 text-start font-medium">مؤشر الاحتياج</th>
                    <th className="hidden px-2 pb-1 text-center font-medium md:table-cell">حجز فوري</th>
                    <th className="hidden px-2 pb-1 text-center font-medium md:table-cell">مهتم مستقبلاً</th>
                    <th className="px-2 pb-1 text-center font-medium">عُرضت على</th>
                    <th className="hidden px-2 pb-1 text-center font-medium lg:table-cell">المدة</th>
                    <th className="hidden px-2 pb-1 text-center font-medium lg:table-cell">المستوى</th>
                    <th className="hidden px-2 pb-1 text-center font-medium xl:table-cell">درجة الأدلة</th>
                    <th className="hidden px-2 pb-1 text-center font-medium md:table-cell">التوصية</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((l, i) => {
                    const D = DOMAIN[l.c.groupId];
                    const w = l.w;
                    return (
                      <motion.tr key={l.c.courseId} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} data-testid={`info-lead-${l.c.courseId}`}
                        className={cn("[&>td]:bg-white/[.09] [&>td:first-child]:rounded-s-xl [&>td:last-child]:rounded-e-xl", i === 0 && "[&>td]:bg-[rgba(208,167,52,.22)]")}>
                        <td className="px-2 py-2"><Medal n={i + 1} /></td>
                        <td className="px-2 py-2">
                          <p className="line-clamp-2 font-medium leading-snug" title={COURSE_LABELS[l.c.courseId] ?? l.c.label}>{COURSE_LABELS[l.c.courseId] ?? l.c.label}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-white/65">
                            {D && <span className="flex items-center gap-1"><D.icon className="h-3 w-3" />{D.short}</span>}
                            {w?.workshop.shortlisted && <Chip tone="gold">ضمن القائمة المختصرة</Chip>}
                          </p>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-white/20 lg:w-24" dir="ltr">
                              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${l.c.needIndex}%` }} transition={{ duration: 0.7, delay: 0.05 * i }} style={{ background: i === 0 ? GOLD_GRAD : "rgba(255,255,255,.85)" }} />
                            </div>
                            <b className="font-display tabular-nums">{fmt(l.c.needIndex, 0)}</b>
                          </div>
                        </td>
                        <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">{fmt(l.c.bookNowShare, 0)}%</td>
                        <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">{fmt(pct(l.c.future, l.c.shown), 0)}%</td>
                        <td className="px-2 py-2 text-center tabular-nums">{l.c.shown}</td>
                        <td className="hidden whitespace-nowrap px-2 py-2 text-center lg:table-cell">{w ? dayWord(w.workshop.days) : "—"}</td>
                        <td className="hidden px-2 py-2 text-center lg:table-cell">{w ? TIER_AR[w.workshop.tier] ?? w.workshop.tier : "—"}</td>
                        <td className="hidden px-2 py-2 text-center tabular-nums xl:table-cell">{w ? fmt(w.workshop.evidenceScore, 0) : "—"}</td>
                        <td className="hidden px-2 py-2 text-center md:table-cell">{w ? <Chip tone={w.gridCell === "confirmed_priority" ? "gold" : "white"}>{CELL_AR[w.gridCell] ?? w.gridCell}</Chip> : "—"}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-3 text-xs text-white/70">لم تُعرض ورش على مشاركي هذا المسار بعد.</p>}
          <p className="mt-2 text-[10px] text-white/60">«مهتم مستقبلاً» و«حجز فوري» نسبتان من الذين عُرضت عليهم الورشة · درجة الأدلة (0–100) من الدراسة المكتبية · التوصية من مصفوفة المطابقة على كل الردود.</p>
        </GlassPanel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <GlassPanel title="مزيج النوايا في كل مجال" sub="تجميع إجابات كل الورش المعروضة في المجال: حجز فوري · مهتم مستقبلاً · غير مهتم" className="xl:col-span-6" testId="info-mix">
          <div className="mt-3 grid gap-3">
            {mix.map((d) => (
              <div key={d.id} data-testid={`info-mix-${d.id}`}>
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="flex items-center gap-1.5 font-medium"><d.icon className="h-3.5 w-3.5 text-white/80" />{d.short}</span>
                  <span className="text-[10px] text-white/70">
                    {d.shown ? <>مؤشر مجمّع <b className="font-display text-xs tabular-nums text-white">{fmt(d.pooled ?? 0, 0)}</b> · {d.courses} ورش · {d.shown} تقييماً</> : "لم تُعرض ورش هذا المجال بعد"}
                  </span>
                </div>
                <div className="mt-1.5">
                  <GlassStack height={12} parts={[
                    { label: "حجز فوري", value: d.bookNow, color: GOLD },
                    { label: "مهتم مستقبلاً", value: d.future, color: "rgba(255,255,255,.88)" },
                    { label: "غير مهتم", value: d.notInterested, color: "rgba(255,255,255,.26)" },
                  ]} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/80">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: GOLD }} />حجز فوري</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-white/90" />مهتم مستقبلاً</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-white/25" />غير مهتم</span>
          </div>
        </GlassPanel>

        <GlassPanel title="ملخص المجالات" sub="نسبة من اختاروا المجال، وعدد الورش المعروضة فيه، ومؤشره المجمّع، ونسبة الحجز الفوري، ومجموع أيام ورشه الثلاث الأولى" className="xl:col-span-6" testId="info-domain-panel">
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] border-separate border-spacing-y-1 text-[11px]" data-testid="info-domain-table">
              <thead>
                <tr className="text-[10px] text-white/65">
                  <th className="px-2 pb-0.5 text-start font-medium">المجال</th>
                  <th className="px-2 pb-0.5 text-center font-medium">اختاروه</th>
                  <th className="px-2 pb-0.5 text-center font-medium">ورش معروضة</th>
                  <th className="px-2 pb-0.5 text-center font-medium">مؤشر مجمّع</th>
                  <th className="px-2 pb-0.5 text-center font-medium">حجز فوري</th>
                  <th className="px-2 pb-0.5 text-center font-medium">أيام الثلاث الأولى</th>
                </tr>
              </thead>
              <tbody>
                {mix.map((d) => (
                  <tr key={d.id} className="[&>td]:bg-white/[.09] [&>td:first-child]:rounded-s-lg [&>td:last-child]:rounded-e-lg">
                    <td className="px-2 py-2 font-medium"><span className="flex items-center gap-1.5"><d.icon className="h-3.5 w-3.5 text-white/75" />{d.short}</span></td>
                    <td className="px-2 py-2 text-center tabular-nums">{d.gate === null ? "—" : `${fmt(d.gate, 0)}%`}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{d.courses}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{d.shown ? <b className="font-display" style={{ color: GOLD_SOFT }}>{fmt(d.pooled ?? 0, 0)}</b> : "—"}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{d.shown ? `${fmt(pct(d.bookNow, d.shown), 0)}%` : "—"}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{d.top.length ? d.days : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-white/60">«اختاروه» نسبة من اختاروا المجال في سؤال المسارات · «مؤشر مجمّع» متوسط مؤشر الاحتياج على كل تقييمات المجال · الأيام من الكتالوج.</p>
        </GlassPanel>
      </div>
    </>
  );
}

/* =====================================================================
   Page 3 — the demanded workshops against the desk-study evidence
   ===================================================================== */
export function EvidencePage({ matching }: { matching: MatchingItem[] }) {
  const demanded = matching.filter((m) => m.fieldN > 0 && m.fieldNeed >= 50);
  const confirmed = demanded.filter((m) => m.gridCell === "confirmed_priority").length;
  const fresh = demanded.filter((m) => m.gridCell === "new_demand").length;
  const days = demanded.reduce((a, m) => a + m.workshop.days, 0);
  const top = [...matching].sort((a, b) => a.rank - b.rank).slice(0, 10);
  const facts = (demanded.length ? [...demanded].sort((a, b) => a.rank - b.rank) : top).slice(0, 3);
  const count = (keyOf: (m: MatchingItem) => string, keys: { k: string; label: string; color: string }[]) => keys.map((x) => ({ label: x.label, color: x.color, value: demanded.filter((m) => keyOf(m) === x.k).length }));
  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PosterKpi icon={BadgeCheck} label="ورشة أكد الميدان الحاجة إليها" value={String(demanded.length)} hint="احتياج ميداني 50 فأكثر من بنود الاستبانة المرتبطة بها (ورش ومهارات ومسارات)" testId="info-kpi-demanded" />
        <PosterKpi icon={Trophy} label="أولوية مؤكدة" value={String(confirmed)} hint="يلتقي فيها الطلب الميداني مع أدلة الدراسة المكتبية" testId="info-kpi-confirmed" />
        <PosterKpi icon={Sparkles} label="طلب جديد" value={String(fresh)} hint="طلب ميداني لم ترجّحه الأدلة المكتبية بعد" testId="info-kpi-new" />
        <PosterKpi icon={CalendarRange} label="يوماً تدريبياً لهذه الورش" value={String(days)} hint="مجموع مدد الكتالوج للورش المطلوبة" testId="info-kpi-demanded-days" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <GlassPanel title="الطلب الميداني مقابل الأدلة المكتبية" sub="الورش العشر الأولى بالدرجة المركبة (وزن الاحتياج 40%) · كل الردود · النقطة الذهبية من الاستبانة والبيضاء من الدراسة المكتبية" className="xl:col-span-7" testId="info-dumbbell">
          <Dumbbell rows={top} />
        </GlassPanel>
        <GlassPanel title="ملامح الورش المطلوبة" sub={`تصنيف الورش الـ${demanded.length} التي أكد الميدان الحاجة إليها بحسب الكتالوج`} className="xl:col-span-5" testId="info-donuts">
          {demanded.length ? (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <GlassDonut title="المستوى" parts={count((m) => m.workshop.tier, [{ k: "Leadership", label: "قيادي", color: GOLD }, { k: "Practitioner", label: "ممارس", color: WHITE }, { k: "Foundation", label: "تأسيسي", color: SILVER }])} testId="info-donut-tier" />
              <GlassDonut title="العرض المحلي" parts={count((m) => m.supplyAction, [{ k: "Build", label: "بناء (لا عرض محلياً)", color: GOLD }, { k: "Expand", label: "توسعة (عرض ناشئ)", color: WHITE }, { k: "Select", label: "اختيار (عرض راسخ)", color: SILVER }])} testId="info-donut-supply" />
              <GlassDonut title="القائمة المختصرة" parts={count((m) => String(m.workshop.shortlisted), [{ k: "true", label: "أكّد الميدان ترشيحها", color: GOLD }, { k: "false", label: "خارج القائمة المختصرة", color: WHITE }])} testId="info-donut-shortlist" />
            </div>
          ) : <p className="mt-3 text-xs text-white/70">لم يبلغ أي ورشة عتبة الاحتياج الميداني (50) بعد.</p>}
          <p className="mt-4 text-[10px] leading-relaxed text-white/60">«بناء» ورش لا يقدمها أحد محلياً، «توسعة» عرض محلي ناشئ، «اختيار» عرض راسخ يمكن الانتقاء منه. القائمة المختصرة: 34 ورشة رشّحتها الدراسة المكتبية قبل النزول للميدان.</p>
        </GlassPanel>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold">بطاقات الورش الثلاث الأولى</p>
        <p className="text-[11px] text-white/70">ما يقوله الكتالوج والدراسة المكتبية عن أعلى الورش في مصفوفة المطابقة</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {facts.map((m, i) => <FactCard key={m.workshop.id} m={m} i={i} />)}
        </div>
      </div>
    </>
  );
}

function Dumbbell({ rows }: { rows: MatchingItem[] }) {
  /* phones stack the track under the label; wider screens show label · track · numbers on one line */
  const cols = "grid-cols-[minmax(0,1fr)_72px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_72px]";
  return (
    <div className="mt-3">
      <div className={cn("mb-1 grid items-end gap-x-3 text-[10px] text-white/60", cols)}>
        <span>الورشة · خانة المصفوفة</span>
        <div className="hidden justify-between px-1 sm:flex" dir="ltr"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        <span className="text-center">ميداني · أدلة</span>
      </div>
      <div className="grid gap-2">
        {rows.map((r, i) => {
          const a = r.fieldNeed, b = r.workshop.evidenceScore;
          const lo = Math.min(a, b), hi = Math.max(a, b);
          return (
            <motion.div key={r.workshop.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }} className={cn("grid items-center gap-x-3 gap-y-1", cols)} data-testid={`info-dumbbell-${r.workshop.id}`}>
              <div className="order-1 flex min-w-0 items-center gap-2">
                <Medal n={r.rank} size={22} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium" title={r.workshop.titleAr}>{r.workshop.titleAr}</p>
                  <p className="truncate text-[10px] text-white/60">{CELL_AR[r.gridCell] ?? r.gridCell} · {dayWord(r.workshop.days)} · {TIER_AR[r.workshop.tier] ?? r.workshop.tier}</p>
                </div>
              </div>
              <div className="relative order-3 col-span-2 h-5 sm:order-2 sm:col-span-1" dir="ltr">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
                {[25, 50, 75].map((t) => <span key={t} className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-white/25" style={{ left: `${t}%` }} />)}
                <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/55" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/85 shadow" style={{ left: `${b}%`, background: WHITE }} title={`درجة الأدلة ${fmt(b, 0)}`} />
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow" style={{ left: `${a}%`, background: r.fieldN ? GOLD : "transparent", borderColor: GOLD_SOFT }}
                  title={r.fieldN ? `الاحتياج الميداني ${fmt(a, 0)} · n=${r.fieldN}` : "لم تُعرض في الاستبانة بعد"} />
              </div>
              <p className="order-2 text-center text-[11px] tabular-nums sm:order-3" dir="ltr"><b className="font-display" style={{ color: GOLD_SOFT }}>{r.fieldN ? fmt(a, 0) : "–"}</b> · <span>{fmt(b, 0)}</span></p>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/80">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-white/70" style={{ background: GOLD }} />الاحتياج الميداني (0–100) من الاستبانة</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-white/70 bg-white" />درجة الأدلة (0–100) من الدراسة المكتبية</span>
        <span className="text-white/55">· كلما تقاربت النقطتان عند اليمين كانت الورشة أولوية مؤكدة</span>
      </div>
    </div>
  );
}

function FactCard({ m, i }: { m: MatchingItem; i: number }) {
  const w = m.workshop;
  const facts: { icon: LucideIcon; label: string; value: string; wide?: boolean }[] = [
    { icon: Clock3, label: "المدة", value: dayWord(w.days) },
    { icon: Layers, label: "المستوى", value: TIER_AR[w.tier] ?? w.tier },
    { icon: Trophy, label: "ترتيب أفضل 50", value: w.top50Rank ? `#${w.top50Rank}` : "خارج القائمة" },
    { icon: BookOpenCheck, label: "درجة الأدلة", value: fmt(w.evidenceScore, 0) },
    { icon: TrendingUp, label: "طلب السوق", value: `${fmt(w.marketDemandPct, 0)}%` },
    { icon: Flag, label: "خطط كويتية تذكره", value: String(w.kuwaitPlansCount) },
    { icon: Store, label: "العرض المحلي", value: LOCAL_AR[w.localSupply] ?? w.localSupply, wide: true },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className={cn(glass, "flex flex-col p-4", i === 0 && "ring-1 ring-[rgba(231,213,162,.6)]")} data-testid={`info-fact-${w.id}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Medal n={m.rank} />
        <Chip tone="muted">{w.categoryLabel}</Chip>
        {w.shortlisted && <Chip tone="gold">ضمن القائمة المختصرة</Chip>}
      </div>
      <p className="font-display mt-3 text-base font-bold leading-snug">{w.titleAr}</p>
      <p className="mt-0.5 text-[11px] text-white/65" dir="ltr">{w.titleEn}</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        {facts.map((f) => (
          <div key={f.label} className={cn("flex items-center gap-2 rounded-lg bg-white/[.09] px-2 py-1.5", f.wide && "col-span-2")}>
            <f.icon className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD_SOFT }} strokeWidth={1.8} />
            <div className="min-w-0"><p className="text-[9px] text-white/60">{f.label}</p><p className="truncate font-medium" title={f.value}>{f.value}</p></div>
          </div>
        ))}
        <div className="col-span-2 flex items-center gap-2 rounded-lg bg-white/[.09] px-2 py-1.5">
          <Users2 className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD_SOFT }} strokeWidth={1.8} />
          <div className="min-w-0"><p className="text-[9px] text-white/60">الجمهور المستهدف</p><p className="mt-0.5 flex flex-wrap gap-1">{w.audience.map((a) => <Chip key={a} tone="white">{AUDIENCE_AR[a] ?? a}</Chip>)}</p></div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline justify-between text-[11px]"><span className="text-white/80">الاحتياج الميداني</span><span className="tabular-nums" dir="ltr"><b className="font-display text-sm" style={{ color: GOLD_SOFT }}>{m.fieldN ? fmt(m.fieldNeed, 0) : "–"}</b><span className="text-white/60"> · n={m.fieldN}</span></span></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20" dir="ltr">
          <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${m.fieldN ? m.fieldNeed : 0}%` }} transition={{ duration: 0.8, delay: 0.1 * i }} style={{ background: GOLD_GRAD }} />
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-2.5 text-[11px]">
        <span className="text-white/80">التوصية</span>
        <span className="flex flex-wrap gap-1">
          <Chip tone={m.gridCell === "confirmed_priority" ? "gold" : "white"}>{CELL_AR[m.gridCell] ?? m.gridCell}</Chip>
          <Chip><Hammer className="me-1 h-3 w-3" />{SUPPLY_AR[m.supplyAction] ?? m.supplyAction}</Chip>
          <Chip tone="muted">الدرجة المركبة {fmt(m.compositeScore, 0)}</Chip>
        </span>
      </div>
    </motion.div>
  );
}

/* =====================================================================
   Page 4 — which track first, how they want it delivered, and the takeaways
   ===================================================================== */
const PROFILE: { q: string; short: string; icon: LucideIcon }[] = [
  { q: "Q19", short: "أسلوب التنفيذ", icon: MonitorPlay },
  { q: "Q20", short: "المدة", icon: CalendarDays },
  { q: "Q21", short: "التوقيت", icon: Clock },
  { q: "Q22", short: "اللغة", icon: Languages },
  { q: "Q23", short: "الاعتماد", icon: Award },
  { q: "Q26", short: "عامل التميّز", icon: Sparkles },
];
const RANK_SHADES = [GOLD, GOLD_SOFT, "rgba(255,255,255,.95)", "rgba(255,255,255,.7)", "rgba(255,255,255,.45)", "rgba(255,255,255,.22)"];

export type Takeaway = { title: string; text: string };

export function FormatPage({ tracks, prefs, pathLabel, takeaways }: { tracks: TrackRankItem[]; prefs: QuestionBreakdown[]; pathLabel: string; takeaways: Takeaway[] }) {
  const byId = new Map(prefs.map((q) => [q.questionId, q]));
  const budget = byId.get("Q9");
  const podium = tracks.slice(0, 3);
  return (
    <>
      <div className="mt-6 grid gap-5 xl:grid-cols-12">
        <GlassPanel title="أي مسار أولاً في 2026/2027؟" sub={`درجة Borda (0–100) من ترتيب المشاركين للمسارات الستة · ${pathLabel}`} className="xl:col-span-6" testId="info-podium">
          {tracks.length ? (
            <>
              <div className="mt-4 grid grid-cols-3 items-end gap-2" dir="rtl">
                {[podium[1], podium[0], podium[2]].map((t, slot) => {
                  if (!t) return <div key={slot} />;
                  const place = slot === 1 ? 1 : slot === 0 ? 2 : 3;
                  const D = DOMAIN[t.trackId];
                  const h = 60 + (t.score / 100) * 90;
                  return (
                    <div key={t.trackId} className="flex flex-col items-center text-center" data-testid={`info-podium-${t.trackId}`}>
                      {D && <D.icon className="mb-1 h-5 w-5 text-white/90" strokeWidth={1.6} />}
                      <p className="line-clamp-2 min-h-[2.4em] text-[11px] font-medium leading-tight">{D?.short ?? GROUP_LABELS[t.trackId] ?? t.label}</p>
                      <motion.div initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.8, delay: 0.1 * slot }} className="mt-2 flex w-full flex-col items-center justify-start rounded-t-xl pt-2"
                        style={{ background: place === 1 ? GOLD_GRAD : place === 2 ? "linear-gradient(180deg, #F2F2EF, #C9CAC5)" : "rgba(255,255,255,.35)", color: place === 3 ? WHITE : "#2a2411" }}>
                        <Medal n={place} size={24} />
                        <p className="font-display mt-1 text-xl font-bold tabular-nums">{fmt(t.score, 0)}</p>
                        <p className="text-[9px] opacity-80">أول عند {fmt(t.firstPlaceShare, 0)}%</p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid gap-2">
                {tracks.map((t, i) => (
                  <div key={t.trackId} className="grid grid-cols-[22px_minmax(0,1fr)_minmax(0,1fr)_72px] items-center gap-2 text-[11px]" data-testid={`info-track-${t.trackId}`}>
                    <Medal n={i + 1} size={22} />
                    <p className="truncate font-medium">{DOMAIN[t.trackId]?.short ?? GROUP_LABELS[t.trackId] ?? t.label}</p>
                    <GlassStack height={10} parts={t.rankDistribution.map((v, k) => ({ label: `المركز ${k + 1}`, value: v, color: RANK_SHADES[k] ?? RANK_SHADES[5] }))} />
                    <p className="text-end leading-tight tabular-nums text-white/85"><b className="font-display text-sm">{fmt(t.score, 0)}</b><br /><span className="text-[9px] text-white/60">متوسط المركز {fmt(t.meanRank, 1)}</span></p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/70">
                <span>توزيع المراكز:</span>
                {RANK_SHADES.map((c, k) => <span key={k} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: c }} />{k + 1}</span>)}
                <span className="text-white/55">· متوسط المركز: 1 الأفضل و6 الأدنى</span>
              </div>
            </>
          ) : <p className="mt-3 text-xs text-white/70">لم يرتّب مشاركو هذا المسار المسارات بعد.</p>}
        </GlassPanel>

        <GlassPanel title="كيف يريدون الورشة؟" sub={`الخيار الأكثر اختياراً في كل بُعد من أبعاد التنفيذ · ${pathLabel}`} className="xl:col-span-6" testId="info-format">
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {PROFILE.map((p, i) => {
              const q = byId.get(p.q);
              const opts = q ? [...q.options].sort((a, b) => b.pct - a.pct).slice(0, 3) : [];
              const top = opts[0];
              return (
                <motion.div key={p.q} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }} className="flex flex-col rounded-xl border border-white/25 bg-white/[.09] p-3" data-testid={`info-format-${p.q}`}>
                  <div className="flex items-center gap-2 text-[11px] text-white/80"><p.icon className="h-4 w-4" style={{ color: GOLD_SOFT }} strokeWidth={1.7} />{p.short}</div>
                  {top && q ? (
                    <>
                      <p className="font-display mt-2 text-2xl font-bold leading-none tabular-nums">{fmt(top.pct, 0)}%</p>
                      <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug" title={optionLabel(p.q, top.key)}>{optionLabel(p.q, top.key)}</p>
                      <div className="mt-2 grid gap-1">
                        {opts.map((o, k) => (
                          <div key={o.key} className="grid grid-cols-[minmax(0,1fr)_28px] items-center gap-1.5 text-[9px] text-white/70">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/15" dir="ltr" title={optionLabel(p.q, o.key)}><div className="h-full rounded-full" style={{ width: `${o.pct}%`, background: k === 0 ? GOLD : "rgba(255,255,255,.75)" }} /></div>
                            <span className="text-end tabular-nums">{fmt(o.pct, 0)}%</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[9px] text-white/55">n={q.respondents}{p.q === "Q26" ? " · يختار كلٌّ حتى 3" : ""}</p>
                    </>
                  ) : <p className="mt-2 text-[11px] text-white/65">لا إجابات بعد</p>}
                </motion.div>
              );
            })}
          </div>
          {budget && budget.respondents > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/25 bg-white/[.09] px-3 py-2 text-[11px]" data-testid="info-budget">
              <Wallet className="h-4 w-4" style={{ color: GOLD_SOFT }} />
              <span className="font-medium">ميزانية التدريب لدى المؤسسات</span>
              {[...budget.options].sort((a, b) => b.pct - a.pct).map((o) => <Chip key={o.key} tone={o === budget.options[0] ? "gold" : "white"}>{optionLabel("Q9", o.key)} {fmt(o.pct, 0)}%</Chip>)}
              <span className="text-[9px] text-white/55">n={budget.respondents}</span>
            </div>
          )}
        </GlassPanel>
      </div>

      <div className="mt-5" data-testid="info-takeaways">
        <p className="text-sm font-semibold">الخلاصة في أربع نقاط</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {takeaways.map((t, i) => (
            <motion.div key={t.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className={cn(glass, "relative overflow-hidden p-4")}>
              <span className="font-display absolute -end-1 -top-3 text-6xl font-bold leading-none tabular-nums" style={{ color: "rgba(231,213,162,.18)" }}>{i + 1}</span>
              <p className="font-display text-sm font-bold" style={{ color: GOLD_SOFT }}>{t.title}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/90">{t.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

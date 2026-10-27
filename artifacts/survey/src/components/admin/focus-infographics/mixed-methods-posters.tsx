import { useMemo, useState } from "react";
import { RefreshCw, AlertTriangle, Layers, Scale } from "lucide-react";
import {
  useGetMixedMethods, getGetMixedMethodsQueryKey,
  type FocusGroupSource, type GetMixedMethodsParams, type MixedMethodsReport, type MixedDomain, type MixedCourse, type MixedAlignmentCode,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Poster, GlassCite } from "./common";
import "./mm.css";

type Scope = "all" | "B2B" | "B2C";
type Tier = "Foundation" | "Practitioner" | "Leadership";
const TIERS: Tier[] = ["Foundation", "Practitioner", "Leadership"];

export const ALIGN: Record<MixedAlignmentCode, { color: string; short: string }> = {
  convergent: { color: "hsl(178 52% 56%)", short: "تقارب" },
  divergent: { color: "hsl(14 70% 64%)", short: "تباين" },
  quantitative_only: { color: "hsl(206 45% 74%)", short: "كمي فقط" },
  limited: { color: "hsl(38 72% 62%)", short: "عيّنة محدودة" },
  unobserved: { color: "hsl(40 15% 60%)", short: "غير مرصود" },
};

const f1 = (v: number | null | undefined) => (v == null ? "—" : (Math.round(v * 10) / 10).toString());
const pct = (v: number | null | undefined) => (v == null ? "—" : `${f1(v)}%`);
const scopeLabel = (scope: Scope) => scope === "all" ? "جميع المستجيبين" : scope === "B2B" ? "المؤسسات (B2B)" : "الأفراد (B2C)";
const directGroups = (d: MixedDomain) => Array.from(new Set(d.evidenceLinks.filter((l) => l.relation === "direct").flatMap((l) => l.explicitGroupIds)));
const linkIds = (d: MixedDomain) => Array.from(new Set(d.evidenceLinks.flatMap((l) => l.evidenceIds)));

export function MixedMethodsPosters({ groups }: { groups: FocusGroupSource[] }) {
  const [scope, setScope] = useState<Scope>("all");
  const params: GetMixedMethodsParams | undefined = scope === "all" ? undefined : { path: scope };
  const q = useGetMixedMethods(params, { query: { queryKey: getGetMixedMethodsQueryKey(params), staleTime: 60000, placeholderData: (prev) => prev } });
  const r = q.data;
  const stale = q.isFetching && !!r && r.scope !== scope;
  const pill = "rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38_72%_60%)]";

  const controls = (
    <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden" data-testid="mm-controls">
      <span className="fi-muted text-xs">نطاق الاستبانة:</span>
      <div role="group" aria-label="نطاق الاستبانة" className="fi-glass inline-flex rounded-full p-0.5">
        {(["all", "B2B", "B2C"] as Scope[]).map((s) => (
          <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)} data-testid={`button-mm-scope-${s}`}
            className={cn(pill, scope === s ? "bg-[hsl(38_72%_58%)] text-[hsl(206_62%_12%)]" : "hover:bg-[hsl(40_40%_96%/.12)]")}>
            {s === "all" ? "الكل" : <bdi dir="ltr">{s}</bdi>}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => q.refetch()} disabled={q.isFetching} data-testid="button-mm-refresh"
        className={cn(pill, "fi-glass inline-flex items-center gap-1.5 disabled:opacity-60")}>
        <RefreshCw className={cn("h-3.5 w-3.5", q.isFetching && "animate-spin motion-reduce:animate-none")} />تحديث الأرقام
      </button>
      <span className="fi-muted text-[11px]" aria-live="polite" data-testid="status-mm">
        {q.isFetching ? "جارٍ تحديث البيانات الكمية…" : r ? <>محدَّث <bdi dir="ltr">{r.generatedAt.slice(0, 16).replace("T", " ")} UTC</bdi></> : ""}
      </span>
      <p className="fi-muted basis-full text-[11px]">الفلتر يغيّر أرقام الاستبانة فقط؛ العيّنة النوعية تبقى المجموعات الثلاث كاملة.</p>
    </div>
  );

  const body = q.isLoading && !r ? (
    <div className="grid gap-3" aria-busy="true" data-testid="mm-loading">
      <div className="h-40 animate-pulse rounded-2xl bg-[hsl(40_40%_96%/.1)]" /><div className="h-64 animate-pulse rounded-2xl bg-[hsl(40_40%_96%/.08)]" />
    </div>
  ) : q.isError && !r ? (
    <div className="fi-glass flex flex-col items-center rounded-2xl p-8 text-center" data-testid="mm-error">
      <AlertTriangle className="h-7 w-7 text-[hsl(14_70%_64%)]" />
      <p className="mt-2 font-semibold">تعذّر تحميل التحليل المدمج</p>
      <p className="fi-muted mt-1 text-xs">المحتوى النوعي أعلاه ما زال متاحاً.</p>
      <button type="button" onClick={() => q.refetch()} data-testid="button-mm-retry" className={cn(pill, "mt-3 bg-[hsl(38_72%_58%)] text-[hsl(206_62%_12%)]")}>إعادة المحاولة</button>
    </div>
  ) : null;

  return (
    <>
      <Poster id="agreement" bg="infographic-backdrop.jpg" kicker="الاستبانة × المجموعات البؤرية · المجالات الستة"
        title="أين يلتقي الطلب الكمي بالدليل النوعي؟"
        lead="كل دائرة مجال تدريبي: القوس الذهبي مؤشر الاحتياج (موزون بالتقييمات)، والقوس الفيروزي نسبة المهتمين من المُقيِّمين. النقاط الثلاث هي المجموعات البؤرية — حضور صريح، لا نسبة.">
        {controls}
        {body ?? (r && <div className={cn(stale && "mm-stale")} data-testid="mm-agreement"><Agreement r={r} groups={groups} /></div>)}
        {q.isError && r && <p className="mt-3 text-xs text-[hsl(14_70%_70%)]" role="alert">فشل التحديث الأخير؛ تُعرض آخر أرقام متاحة. <button type="button" className="underline" onClick={() => q.refetch()} data-testid="button-mm-retry-inline">إعادة المحاولة</button></p>}
      </Poster>
      {r && (
        <Poster id="levels" bg="pathways-skyline.jpg" kicker="من المجال إلى المستوى التدريبي"
          title="المجالات الستة على ثلاثة مستويات"
          lead="المستويات تصنيف مبدئي لدورات الكتالوج المرتبطة أساساً بعناصر الاستبانة — ليست مستوى مهارة المستجيب ولا مستواه الوظيفي.">
          <div className={cn(stale && "mm-stale")}><Levels r={r} /></div>
        </Poster>
      )}
      {r && (
        <Poster id="blindspots" bg="infographic-backdrop.jpg" kicker="حدود القراءة" title="ما لا يستطيع أيّ من المصدرين قوله وحده">
          <BlindSpots r={r} />
        </Poster>
      )}
    </>
  );
}

function Ring({ need, interest, size = 120 }: { need: number | null; interest: number | null; size?: number }) {
  const R1 = 52, R2 = 42, c1 = 2 * Math.PI * R1, c2 = 2 * Math.PI * R2;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden className="-rotate-90">
      <circle cx="60" cy="60" r={R1} strokeWidth="7" className="mm-ring-track" />
      <circle cx="60" cy="60" r={R2} strokeWidth="5" className="mm-ring-track" />
      {need != null && <circle cx="60" cy="60" r={R1} strokeWidth="7" className="mm-ring-need" strokeDasharray={`${(need / 100) * c1} ${c1}`} />}
      {interest != null && <circle cx="60" cy="60" r={R2} strokeWidth="5" className="mm-ring-int" strokeDasharray={`${(interest / 100) * c2} ${c2}`} />}
      <line x1="2" y1="60" x2="14" y2="60" stroke="hsl(40 40% 96% / .8)" strokeWidth="1.2" />
    </svg>
  );
}

function Agreement({ r, groups }: { r: MixedMethodsReport; groups: FocusGroupSource[] }) {
  const [sel, setSel] = useState(r.domains[0]?.groupId ?? "");
  const d = r.domains.find((x) => x.groupId === sel) ?? r.domains[0];
  const counts = useMemo(() => {
    const m = new Map<MixedAlignmentCode, number>();
    r.domains.forEach((x) => m.set(x.alignment.code, (m.get(x.alignment.code) ?? 0) + 1));
    return m;
  }, [r.domains]);
  const gLabel = (id: string) => groups.find((g) => g.id === id)?.label ?? id;
  return (
    <div className="grid gap-6">
      <p className="fi-muted text-xs" data-testid="mm-displayed-scope">نطاق الأرقام المعروضة: <b>{scopeLabel(r.scope)}</b> · المجموعات النوعية مستقلة وثابتة. علامة القوس الذهبي عند 50 نقطة؛ لا تنطبق على نسبة المهتمين.</p>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[hsl(40_40%_96%/.15)] sm:grid-cols-4">
        {[
          { k: "respondents", v: r.respondents, l: "ردود مكتملة في النطاق" },
          { k: "gate", v: r.gateRespondents, l: "أجابوا اختيار المجالات (Q25G)" },
          { k: "rank", v: r.rankRespondents, l: "ترتيب أولويات صالح (Q24)" },
          { k: "groups", v: r.qualitativeGroups, l: "مجموعات بؤرية (نوعي)" },
        ].map((s) => (
          <div key={s.k} className="bg-[hsl(206_62%_12%/.6)] p-4" data-testid={`stat-mm-${s.k}`}>
            <dd className="font-display text-3xl font-bold tabular-nums text-[hsl(38_80%_70%)]">{s.v}</dd>
            <dt className="fi-muted text-xs">{s.l}</dt>
          </div>
        ))}
      </dl>
      {r.excludedRankingRespondents > 0 && <p className="fi-muted -mt-3 text-[11px]">استُبعد <bdi className="tabular-nums">{r.excludedRankingRespondents}</bdi> ترتيباً لا يطابق المجالات الحالية G1–G6، دون إعادة تعيين.</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 mm-screen-only" role="group" aria-label="اختر مجالاً">
        {r.domains.map((x) => {
          const a = ALIGN[x.alignment.code];
          const dg = directGroups(x);
          return (
            <button key={x.groupId} type="button" aria-pressed={x.groupId === d?.groupId} onClick={() => setSel(x.groupId)} data-testid={`button-mm-domain-${x.groupId}`}
              className="mm-orb fi-glass flex min-w-0 flex-col items-center rounded-3xl p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38_72%_60%)]">
              <div className="relative">
                <Ring need={x.demand.needIndex} interest={x.demand.interestShare} size={104} />
                <div className="absolute inset-0 grid place-items-center">
                  <div><p className="font-display text-xl font-bold tabular-nums text-[hsl(38_80%_72%)]">{f1(x.demand.needIndex)}</p><p className="fi-muted text-[9px]">مؤشر الاحتياج</p></div>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">{x.label}</p>
              <div className="mt-1.5 flex items-center gap-1" aria-label={`دليل صريح مباشر في ${dg.length} من ${groups.length} مجموعات`}>
                {groups.map((g) => <span key={g.id} className="h-2.5 w-2.5 rounded-full border border-[hsl(40_40%_96%/.6)]" style={{ background: dg.includes(g.id) ? "hsl(40 40% 96%)" : "transparent" }} />)}
              </div>
              <span className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-[hsl(206_62%_12%)]" style={{ background: a.color }} data-testid={`status-mm-align-${x.groupId}`}>{x.alignment.label}</span>
            </button>
          );
        })}
      </div>

      {d && <div className="mm-screen-only"><DomainDetail d={d} gLabel={gLabel} total={groups.length} /></div>}

      <Rules r={r} counts={counts} />

      <div className="mm-print-only" data-testid="mm-print-domains">
        <h3 className="mb-2 text-lg font-bold">تفاصيل المجالات الستة (نسخة الطباعة)</h3>
        <div className="grid gap-3">{r.domains.map((x) => <DomainDetail key={x.groupId} d={x} gLabel={gLabel} total={groups.length} />)}</div>
      </div>
    </div>
  );
}

function Metric({ k, v, l, hint }: { k: string; v: string; l: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[hsl(206_62%_10%/.45)] p-3" data-testid={`text-mm-${k}`}>
      <p className="font-display text-xl font-bold tabular-nums text-[hsl(38_80%_72%)]"><bdi>{v}</bdi></p>
      <p className="text-[11px] font-semibold">{l}</p>
      {hint && <p className="fi-muted mt-0.5 text-[10px] leading-snug">{hint}</p>}
    </div>
  );
}

function DomainDetail({ d, gLabel, total }: { d: MixedDomain; gLabel: (id: string) => string; total: number }) {
  const a = ALIGN[d.alignment.code];
  const dm = d.demand;
  const dg = directGroups(d);
  return (
    <article className="fi-glass rounded-3xl p-5" data-testid={`panel-mm-domain-${d.groupId}`} aria-live="polite">
      <header className="flex flex-wrap items-center gap-2 border-b border-[hsl(40_40%_96%/.15)] pb-3">
        <bdi dir="ltr" className="font-mono text-xs text-[hsl(38_80%_72%)]">{d.groupId}</bdi>
        <h3 className="text-lg font-bold">{d.label}</h3>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[hsl(206_62%_12%)]" style={{ background: a.color }}>{d.alignment.label}</span>
        <GlassCite ids={linkIds(d)} title={`دليل مجال ${d.label}`} note="مقتطفات الربط التحليلي بين المجال ومحاور المجموعات البؤرية (مباشر وذو صلة)." className="ms-auto" />
      </header>
      <p className="fi-muted mt-2 text-xs leading-relaxed">{d.alignment.explanation}</p>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <section aria-label="الجانب الكمي">
          <p className="fi-kicker mb-2">الاستبانة · كمي</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric k={`need-${d.groupId}`} v={f1(dm.needIndex)} l="مؤشر الاحتياج 0–100" hint={`موزون بـ${dm.ratingCount} تقييماً (0/1/2)`} />
            <Metric k={`interest-${d.groupId}`} v={pct(dm.interestShare)} l="نسبة المهتمين" hint={`${dm.interestedRespondents} من ${dm.evaluatedRespondents} مُقيِّماً`} />
            <Metric k={`book-${d.groupId}`} v={pct(dm.bookNowShare)} l="نيّة حجز فوري" hint={`${dm.bookNowRespondents} مستجيباً · نيّة لا حجز مدفوع`} />
            <Metric k={`select-${d.groupId}`} v={pct(d.selectionShare)} l="اختيار المجال Q25G" hint={`${d.selected} من ${d.selectionRespondents}`} />
            <Metric k={`priority-${d.groupId}`} v={f1(d.priorityScore)} l="درجة الأولوية Q24" hint={`متوسط الرتبة ${f1(d.meanRank)} · ${d.rankRespondents} مرتِّباً`} />
            <Metric k={`courses-${d.groupId}`} v={`${dm.evaluatedCourses}/${dm.courseCount}`} l="دورات قُيِّمت" />
          </div>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[hsl(40_40%_96%/.1)]" role="img"
            aria-label={`توزيع ${dm.ratingCount} تقييماً: ${dm.notInterestedRatings} غير مهتم، ${dm.futureRatings} مستقبلاً، ${dm.bookNowRatings} حجز الآن`}>
            {dm.ratingCount > 0 && <>
              <span style={{ width: `${(dm.notInterestedRatings / dm.ratingCount) * 100}%`, background: "hsl(206 30% 45%)" }} />
              <span style={{ width: `${(dm.futureRatings / dm.ratingCount) * 100}%`, background: "hsl(178 52% 50%)" }} />
              <span style={{ width: `${(dm.bookNowRatings / dm.ratingCount) * 100}%`, background: "hsl(38 78% 60%)" }} />
            </>}
          </div>
          <p className="fi-muted mt-1 text-[10px]">تقييمات: غير مهتم <bdi className="tabular-nums">{dm.notInterestedRatings}</bdi> · مستقبلاً <bdi className="tabular-nums">{dm.futureRatings}</bdi> · حجز الآن <bdi className="tabular-nums">{dm.bookNowRatings}</bdi></p>
          <Courses list={d.topCourses} id={d.groupId} />
        </section>
        <section aria-label="الجانب النوعي">
          <p className="fi-kicker mb-2">المجموعات البؤرية · نوعي</p>
          <p className="text-xs">حضور صريح مباشر في <bdi className="tabular-nums font-bold">{dg.length}</bdi> من <bdi className="tabular-nums">{total}</bdi> مجموعات{dg.length ? `: ${dg.map(gLabel).join("، ")}` : ""}.</p>
          <ul className="mt-3 grid gap-2">
            {d.evidenceLinks.map((l) => (
              <li key={l.themeId + l.relation} className="rounded-xl border border-[hsl(40_40%_96%/.15)] p-3" data-testid={`link-mm-${d.groupId}-${l.themeId}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", l.relation === "direct" ? "bg-[hsl(40_40%_96%)] text-[hsl(206_62%_12%)]" : "border border-dashed border-[hsl(40_40%_96%/.6)]")}>{l.relation === "direct" ? "ربط مباشر" : "ذو صلة"}</span>
                  <span className="text-sm font-semibold">{l.title}</span>
                  <GlassCite ids={l.evidenceIds} title={l.title} className="ms-auto" />
                </div>
                <p className="fi-muted mt-1 text-xs leading-relaxed">{l.note}</p>
                {l.explicitGroupIds.length > 0 && <p className="mt-1 text-[10px]">صريح لدى: {l.explicitGroupIds.map(gLabel).join("، ")}</p>}
              </li>
            ))}
            {d.evidenceLinks.length === 0 && <li className="fi-muted rounded-xl border border-dashed border-[hsl(40_40%_96%/.25)] p-3 text-xs">لا ربط نوعي مُراجَع لهذا المجال.</li>}
          </ul>
        </section>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[{ k: "interp", t: "القراءة", v: d.interpretation }, { k: "caveat", t: "تحفّظ", v: d.caveat }, { k: "design", t: "أثره على التصميم", v: d.designImplication }].map((s) => (
          <div key={s.k} className={cn("rounded-2xl p-3", s.k === "design" ? "bg-[hsl(38_72%_55%/.16)]" : "bg-[hsl(206_62%_10%/.4)]")} data-testid={`text-mm-${s.k}-${d.groupId}`}>
            <p className="text-[11px] font-bold text-[hsl(38_80%_74%)]">{s.t}</p>
            <p className="mt-1 text-xs leading-relaxed">{s.v}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Courses({ list, id }: { list: MixedCourse[]; id: string }) {
  if (!list.length) return <p className="fi-muted mt-3 text-[11px]">لا دورات بتقييم اهتمام في هذا النطاق.</p>;
  return (
    <div className="mt-3">
      <p className="fi-muted text-[10px]">حتى 3 أمثلة مرتبة بمؤشر الرغبة (0–100)، لا عروض مؤكدة؛ يُحسم التعادل للعرض فقط:</p>
      <ol className="mt-1 grid gap-1">
        {list.map((c) => (
          <li key={c.courseId} className="flex items-center gap-2 text-xs" data-testid={`text-mm-course-${id}-${c.courseId}`}>
            <span className="min-w-0 flex-1 leading-relaxed">{c.label}</span>
            <span className="fi-muted shrink-0 text-[10px]"><bdi className="tabular-nums">{c.interested}/{c.shown}</bdi> مهتم</span>
            <span className="w-10 shrink-0 text-left font-bold tabular-nums text-[hsl(38_80%_72%)]">{f1(c.needIndex)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Rules({ r, counts }: { r: MixedMethodsReport; counts: Map<MixedAlignmentCode, number> }) {
  const n = r.lowSampleThreshold, t = r.convergenceThreshold;
  const rules: { c: MixedAlignmentCode; rule: string }[] = [
    { c: "unobserved", rule: "لا يوجد أي مُقيِّم في المجال (n = 0)." },
    { c: "limited", rule: `عدد المُقيِّمين أقل من ${n}.` },
    { c: "quantitative_only", rule: "لا دليل صريح على ربط مباشر من المجموعات البؤرية." },
    { c: "convergent", rule: `n ≥ ${n} + دليل صريح مباشر + مؤشر الاحتياج ≥ ${t}.` },
    { c: "divergent", rule: `n ≥ ${n} + دليل صريح مباشر + مؤشر الاحتياج أقل من ${t}.` },
  ];
  return (
    <section className="rounded-2xl border border-[hsl(40_40%_96%/.18)] p-4" aria-labelledby="mm-rules-t" data-testid="mm-rules">
      <h3 id="mm-rules-t" className="flex items-center gap-2 text-sm font-bold"><Scale className="h-4 w-4 text-[hsl(38_80%_72%)]" />قواعد التصنيف — تُطبَّق بالترتيب</h3>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {rules.map((x, i) => (
          <li key={x.c} className="rounded-xl bg-[hsl(206_62%_10%/.4)] p-3" data-testid={`rule-mm-${x.c}`}>
            <div className="flex items-center gap-2"><span className="tabular-nums fi-muted text-[10px]">{i + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: ALIGN[x.c].color }} /><span className="text-xs font-bold">{ALIGN[x.c].short}</span>
              <span className="ms-auto text-[10px] tabular-nums fi-muted">{counts.get(x.c) ?? 0} مجال</span></div>
            <p className="mt-1 text-[11px] leading-relaxed">{x.rule}</p>
          </li>
        ))}
      </ol>
      <p className="fi-muted mt-3 text-[11px] leading-relaxed">عتبات وصفية اختارها المحللون — ليست اختبار دلالة إحصائية ولا "نسبة اتفاق" ولا تحققاً من السوق. عدد المجموعات البؤرية لا يُحوَّل إلى نسبة ولا يُجمع مع أرقام الاستبانة. مؤشر الاحتياج يوزن بالتقييمات، أما نسبة المهتمين فهي أشخاص فريدون من المُقيِّمين.</p>
    </section>
  );
}

function Levels({ r }: { r: MixedMethodsReport }) {
  const [sel, setSel] = useState<{ g: string; t: Tier }>({ g: r.domains[0]?.groupId ?? "", t: "Foundation" });
  const dom = r.domains.find((d) => d.groupId === sel.g);
  const cell = dom?.levels.find((c) => c.tier === sel.t);
  const lvl = (t: Tier) => r.levels.find((l) => l.tier === t);
  return (
    <div className="grid gap-6">
      <p className="fi-muted text-xs">نطاق الأرقام المعروضة: <b>{scopeLabel(r.scope)}</b>. قد يظهر المستجيب في أكثر من مستوى؛ لا تجمع أعداد الأشخاص. القراءة النوعية للمستوى مقترح تصميمي، لا نسبة تأييد.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {TIERS.map((t, i) => {
          const l = lvl(t);
          if (!l) return null;
          return (
            <article key={t} className="fi-glass relative rounded-3xl p-4" data-testid={`card-mm-level-${t}`}>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full border border-[hsl(38_72%_60%)] font-display text-xs tabular-nums text-[hsl(38_80%_74%)]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-base font-bold">{l.label}</h3>
                <bdi dir="ltr" className="fi-muted text-[10px]">{t}</bdi>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Ring need={l.demand.needIndex} interest={l.demand.interestShare} size={64} />
                <div className="text-xs">
                  <p>احتياج <b className="tabular-nums text-[hsl(38_80%_72%)]">{f1(l.demand.needIndex)}</b> · مهتمون <b className="tabular-nums text-[hsl(178_52%_66%)]">{pct(l.demand.interestShare)}</b></p>
                  <p className="fi-muted text-[10px]">{l.demand.evaluatedRespondents} مُقيِّماً · {l.demand.ratingCount} تقييماً · {l.demand.courseCount} دورة</p>
                  {l.demand.evaluatedRespondents > 0 && l.demand.evaluatedRespondents < r.lowSampleThreshold && <p className="mt-1 text-[10px] text-[hsl(38_80%_74%)]">عيّنة محدودة — للاستئناس</p>}
                </div>
              </div>
              <dl className="mt-3 grid gap-2 text-xs leading-relaxed">
                <div><dt className="font-bold text-[hsl(38_80%_74%)]">الغرض</dt><dd>{l.purpose}</dd></div>
                <div><dt className="font-bold text-[hsl(38_80%_74%)]">القراءة النوعية</dt><dd>{l.qualitativeInterpretation}</dd></div>
                <div><dt className="font-bold text-[hsl(38_80%_74%)]">المخرج المقترح</dt><dd>{l.proposedOutcome}</dd></div>
              </dl>
              <GlassCite ids={l.evidenceIds} title={`دليل مستوى ${l.label}`} className="mt-3" />
            </article>
          );
        })}
      </div>

      <div className="min-w-0 overflow-x-auto mm-screen-only">
        <table className="w-full min-w-[560px] border-separate border-spacing-1.5 text-xs" data-testid="table-mm-levels">
          <caption className="fi-muted mb-2 text-start text-[11px]">اختر خلية لاستعراض تفاصيلها. التدرّج الذهبي والشريط = مؤشر الرغبة من 0 إلى 100؛ "—" تعني لا تقييمات، لا صفر اهتمام. يمكن تمرير الجدول أفقياً على الهاتف.</caption>
          <thead><tr><th className="text-start font-semibold">المجال</th>{TIERS.map((t) => <th key={t} className="font-semibold">{lvl(t)?.label ?? t}</th>)}</tr></thead>
          <tbody>
            {r.domains.map((d) => (
              <tr key={d.groupId}>
                <th scope="row" className="max-w-[180px] text-start font-semibold leading-snug">{d.label}</th>
                {TIERS.map((t) => {
                  const c = d.levels.find((x) => x.tier === t);
                  const on = sel.g === d.groupId && sel.t === t;
                  const nd = c?.demand.needIndex ?? null;
                  return (
                    <td key={t} className="p-0">
                      <button type="button" aria-pressed={on} onClick={() => setSel({ g: d.groupId, t })} data-testid={`button-mm-cell-${d.groupId}-${t}`}
                        style={{ backgroundColor: nd === null ? "transparent" : `hsl(38 78% 60% / ${0.04 + nd / 100 * 0.25})` }}
                        aria-label={`${d.label} · ${lvl(t)?.label ?? t}: احتياج ${f1(nd)}، ${c?.demand.evaluatedRespondents ?? 0} مُقيِّماً، ${c?.demand.courseCount ?? 0} دورة`}
                        className={cn("mm-cell w-full rounded-xl border border-[hsl(40_40%_96%/.15)] p-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38_72%_60%)]", c?.demand.courseCount === 0 && "border-dashed")}>
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-display text-base font-bold tabular-nums text-[hsl(38_80%_72%)]">{f1(nd)}</span>
                          <span className="fi-muted text-[10px] tabular-nums">n={c?.demand.evaluatedRespondents ?? 0}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[hsl(40_40%_96%/.1)]">
                          <div className="mm-bar h-full bg-[hsl(38_78%_60%)]" style={{ transform: `scaleX(${(nd ?? 0) / 100})` }} />
                        </div>
                        <p className="fi-muted mt-1 text-[10px]">{c?.demand.courseCount ? `${c.demand.courseCount} دورة` : "لا دورات مصنّفة"}</p>
                        {!!c && c.demand.evaluatedRespondents > 0 && c.demand.evaluatedRespondents < r.lowSampleThreshold && <p className="mt-0.5 text-[10px] text-[hsl(38_80%_74%)]">للاستئناس</p>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dom && cell && (
        <article className="fi-glass rounded-3xl p-5 mm-screen-only" aria-live="polite" data-testid="panel-mm-cell">
          <header className="flex flex-wrap items-center gap-2"><Layers className="h-4 w-4 text-[hsl(38_80%_72%)]" />
            <h3 className="font-bold">{dom.label} · {cell.label}</h3></header>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric k="cell-need" v={f1(cell.demand.needIndex)} l="مؤشر الاحتياج" hint={`${cell.demand.ratingCount} تقييماً`} />
            <Metric k="cell-interest" v={pct(cell.demand.interestShare)} l="نسبة المهتمين" hint={`${cell.demand.interestedRespondents} من ${cell.demand.evaluatedRespondents}`} />
            <Metric k="cell-book" v={pct(cell.demand.bookNowShare)} l="نيّة حجز فوري" hint={`${cell.demand.bookNowRespondents} مستجيباً`} />
            <Metric k="cell-courses" v={`${cell.demand.evaluatedCourses}/${cell.demand.courseCount}`} l="دورات قُيِّمت" />
          </div>
          {cell.demand.courseCount === 0 ? <p className="fi-muted mt-3 text-xs">لا توجد دورات أساسية مصنّفة في هذا المستوى ضمن المجال — فجوة في الكتالوج لا دليل على غياب الحاجة.</p> : <Courses list={cell.topCourses} id={`${dom.groupId}-${cell.tier}`} />}
          {cell.demand.evaluatedRespondents > 0 && cell.demand.evaluatedRespondents < r.lowSampleThreshold && <p className="mt-3 text-xs text-[hsl(38_80%_74%)]">عدد المقيّمين أقل من {r.lowSampleThreshold}؛ هذه الخلية للاستئناس فقط.</p>}
          {cell.demand.courseCount > 0 && <div className="mt-4 grid gap-3 border-t border-[hsl(40_40%_96%/.18)] pt-4 sm:grid-cols-2">
            <div><h4 className="text-xs font-bold text-[hsl(38_80%_74%)]">كيف يفسّر النوعي احتياج المجال؟</h4><p className="fi-muted mt-1 text-xs leading-relaxed">{dom.interpretation}</p><GlassCite ids={linkIds(dom)} title={`شواهد ${dom.label}`} className="mt-2" /></div>
            <div><h4 className="text-xs font-bold text-[hsl(38_80%_74%)]">كيف نترجمه إلى مستوى {cell.label}؟</h4><p className="fi-muted mt-1 text-xs leading-relaxed">{lvl(cell.tier)?.proposedOutcome}</p><p className="fi-muted mt-2 text-[10px]">تركيب تحليلي مقترح، لا قياس نوعي مستقل لهذه الخلية ولا ضمان لفعالية البرنامج.</p></div>
          </div>}
        </article>
      )}
      {r.unclassifiedCourseCount > 0 && <p className="fi-muted text-[11px]"><bdi className="tabular-nums">{r.unclassifiedCourseCount}</bdi> دورة بلا تصنيف مستوى في الكتالوج ولا تظهر في المصفوفة.</p>}

      <div className="mm-print-only" data-testid="mm-print-levels">
        <table className="w-full text-[10px]">
          <thead><tr><th className="text-start">المجال</th><th className="text-start">المستوى</th><th>احتياج</th><th>مهتمون</th><th>حجز</th><th>n</th><th>دورات</th><th className="text-start">أعلى الدورات</th></tr></thead>
          <tbody>{r.domains.flatMap((d) => d.levels.map((c) => (
            <tr key={d.groupId + c.tier} className="border-t border-[hsl(40_40%_96%/.2)]">
              <td>{d.label}</td><td>{c.label}</td><td className="text-center">{f1(c.demand.needIndex)}</td><td className="text-center">{pct(c.demand.interestShare)}</td>
              <td className="text-center">{pct(c.demand.bookNowShare)}</td><td className="text-center">{c.demand.evaluatedRespondents}</td><td className="text-center">{c.demand.evaluatedCourses}/{c.demand.courseCount}</td>
              <td>{c.topCourses.map((x) => `${x.label} (${f1(x.needIndex)})`).join("؛ ") || "—"}</td>
            </tr>)))}</tbody>
        </table>
      </div>
    </div>
  );
}

function BlindSpots({ r }: { r: MixedMethodsReport }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ol className="grid gap-3">
        {r.blindSpots.map((b, i) => (
          <li key={b.title} className="fi-glass rounded-2xl p-4" data-testid={`card-mm-blindspot-${i}`}>
            <div className="flex flex-wrap items-center gap-2"><span className="fi-pulse h-2 w-2 rounded-full bg-[hsl(14_70%_64%)]" aria-hidden /><h3 className="text-sm font-bold">{b.title}</h3>
              <GlassCite ids={b.evidenceIds} title={b.title} className="ms-auto" /></div>
            <p className="mt-1 text-xs leading-relaxed">{b.explanation}</p>
          </li>
        ))}
        {!r.blindSpots.length && <li className="fi-muted text-xs">لا نقاط عمياء مُسجّلة.</li>}
      </ol>
      <section className="rounded-2xl border border-[hsl(40_40%_96%/.18)] p-4" data-testid="mm-methodology">
        <h3 className="text-sm font-bold">المنهجية</h3>
        <ul className="mt-2 grid list-disc gap-1.5 ps-5 text-xs leading-relaxed">{r.methodology.map((m) => <li key={m}>{m}</li>)}</ul>
        <p className="fi-muted mt-3 text-[11px]">النطاق: {scopeLabel(r.scope)} · تاريخ التحليل النوعي <bdi dir="ltr">{r.qualitativeAnalysisDate}</bdi></p>
      </section>
    </div>
  );
}

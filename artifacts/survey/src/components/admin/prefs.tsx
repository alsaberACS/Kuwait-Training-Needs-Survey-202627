import { MonitorPlay, CalendarDays, Clock, Languages, Award, Sparkles } from "lucide-react";
import { useGetPreferences, getGetPreferencesQueryKey, type SurveyPath, type QuestionBreakdown } from "@workspace/api-client-react";
import { QUESTION_LABELS, optionLabel } from "@/lib/survey-definition";
import { cn } from "@/lib/utils";
import { fmt, C, Panel, Skel, Err, Empty, HBars, Reveal } from "./shared";
import { Donut } from "./charts";

const PROFILE: { q: string; short: string; icon: typeof Clock }[] = [
  { q: "Q19", short: "أسلوب التنفيذ", icon: MonitorPlay },
  { q: "Q20", short: "المدة", icon: CalendarDays },
  { q: "Q21", short: "التوقيت", icon: Clock },
  { q: "Q22", short: "اللغة", icon: Languages },
  { q: "Q23", short: "الاعتماد", icon: Award },
  { q: "Q26", short: "عامل التميّز", icon: Sparkles },
];
const SECTIONS: { title: string; sub: string; ids: string[] }[] = [
  { title: "تفضيلات التنفيذ", sub: "كيف وأين ومتى وبأي لغة واعتماد", ids: ["Q19", "Q20", "Q21", "Q22", "Q23", "Q26"] },
  { title: "المؤسسات (B2B)", sub: "الميزانية والحلول المؤسسية وقياس العائد", ids: ["Q8", "Q9", "Q10", "Q11"] },
  { title: "الأفراد (B2C) والمسارات", sub: "برامج الشباب والمسارات التي تهم المشارك", ids: ["Q15", "Q25G"] },
  { title: "الملف الديموغرافي", sub: "للمرجعية؛ التفصيل في «نظرة عامة»", ids: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7"] },
];
const DONUT_QS = new Set(["Q22", "Q23", "Q9", "Q7"]);
const label = (x: QuestionBreakdown, key: string, fallback: string) => (optionLabel(x.questionId, key) === key ? fallback : optionLabel(x.questionId, key));

type PrefQ = { options: { key: string; pct: number }[] };
/** Largest percentage-point difference between the two paths across the question's options. */
const maxDiff = (a: PrefQ, b: PrefQ, keys: string[]) =>
  Math.max(0, ...keys.map((k) => Math.abs((a.options.find((o) => o.key === k)?.pct ?? 0) - (b.options.find((o) => o.key === k)?.pct ?? 0))));

export function Prefs({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetPreferences(params, { query: { queryKey: getGetPreferencesQueryKey(params) } });
  const b2b = useGetPreferences({ path: "B2B" }, { query: { queryKey: getGetPreferencesQueryKey({ path: "B2B" }), enabled: !path } });
  const b2c = useGetPreferences({ path: "B2C" }, { query: { queryKey: getGetPreferencesQueryKey({ path: "B2C" }), enabled: !path } });
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const qs = q.data.questions;
  if (!qs.length || qs.every((x) => x.respondents === 0)) return <Empty />;
  const byId = new Map(qs.map((x) => [x.questionId, x]));
  const colors = ["bg-primary", "bg-[hsl(var(--teal))]", "bg-accent"];
  const compare = !path && b2b.data && b2c.data;
  return (
    <div className="grid gap-4">
      <Reveal i={0}>
        <section className="ink-panel grain relative overflow-hidden rounded-3xl p-5 sm:p-6" data-testid="programme-profile">
          <div className="absolute inset-x-0 top-0 h-1.5 sadu opacity-70" />
          <p className="font-display text-[11px] font-semibold tracking-[.2em] text-accent">ملف البرنامج المفضّل</p>
          <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">لو صُمّم برنامج واحد على مقاس الأغلبية</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {PROFILE.map((p) => {
              const x = byId.get(p.q);
              const top = x?.options[0];
              return (
                <div key={p.q} className="rounded-2xl border border-white/10 bg-white/[.06] p-3.5" data-testid={`profile-${p.q}`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/70"><p.icon className="h-3.5 w-3.5 text-accent" />{p.short}</div>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white">{top && x ? label(x, top.key, top.label) : "—"}</p>
                  <p className="mt-1 text-[11px] tabular-nums text-white/60">{top && x ? `${fmt(top.pct, 0)}% من ${x.respondents}` : "لا بيانات"}</p>
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>
      {SECTIONS.map((sec, si) => {
        const list = sec.ids.map((id) => byId.get(id)).filter((x): x is QuestionBreakdown => !!x && x.options.length > 0);
        if (!list.length) return null;
        return (
          <Reveal key={sec.title} i={si + 1}>
            <div className="mb-2 flex items-baseline gap-2"><h3 className="font-semibold">{sec.title}</h3><span className="text-xs text-muted-foreground">{sec.sub}</span></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((x, i) => (
                <Panel key={x.questionId} title={QUESTION_LABELS[x.questionId] ?? x.label} sub={`${x.questionId} · ${x.respondents} مجيب`}>
                  {DONUT_QS.has(x.questionId) ? (
                    <Donut centerLabel="مجيب" center={String(x.respondents)} height={170}
                      data={x.options.map((o, k) => ({ key: o.key, label: label(x, o.key, o.label), value: o.count, color: [C.navy, C.gold, C.teal, C.clay, C.slate, "hsl(206 40% 45%)"][k % 6] }))} />
                  ) : (
                    <HBars items={x.options.map((o) => ({ ...o, label: label(x, o.key, o.label) }))} color={colors[i % 3]} />
                  )}
                </Panel>
              ))}
            </div>
          </Reveal>
        );
      })}
      {!path && (
        <Reveal i={6}>
          <Panel title="المؤسسات مقابل الأفراد" sub="نسبة اختيار كل خيار عند B2B وB2C لأسئلة التنفيذ الستة" testId="prefs-compare"
            note="يساعد هذا الجدول على تصميم عرضين مختلفين: حزمة مؤسسية وحزمة أفراد، بدل برنامج واحد يرضي الطرفين جزئياً.">
            {!compare ? <Skel rows={2} /> : (
              <div className="grid gap-5 lg:grid-cols-2">
                {PROFILE.map((p) => {
                  const a = b2b.data!.questions.find((x) => x.questionId === p.q), b = b2c.data!.questions.find((x) => x.questionId === p.q);
                  if (!a || !b) return null;
                  const keys = [...new Set([...a.options, ...b.options].sort((x, y) => y.pct - x.pct).map((o) => o.key))];
                  return (
                    <div key={p.q} className="rounded-xl border border-border p-3">
                      <div className="flex items-baseline justify-between gap-2"><p className="text-sm font-semibold">{QUESTION_LABELS[p.q]}</p><span className={cn("text-[11px] font-semibold tabular-nums", maxDiff(a, b, keys) >= 15 ? "text-[hsl(14_60%_40%)]" : "text-muted-foreground")}>أكبر فارق {fmt(maxDiff(a, b, keys), 0)} نقطة</span></div>
                      <div className="mt-2 grid grid-cols-[1fr_120px_120px] gap-2 text-[11px] font-semibold">
                        <span />
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: C.navy }} />B2B <span className="font-normal text-muted-foreground">n={a.respondents}</span></span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: C.gold }} />B2C <span className="font-normal text-muted-foreground">n={b.respondents}</span></span>
                      </div>
                      <div className="mt-1.5 grid gap-1.5">
                        {keys.map((k) => {
                          const pa = a.options.find((o) => o.key === k)?.pct ?? 0, pb = b.options.find((o) => o.key === k)?.pct ?? 0;
                          return (
                            <div key={k} className="grid grid-cols-[1fr_120px_120px] items-center gap-2 text-xs">
                              <span className="truncate" title={label(a, k, k)}>{label(a, k, k)}</span>
                              <div className="flex items-center gap-1.5"><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full" style={{ width: `${pa}%`, background: C.navy }} /></div><span className="w-8 text-end tabular-nums">{fmt(pa, 0)}%</span></div>
                              <div className="flex items-center gap-1.5"><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full" style={{ width: `${pb}%`, background: C.gold }} /></div><span className="w-8 text-end tabular-nums">{fmt(pb, 0)}%</span></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </Reveal>
      )}
    </div>
  );
}

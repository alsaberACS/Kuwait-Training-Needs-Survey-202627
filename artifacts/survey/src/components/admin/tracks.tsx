import { useGetTrackRanks, getGetTrackRanksQueryKey, type SurveyPath } from "@workspace/api-client-react";
import { TRACK_LABELS, GROUP_LABELS } from "@/lib/survey-definition";
import { LOW_N } from "@/lib/study-context";
import { cn } from "@/lib/utils";
import { fmt, C, Panel, Skel, Err, Empty, Reveal, LowN } from "./shared";
import { StackedBar, Legend } from "./charts";
import { useSegmentReport, sliceLabel } from "./segment-heatmap";

const RANK_COLORS = ["hsl(206 62% 18%)", "hsl(206 55% 32%)", "hsl(206 45% 48%)", "hsl(206 35% 64%)", "hsl(206 30% 78%)", "hsl(38 25% 88%)", "hsl(38 20% 93%)"];

export function Tracks({ path }: { path?: SurveyPath }) {
  const params = path ? { path } : undefined;
  const q = useGetTrackRanks(params, { query: { queryKey: getGetTrackRanksQueryKey(params) } });
  const seg = useSegmentReport();
  if (q.isLoading) return <Skel />;
  if (q.isError || !q.data) return <Err onRetry={() => q.refetch()} />;
  const items = [...q.data.items].sort((a, b) => b.score - a.score);
  if (!items.length || items.every((i) => i.n === 0)) return <Empty />;
  // Only the six current tracks (G1–G6) compete for the ranking. Answers to the retired track list
  // (an earlier version of this question) are kept on record but never merged into the same scale.
  const current = items.filter((t) => t.trackId in GROUP_LABELS && t.n > 0);
  const legacy = items.filter((t) => !(t.trackId in GROUP_LABELS) && t.n > 0);
  const pathDim = seg.data?.dimensions.find((d) => d.id === "path");
  const b2b = pathDim?.slices.find((s) => s.key === "B2B"), b2c = pathDim?.slices.find((s) => s.key === "B2C");
  const size = Math.max(...current.map((t) => t.rankDistribution.length), 1);
  return (
    <div className="grid gap-4">
      <Reveal i={0}>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <div className="grid content-start gap-4">
          <Panel title="أولوية المسارات المستقبلية" sub={`درجة Borda المعيارية (0-100) · متوسط الترتيب · نسبة المركز الأول · n=${Math.max(...current.map((t) => t.n), 0)}`}>
            <div className="grid gap-3">
              {current.map((t, i) => (
                <div key={t.trackId} className="flex items-center gap-4 rounded-xl border border-border p-3" data-testid={`row-track-${t.trackId}`}>
                  <span className={cn("font-display flex h-10 w-10 items-center justify-center rounded-xl font-bold", i === 0 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{TRACK_LABELS[t.trackId] ?? t.label}</p>
                    <div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-[hsl(var(--teal))]" style={{ width: `${t.score}%` }} /></div>
                  </div>
                  <div className="text-end text-xs tabular-nums text-muted-foreground">
                    <p className="font-display text-xl font-semibold text-foreground">{fmt(t.score, 0)}</p>
                    <p>متوسط {fmt(t.meanRank, 2)} · أول {fmt(t.firstPlaceShare)}% · n={t.n}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          {legacy.length > 0 && (
            <Panel title="ردود النسخة السابقة من سؤال المسارات" sub="قائمة مسارات قديمة أُجيب عنها قبل اعتماد المسارات الستة الحالية؛ تُعرض للسجل ولا تُدمج مع الترتيب أعلاه"
              className="border-dashed bg-card/60" testId="panel-legacy-tracks">
              <div className="grid gap-2 sm:grid-cols-2">
                {legacy.map((t) => (
                  <div key={t.trackId} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs" data-testid={`row-track-${t.trackId}`}>
                    <span className="leading-snug text-muted-foreground"><span className="me-1 text-[10px]">{t.trackId}</span>{TRACK_LABELS[t.trackId] ?? t.label}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground">متوسط {fmt(t.meanRank, 2)} <LowN n={t.n} min={LOW_N} />{t.n >= LOW_N && `n=${t.n}`}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          </div>
          <div className="grid gap-4">
            <Panel title="توزيع المراكز" sub="أين وضع المشاركون كل مسار؟ من المركز الأول (داكن) إلى الأخير (فاتح)"
              note="مسار بدرجة متوسطة لكن بحصة كبيرة في المركز الأول يمثل أولوية «استقطابية»: يتصدّر عند فئة ويتذيّل عند أخرى."
              action={<Legend items={Array.from({ length: size }, (_, i) => ({ label: `المركز ${i + 1}`, color: RANK_COLORS[i] }))} />}>
              <div className="grid gap-3">
                {current.map((t) => (
                  <div key={t.trackId} data-testid={`dist-track-${t.trackId}`}>
                    <div className="mb-1 flex justify-between gap-3 text-[13px]"><span className="leading-snug">{TRACK_LABELS[t.trackId] ?? t.label}</span><span className="shrink-0 tabular-nums text-muted-foreground">أول {fmt(t.firstPlaceShare, 0)}%</span></div>
                    <StackedBar height={12} parts={t.rankDistribution.map((v, i) => ({ key: String(i), label: `المركز ${i + 1}`, value: v, color: RANK_COLORS[i] }))} />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="المؤسسات مقابل الأفراد" sub="درجة الأولوية لكل مسار عند B2B وB2C على كل الردود المكتملة"
              note="يُظهر هذا الرسم أين يتفق الطرفان وأين يفترقان، بصرف النظر عن عامل التصفية أعلى الصفحة.">
              {!b2b || !b2c ? <Skel rows={2} /> : !b2b.n || !b2c.n ? <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">يتطلب هذا الرسم ردوداً من المسارين معاً (B2B وB2C).</p> : (
                <div className="grid gap-2.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C.navy }} />{pathDim && sliceLabel(pathDim, b2b)} <LowN n={b2b.n} min={LOW_N} /></span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C.gold }} />{pathDim && sliceLabel(pathDim, b2c)} <LowN n={b2c.n} min={LOW_N} /></span>
                  </div>
                  {Object.entries(GROUP_LABELS).map(([id, label]) => {
                    const a = b2b.trackScores[id] ?? 0, b = b2c.trackScores[id] ?? 0;
                    const lo = Math.min(a, b), hi = Math.max(a, b);
                    return (
                      <div key={id} className="grid grid-cols-[1fr_auto] items-center gap-3" data-testid={`compare-track-${id}`}>
                        <div>
                          <p className="text-[13px] leading-snug">{label}</p>
                          <div className="relative mt-1 h-5" dir="ltr">
                            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
                            <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                            <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${a}%`, background: C.navy }} title={`B2B ${fmt(a, 0)}`} />
                            <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${b}%`, background: C.gold }} title={`B2C ${fmt(b, 0)}`} />
                          </div>
                        </div>
                        <span className={cn("w-14 text-end text-xs font-semibold tabular-nums", Math.abs(a - b) >= 20 ? "text-[hsl(14_60%_40%)]" : "text-muted-foreground")}>Δ {fmt(Math.abs(a - b), 0)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

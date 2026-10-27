import { motion, useReducedMotion } from "framer-motion";
import type { FocusGroupAnalysis } from "@workspace/api-client-react";
import { Poster, GlassCite, TIER } from "./common";

export function ActionsPoster({ data }: { data: FocusGroupAnalysis }) {
  const reduce = useReducedMotion();
  const title = new Map(data.themes.map((t) => [t.id, t.title]));
  const stages = [1, 2, 3].map((s) => ({ s, items: data.recommendations.filter((r) => r.stage === s) })).filter((x) => x.items.length);
  const sharedIdeas = data.themes.filter((t) => t.priority === "shared" && t.courseIdeas.length);
  return (
    <Poster id="actions" bg="infographic-backdrop.jpg" kicker="مقترحات تحليلية" title="مسار عمل مقترح على مراحل"
      lead="النوافذ الزمنية والإجراءات مقترحات من المحلل وليست التزامات متفق عليها؛ أفكار الدورات ليست مقررات قائمة في أي دليل.">
      <div className="relative">
        <motion.div aria-hidden className="absolute inset-x-0 top-5 hidden h-px origin-right bg-[hsl(40_40%_96%/.5)] md:block"
          initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
        <div className="grid gap-5 md:grid-cols-3">
          {stages.map(({ s, items }, si) => (
            <div key={s} className="min-w-0" data-testid={`stage-fi-${s}`}>
              <div className="relative z-10 mb-3 flex flex-col items-start gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[hsl(40_40%_97%)] font-display font-bold text-[hsl(206_62%_15%)]">{s}</span>
                <span className="fi-muted text-xs">{items[0].timeframe} (مقترح)</span>
              </div>
              <div className="grid gap-3">
                {items.map((r, i) => (
                  <motion.article key={r.id} data-testid={`card-fi-action-${r.id}`} className="fi-glass rounded-2xl p-4 transition hover:bg-[hsl(40_40%_96%/.14)]"
                    initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + si * 0.2 + i * 0.1 }}>
                    <h3 className="font-bold">{r.title}</h3>
                    <p className="fi-muted mt-1 text-sm leading-relaxed">{r.action}</p>
                    <p className="mt-2 text-xs"><b className="text-[hsl(38_80%_70%)]">الجهة المقترحة: </b>{r.owner}</p>
                    <p className="mt-1 text-xs"><b className="text-[hsl(178_50%_62%)]">مقياس مقترح: </b>{r.successMeasure}</p>
                    {r.themeIds.length > 0 && <p className="fi-muted mt-2 text-[11px]">{r.themeIds.map((t) => title.get(t) ?? t).join(" · ")}</p>}
                    <GlassCite ids={r.evidenceIds} title={r.title} className="mt-2" />
                  </motion.article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {sharedIdeas.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold">أفكار دورات مقترحة للاحتياجات المشتركة</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sharedIdeas.map((t) => (
              <div key={t.id} className="fi-glass min-w-0 rounded-2xl p-4" data-testid={`ideas-fi-${t.id}`}>
                <p className="text-sm font-bold" style={{ color: TIER.shared.color }}>{t.title}</p>
                <ul className="mt-2 grid gap-1 text-sm">{t.courseIdeas.map((c) => <li key={c} className="border-s border-[hsl(40_40%_96%/.4)] ps-2">{c}</li>)}</ul>
                <p className="fi-muted mt-2 text-[11px]">{t.deliveryAdvice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Poster>
  );
}

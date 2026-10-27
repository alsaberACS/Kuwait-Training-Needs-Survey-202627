import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";
import type { FocusGroupAnalysis } from "@workspace/api-client-react";
import { Poster, GlassCite } from "./common";

/** Findings + issues + tensions: what this means for training design. */
export function DesignPoster({ data }: { data: FocusGroupAnalysis }) {
  const reduce = useReducedMotion();
  const fade = (i: number) => ({ initial: reduce ? false : { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.08, duration: 0.5 } });
  return (
    <Poster id="design" bg="pathways-skyline.jpg" kicker="انعكاسات على تصميم التدريب" title="من الملاحظة إلى قرار التصميم">
      <div className="grid gap-4 sm:grid-cols-2">
        {data.executiveFindings.map((f, i) => (
          <motion.article key={f.id} {...fade(i)} data-testid={`card-fi-finding-${f.id}`} className="fi-glass min-w-0 rounded-2xl p-4 transition hover:-translate-y-0.5">
            <p className="fi-kicker">استنتاج {String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-1 font-bold">{f.title}</h3>
            <p className="fi-muted mt-1 text-sm leading-relaxed">{f.body}</p>
            <GlassCite ids={f.evidenceIds} title={f.title} className="mt-2" />
          </motion.article>
        ))}
      </div>
      <h3 className="mt-8 text-lg font-bold">قضايا تمسّ التصميم <span className="fi-muted text-sm font-normal tabular-nums">({data.issues.length})</span></h3>
      <ol className="relative mt-3 grid gap-3 border-s border-[hsl(40_40%_96%/.35)] ps-5">
        {data.issues.map((s, i) => (
          <motion.li key={s.id} {...fade(i)} data-testid={`item-fi-issue-${s.id}`} className="relative min-w-0">
            <span className="absolute -start-[25px] top-2 h-2.5 w-2.5 rounded-full bg-[hsl(38_72%_60%)]" aria-hidden />
            <p className="font-semibold">{s.title}</p>
            <p className="fi-muted text-sm leading-relaxed"><b className="text-[hsl(178_50%_62%)]">الانعكاس: </b>{s.implication}</p>
            <p className="text-sm leading-relaxed"><b className="text-[hsl(38_80%_70%)]">المقترح: </b>{s.recommendation}</p>
            <GlassCite ids={s.evidenceIds} title={s.title} className="mt-1" />
          </motion.li>
        ))}
      </ol>
      {data.tensions.length > 0 && (
        <div className="mt-8 grid gap-3">
          <h3 className="text-lg font-bold">توترات تحتاج موازنة</h3>
          {data.tensions.map((t, i) => (
            <motion.article key={t.id} {...fade(i)} data-testid={`card-fi-tension-${t.id}`} className="fi-glass min-w-0 rounded-2xl p-4">
              <p className="font-semibold">{t.title}</p>
              <div className="mt-2 grid items-center gap-2 text-sm sm:grid-cols-[1fr_auto_1fr]">
                <p className="rounded-xl bg-[hsl(40_40%_96%/.08)] p-2">{t.firstPosition}</p>
                <ArrowLeftRight className="mx-auto h-4 w-4 text-[hsl(38_72%_60%)]" />
                <p className="rounded-xl bg-[hsl(40_40%_96%/.08)] p-2">{t.secondPosition}</p>
              </div>
              <p className="fi-muted mt-2 text-sm"><b className="text-[hsl(178_50%_62%)]">الموازنة المقترحة: </b>{t.resolution}</p>
              <GlassCite ids={t.evidenceIds} title={t.title} className="mt-2" />
            </motion.article>
          ))}
        </div>
      )}
    </Poster>
  );
}

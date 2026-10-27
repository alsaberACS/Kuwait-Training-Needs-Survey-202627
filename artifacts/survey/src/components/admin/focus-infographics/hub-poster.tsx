import { motion, useReducedMotion } from "framer-motion";
import { Users2 } from "lucide-react";
import type { FocusGroupAnalysis } from "@workspace/api-client-react";
import { Poster, GlassCite } from "./common";

/** Central hub with each focus group as a connected callout (reference: city poster with radiating lines). */
export function HubPoster({ data }: { data: FocusGroupAnalysis }) {
  const reduce = useReducedMotion();
  const title = new Map(data.themes.map((t) => [t.id, t.title]));
  const stats = [
    { k: "groups", v: data.stats.groups, l: "مجموعات بؤرية" },
    { k: "themes", v: data.stats.codedThemes, l: "عائلة احتياج مُرمَّزة" },
    { k: "shared", v: data.stats.sharedThemes, l: "مشتركة بين المجموعات" },
    { k: "excerpts", v: data.stats.evidenceExcerpts, l: "مقتطفاً موثّقاً" },
  ];
  return (
    <Poster id="hub" bg="pathways-skyline.jpg" kicker="ما قالته المجموعات البؤرية" title={data.headline} lead={data.synopsis}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[340px]">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
            <g className="fi-spin"><circle cx="100" cy="100" r="94" className="fi-line" strokeDasharray="2 6" /></g>
            <motion.circle cx="100" cy="100" r="80" className="fi-line" initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6 }} />
            {data.groups.map((g, i) => {
              const a = (-90 + (360 / data.groups.length) * i) * (Math.PI / 180);
              return <circle key={g.id} cx={100 + 80 * Math.cos(a)} cy={100 + 80 * Math.sin(a)} r="4" className="fi-dot fi-pulse" />;
            })}
          </svg>
          <div className="absolute inset-[22%] grid place-items-center rounded-full bg-[hsl(40_40%_97%)] text-center text-[hsl(206_62%_15%)] shadow-2xl">
            <div>
              <Users2 className="mx-auto h-6 w-6 text-[hsl(178_45%_32%)]" />
              <p className="font-display text-4xl font-bold tabular-nums" data-testid="text-fi-groups">{data.stats.groups}</p>
              <p className="text-xs font-semibold">مجموعات · سجلات مستقلة</p>
            </div>
          </div>
        </div>
        <ol className="grid min-w-0 gap-4">
          {data.groups.map((g, i) => (
            <motion.li key={g.id} data-testid={`callout-group-${g.id}`} className="fi-glass group relative min-w-0 rounded-2xl p-4 transition hover:bg-[hsl(40_40%_96%/.14)]"
              initial={reduce ? false : { opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.18, duration: 0.6 }}>
              <span className="absolute -right-6 top-6 hidden h-px w-6 bg-[hsl(40_40%_96%/.6)] lg:block" aria-hidden />
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[hsl(38_72%_60%)] font-display text-xs tabular-nums text-[hsl(38_80%_74%)]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-base font-bold">{g.label}</h3>
                <span className="fi-muted text-[11px]">{g.sourceLanguage === "en" ? "السجل بالإنجليزية" : "السجل بالعربية"}</span>
                <GlassCite ids={g.evidenceIds} title={`مقتطفات ${g.label}`} className="ms-auto" />
              </div>
              <p className="mt-2 text-sm leading-relaxed">{g.takeaway}</p>
              {g.distinctiveThemes.length > 0 && (
                <p className="fi-muted mt-2 text-xs">يميّزها: {g.distinctiveThemes.map((t) => title.get(t) ?? t).join("، ")}</p>
              )}
            </motion.li>
          ))}
        </ol>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[hsl(40_40%_96%/.15)] sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="bg-[hsl(206_62%_12%/.6)] p-4" data-testid={`stat-fi-${s.k}`}>
            <dd className="font-display text-3xl font-bold tabular-nums text-[hsl(38_80%_70%)]">{s.v}</dd>
            <dt className="fi-muted text-xs">{s.l}</dt>
          </div>
        ))}
      </dl>
      <p className="fi-muted mt-3 text-[11px]">وحدة العدّ: {data.methodology.countUnit}</p>
    </Poster>
  );
}

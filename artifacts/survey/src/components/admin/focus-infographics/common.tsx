import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";
import { useEvidence } from "@/components/admin/focus-groups-evidence";
import { cn } from "@/lib/utils";

export const BG = (file: string) => `${import.meta.env.BASE_URL}${file}`;

export const TIER = {
  shared: { label: "مشترك", sub: "صريح في 3 مجموعات", color: "hsl(38 72% 58%)" },
  targeted: { label: "مُوجَّه", sub: "صريح في مجموعتين", color: "hsl(178 50% 52%)" },
  specialist: { label: "متخصص", sub: "صريح في مجموعة واحدة", color: "hsl(206 45% 74%)" },
} as const;

export function Poster({ id, bg, kicker, title, lead, children }: { id: string; bg: string; kicker: string; title: string; lead?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.section id={`fi-${id}`} data-testid={`poster-${id}`} aria-labelledby={`fi-${id}-t`} className="fi-poster min-w-0 scroll-mt-16 p-5 sm:p-8"
      initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}>
      <div className="fi-bg" style={{ backgroundImage: `url(${BG(bg)})` }} aria-hidden />
      <header className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-[hsl(40_40%_96%/.2)] pb-4">
        <div className="min-w-0">
          <p className="fi-kicker">{kicker}</p>
          <h2 id={`fi-${id}-t`} className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
        </div>
        {lead && <p className="fi-muted min-w-0 max-w-xl text-sm leading-relaxed">{lead}</p>}
      </header>
      {children}
    </motion.section>
  );
}

export function GlassCite({ ids, title, note, className }: { ids: string[]; title: string; note?: string; className?: string }) {
  const { open } = useEvidence();
  if (!ids.length) return null;
  return (
    <button type="button" onClick={() => open({ title, ids, note })} data-testid={`button-fi-evidence-${ids[0]}`}
      className={cn("inline-flex items-center gap-1 rounded-full border border-[hsl(38_72%_60%/.6)] px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(38_80%_74%)] transition hover:bg-[hsl(38_72%_55%/.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38_72%_60%)] print:hidden", className)}>
      <Quote className="h-3 w-3" />الدليل <bdi className="tabular-nums">({ids.length})</bdi>
    </button>
  );
}

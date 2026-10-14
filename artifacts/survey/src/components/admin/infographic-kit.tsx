import type { ReactNode } from "react";
import { CalendarCheck, Cpu, Compass, Users, Landmark, ClipboardCheck, Briefcase, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "./shared";

/* Palette sampled from the ASDC logo: gold #D0A734 and silver-grey #A1A29D on white. */
export const GOLD = "#D0A734";
export const GOLD_SOFT = "#E7D5A2";
export const GOLD_DEEP = "#A8842A";
export const SILVER = "#D6D7D2";
export const WHITE = "#FFFFFF";
export const FONT = "IBM Plex Sans Arabic";
export const TIP = { background: "rgba(24,28,33,.92)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 12, color: "#fff", fontFamily: FONT, fontSize: 12, direction: "rtl" as const };
export const GOLD_GRAD = `linear-gradient(90deg, ${GOLD_SOFT}, ${GOLD})`;

export const glass = "rounded-2xl border border-white/30 bg-white/[.13] shadow-[inset_0_1px_0_0_rgba(255,255,255,.35),0_18px_40px_-24px_rgba(0,0,0,.6)] backdrop-blur-md";

export const DOMAIN: Record<string, { short: string; icon: LucideIcon }> = {
  G1: { short: "الرقمنة والذكاء الاصطناعي", icon: Cpu },
  G2: { short: "القيادة والاستراتيجية", icon: Compass },
  G3: { short: "الموارد البشرية", icon: Users },
  G4: { short: "المالية والامتثال", icon: Landmark },
  G5: { short: "المشاريع والجودة", icon: ClipboardCheck },
  G6: { short: "الجاهزية المهنية", icon: Briefcase },
};

/* Arabic labels for the catalogue / matching vocabularies (kept in step with the matching tab). */
export const CELL_AR: Record<string, string> = { confirmed_priority: "أولوية مؤكدة", new_demand: "طلب جديد", evidence_led: "تقوده الأدلة", defer: "تأجيل" };
export const SUPPLY_AR: Record<string, string> = { Build: "بناء", Expand: "توسعة", Select: "اختيار" };
export const TIER_AR: Record<string, string> = { Foundation: "تأسيسي", Practitioner: "ممارس", Leadership: "قيادي" };
export const LOCAL_AR: Record<string, string> = { None: "غير متوفر محلياً", Emerging: "عرض محلي ناشئ", Established: "عرض محلي راسخ" };
export const AUDIENCE_AR: Record<string, string> = { G: "حكومي", P: "خاص", S: "منشآت صغيرة", I: "أفراد" };

/* ---------- the poster shell: blurred photo, charcoal + gold tint, header strip and source footer ---------- */
export function Poster({ page, total, title, sub, completed, today, position = "center", children, footer, testId }: {
  page: number; total: number; title: string; sub: string; completed: number; today: string; position?: string; children: ReactNode; footer: ReactNode; testId?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl text-white shadow-2xl" data-testid={testId} style={{ background: "linear-gradient(160deg, #1b2027, #24303a 55%, #3a3220)" }}>
      <div aria-hidden className="absolute inset-0 scale-105 bg-cover" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}infographic-backdrop.jpg)`, backgroundPosition: position, filter: "blur(4px) saturate(.85)" }} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(22,27,33,.86) 0%, rgba(34,44,54,.74) 48%, rgba(74,60,26,.68) 100%)" }} />
      <div aria-hidden className="absolute -start-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: GOLD }} />
      <div aria-hidden className="absolute -bottom-32 end-10 h-96 w-96 rounded-full opacity-25 blur-3xl" style={{ background: SILVER }} />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-lg ring-2 ring-white/40">
            <img src={`${import.meta.env.BASE_URL}asdc-logo.jpg`} alt="شعار مركز عبدالعزيز حمد الصقر للتنمية والتطوير" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-[220px] flex-1">
            <p className="font-display text-[11px] font-semibold tracking-[.2em]" style={{ color: GOLD_SOFT }}>ASDC · KCCI · إنفوجرافيك النتائج · لوحة {page} من {total}</p>
            <h2 className="font-display mt-0.5 text-xl font-bold leading-snug sm:text-2xl">{title}</h2>
            <p className="mt-1 text-xs text-white/75">{sub}</p>
          </div>
          <div className={cn(glass, "flex items-center gap-3 px-4 py-2.5 text-xs")}>
            <CalendarCheck className="h-4 w-4" style={{ color: GOLD_SOFT }} />
            <span><b className="font-display text-base tabular-nums">{completed}</b> رداً مكتملاً · حتى {today}</span>
          </div>
        </div>
        {children}
        <p className="mt-6 text-[11px] leading-relaxed text-white/65">{footer}</p>
      </div>
    </section>
  );
}

/* ---------- a titled glass panel ---------- */
export function GlassPanel({ title, sub, action, children, className, testId }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; testId?: string }) {
  return (
    <div className={cn(glass, "min-w-0 p-4", className)} data-testid={testId}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {sub && <p className="text-[11px] leading-relaxed text-white/70">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ---------- small chips: gold for the lead value, white otherwise ---------- */
export function Chip({ children, tone = "white", className }: { children: ReactNode; tone?: "gold" | "white" | "muted"; className?: string }) {
  const style = tone === "gold" ? { background: "rgba(208,167,52,.28)", borderColor: "rgba(231,213,162,.6)", color: GOLD_SOFT }
    : tone === "muted" ? { background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)" }
    : { background: "rgba(255,255,255,.16)", borderColor: "rgba(255,255,255,.35)", color: WHITE };
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight", className)} style={style}>{children}</span>;
}

/* ---------- rank medal: gold disc for the first three, outlined for the rest ---------- */
export function Medal({ n, size = 26 }: { n: number; size?: number }) {
  const top = n <= 3;
  return (
    <span className="font-display inline-flex shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums"
      style={{ width: size, height: size, background: top ? GOLD_GRAD : "rgba(255,255,255,.12)", borderColor: top ? GOLD_SOFT : "rgba(255,255,255,.4)", color: top ? "#2a2411" : WHITE }}>
      {n}
    </span>
  );
}

/* ---------- KPI tile for the poster ---------- */
export function PosterKpi({ icon: Icon, label, value, hint, testId }: { icon: LucideIcon; label: string; value: string; hint?: string; testId?: string }) {
  return (
    <div className={cn(glass, "flex items-center gap-3 p-3.5")} data-testid={testId}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15"><Icon className="h-5 w-5" strokeWidth={1.7} style={{ color: GOLD_SOFT }} /></span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold leading-none tabular-nums" dir="ltr">{value}</p>
        <p className="mt-1 text-[11px] leading-snug text-white/85">{label}</p>
        {hint && <p className="text-[10px] text-white/60">{hint}</p>}
      </div>
    </div>
  );
}

/* ---------- SVG donut in the poster palette ---------- */
export function GlassDonut({ title, parts, size = 120, center, testId }: { title: string; parts: { label: string; value: number; color: string }[]; size?: number; center?: string; testId?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const r = 42, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center" data-testid={testId}>
      <p className="text-xs font-semibold">{title}</p>
      <div className="relative mt-2" style={{ width: size, height: size }} dir="ltr">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="12" />
          {total > 0 && parts.filter((p) => p.value > 0).map((p) => {
            const len = (p.value / total) * circ;
            const el = <circle key={p.label} cx="50" cy="50" r={r} fill="none" stroke={p.color} strokeWidth="12" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div><p className="font-display text-xl font-bold leading-none tabular-nums">{center ?? total}</p><p className="text-[9px] text-white/70">ورشة</p></div>
        </div>
      </div>
      <div className="mt-2 grid gap-0.5 text-[10px] text-white/85">
        {parts.map((p) => (
          <span key={p.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />{p.label}
            <b className="font-display tabular-nums">{p.value}</b><span className="text-white/55">({total ? fmt((p.value / total) * 100, 0) : 0}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- stacked horizontal bar ---------- */
export function GlassStack({ parts, height = 10 }: { parts: { value: number; color: string; label: string }[]; height?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-white/15" style={{ height }} dir="ltr">
      {total > 0 && parts.map((p) => p.value > 0 && <span key={p.label} title={`${p.label}: ${p.value}`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
    </div>
  );
}

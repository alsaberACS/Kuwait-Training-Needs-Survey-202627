import { useState, type ReactNode } from "react";
import { motion, Reorder, useDragControls, AnimatePresence } from "framer-motion";
import { Check, ChevronUp, ChevronDown, GripVertical, Info, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Option, Rating, Skill, Track, CourseGroup } from "@/lib/survey-definition";
import { LEVEL_LABELS } from "@/lib/survey-definition";

export function QuestionShell({
  num, title, hint, error, children, id, aside,
}: { num: number; title: string; hint?: ReactNode; error?: string; children: ReactNode; id: string; aside?: ReactNode }) {
  return (
    <motion.section
      id={`q-${id}`}
      data-testid={`question-${id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn(
        "rounded-2xl border bg-card p-5 sm:p-7 shadow-[0_1px_0_hsl(var(--border)),0_12px_30px_-18px_hsl(206_62%_17%/.25)] transition-colors",
        error ? "border-destructive/50" : "border-card-border",
      )}
    >
      <header className="mb-4 flex items-start gap-3">
        <span className="font-display mt-0.5 flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2 text-sm font-semibold text-primary-foreground tabular-nums">
          {num}
        </span>
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-semibold leading-relaxed text-foreground">
            {title} <span className="text-accent" aria-label="مطلوب">*</span>
          </h3>
          {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
        </div>
        {aside}
      </header>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive"
            data-testid={`error-${id}`}
          >
            <Info className="h-4 w-4" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Mark({ on, square }: { on: boolean; square?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-all duration-200",
        square ? "rounded-md" : "rounded-full",
        on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
      )}
    >
      {on && <Check className="h-3.5 w-3.5 animate-pop" strokeWidth={3} />}
    </span>
  );
}

export function OptionCard({
  label, selected, onClick, square, testId, disabled, suggested, description,
}: {
  label: string; selected: boolean; onClick: () => void; square?: boolean; testId: string;
  disabled?: boolean; suggested?: boolean; description?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testId}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start text-[15px] leading-relaxed transition-all duration-200 min-h-[56px]",
        selected
          ? "border-primary bg-primary/[.06] shadow-[inset_0_0_0_1px_hsl(var(--primary))]"
          : "border-border bg-background/60 hover:border-primary/40 hover:bg-secondary/40",
        disabled && !selected && "opacity-50",
      )}
    >
      <Mark on={selected} square={square} />
      <span className="flex-1">
        <span className={cn("block", selected && "font-semibold text-primary")}>{label}</span>
        {description && <span className="mt-1 block text-sm text-muted-foreground">{description}</span>}
      </span>
      {suggested && !selected && (
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-[hsl(32_70%_30%)]">مقترح لك</span>
      )}
    </motion.button>
  );
}

export function SingleChoice({
  qid, options, value, onChange, cols = 1,
}: { qid: string; options: Option[]; value?: string; onChange: (v: string) => void; cols?: 1 | 2 }) {
  return (
    <div className={cn("grid gap-2.5", cols === 2 && "sm:grid-cols-2")}>
      {options.map((op) => (
        <OptionCard key={op.id} label={op.label} selected={value === op.id} onClick={() => onChange(op.id)} testId={`option-${qid}-${op.id}`} />
      ))}
    </div>
  );
}

export function MultiChoice({
  qid, options, value = [], onChange, max, cols = 1,
}: { qid: string; options: Option[]; value?: string[]; onChange: (v: string[]) => void; max?: number; cols?: 1 | 2 }) {
  const [hint, setHint] = useState(false);
  const toggle = (op: Option) => {
    setHint(false);
    if (value.includes(op.id)) return onChange(value.filter((v) => v !== op.id));
    if (op.exclusive) return onChange([op.id]);
    const base = value.filter((v) => !options.find((x) => x.id === v)?.exclusive);
    if (max && base.length >= max) { setHint(true); return; }
    onChange([...base, op.id]);
  };
  return (
    <div>
      {max && (
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">اختر حتى {max} خيارات</span>
          <span className="flex gap-1" data-testid={`counter-${qid}`}>
            {Array.from({ length: max }).map((_, i) => (
              <span key={i} className={cn("h-2 w-6 rounded-full transition-colors", i < value.length ? "bg-accent" : "bg-muted")} />
            ))}
            <span className="ms-2 tabular-nums font-medium">{value.length}/{max}</span>
          </span>
        </div>
      )}
      <div className={cn("grid gap-2.5", cols === 2 && "sm:grid-cols-2")}>
        {options.map((op) => (
          <OptionCard
            key={op.id} square label={op.label} selected={value.includes(op.id)} onClick={() => toggle(op)}
            testId={`option-${qid}-${op.id}`} description={op.description} suggested={op.suggested}
            disabled={!!max && value.length >= max && !value.includes(op.id)}
          />
        ))}
      </div>
      <AnimatePresence>
        {hint && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 rounded-lg bg-accent/15 px-3 py-2 text-sm text-[hsl(32_70%_28%)]">
            يمكنك اختيار خيارين فقط. ألغِ أحد اختياراتك أولاً إذا أردت تغييره.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Scale({ value, onChange, testId, tone }: { value?: number; onChange: (n: number) => void; testId: string; tone: "ink" | "gold" }) {
  return (
    <div className="grid grid-cols-5 gap-1.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value === n;
        return (
          <motion.button
            key={n} type="button" whileTap={{ scale: 0.9 }} onClick={() => onChange(n)} data-testid={`${testId}-${n}`}
            aria-pressed={on}
            className={cn(
              "h-11 rounded-lg border text-base font-semibold tabular-nums transition-all",
              on
                ? tone === "ink" ? "border-primary bg-primary text-primary-foreground" : "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            {n}
          </motion.button>
        );
      })}
    </div>
  );
}

export function SkillMatrix({
  qid, skills, value = {}, onChange, impLabel, perfLabel, showMissing,
}: {
  qid: string; skills: Skill[]; value?: Record<string, Rating>; onChange: (v: Record<string, Rating>) => void;
  impLabel: string; perfLabel: string; showMissing?: boolean;
}) {
  const set = (sid: string, key: keyof Rating, n: number) => onChange({ ...value, [sid]: { ...value[sid], [key]: n } });
  const done = skills.filter((s) => value[s.id]?.importance && value[s.id]?.performance).length;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-muted/60 p-3 text-sm">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-primary" />{impLabel}</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-accent" />{perfLabel}</span>
        <span className="ms-auto font-medium tabular-nums">{done}/{skills.length}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {skills.map((s, i) => {
          const r = value[s.id] ?? {};
          const complete = !!(r.importance && r.performance);
          return (
            <div key={s.id} data-testid={`skill-${qid}-${s.id}`}
              className={cn("rounded-xl border p-4 transition-colors",
                complete ? "border-[hsl(var(--teal)/.4)] bg-secondary/40" : showMissing ? "border-destructive/40" : "border-border bg-background/50")}>
              <p className="mb-3 flex gap-2 font-medium leading-relaxed">
                <span className="text-muted-foreground tabular-nums">{i + 1}.</span>{s.label}
                {complete && <Check className="ms-auto h-4 w-4 shrink-0 text-[hsl(var(--teal))]" />}
              </p>
              <p className="mb-1.5 text-xs text-muted-foreground">الأهمية</p>
              <Scale tone="ink" value={r.importance} onChange={(n) => set(s.id, "importance", n)} testId={`rate-${qid}-${s.id}-imp`} />
              <p className="mb-1.5 mt-3 text-xs text-muted-foreground">الأداء الحالي</p>
              <Scale tone="gold" value={r.performance} onChange={(n) => set(s.id, "performance", n)} testId={`rate-${qid}-${s.id}-perf`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankItem({ track, index, total, move }: { track: Track; index: number; total: number; move: (from: number, to: number) => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={track.id} dragListener={false} dragControls={controls}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-sm select-none"
      whileDrag={{ scale: 1.03, boxShadow: "0 18px 30px -12px hsl(206 62% 17% / .35)" }}
      data-testid={`rank-item-${track.id}`}
    >
      <button type="button" onPointerDown={(e) => controls.start(e)} className="touch-none cursor-grab p-1.5 text-muted-foreground" aria-label="اسحب لإعادة الترتيب">
        <GripVertical className="h-5 w-5" />
      </button>
      <span className={cn("font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold tabular-nums",
        index === 0 ? "bg-accent text-accent-foreground" : index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
        {index + 1}
      </span>
      <span className="flex-1 text-[15px] font-medium leading-snug">{track.label}</span>
      <div className="flex flex-col">
        <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded p-1 hover:bg-muted disabled:opacity-30" aria-label="أعلى" data-testid={`rank-up-${track.id}`}>
          <ChevronUp className="h-4 w-4" />
        </button>
        <button type="button" disabled={index === total - 1} onClick={() => move(index, index + 1)} className="rounded p-1 hover:bg-muted disabled:opacity-30" aria-label="أسفل" data-testid={`rank-down-${track.id}`}>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export function RankList({ tracks, value, onChange }: { tracks: Track[]; value: string[]; onChange: (v: string[]) => void }) {
  const move = (from: number, to: number) => {
    const next = [...value];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  const byId = Object.fromEntries(tracks.map((t) => [t.id, t]));
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
        <span>1 = الأهم</span><span>6 = الأقل أهمية</span>
      </div>
      <Reorder.Group axis="y" values={value} onReorder={onChange} className="grid gap-2">
        {value.map((id, i) => <RankItem key={id} track={byId[id]} index={i} total={value.length} move={move} />)}
      </Reorder.Group>
    </div>
  );
}

export function CourseMatrix({
  groups, value = {}, onChange, showMissing,
}: { groups: CourseGroup[]; value?: Record<string, 0 | 1 | 2>; onChange: (v: Record<string, 0 | 1 | 2>) => void; showMissing?: boolean }) {
  const levelStyle = ["border-muted-foreground/40 bg-muted text-foreground", "border-[hsl(var(--teal))] bg-[hsl(var(--teal))] text-white", "border-accent bg-accent text-accent-foreground"];
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2 text-xs">
        {LEVEL_LABELS.map((l, i) => (
          <span key={l} className={cn("rounded-full border px-2.5 py-1 font-medium", levelStyle[i])}>{l}</span>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {groups.map((g, gi) => {
        const answered = g.courses.filter((c) => value[c.id] !== undefined).length;
        return (
          <motion.div key={g.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden rounded-xl border border-border" data-testid={`course-group-${g.id}`}>
            <div className="flex flex-wrap items-center gap-2 bg-muted/60 px-4 py-3">
              <span className="font-display text-xs font-semibold text-accent tabular-nums">0{gi + 1}</span>
              <h4 className="flex-1 font-semibold">{g.label}</h4>
              <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", answered === g.courses.length ? "bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))] font-semibold" : "text-muted-foreground")}>
                {answered}/{g.courses.length}
              </span>
            </div>
            <div className="divide-y divide-border">
              {g.courses.map((c) => {
                const v = value[c.id];
                return (
                  <div key={c.id} className={cn("p-3.5 sm:flex sm:items-center sm:gap-4", showMissing && v === undefined && "bg-destructive/5")} data-testid={`course-${c.id}`}>
                    <p className="mb-2.5 flex-1 text-[15px] leading-relaxed sm:mb-0">{c.label}</p>
                    <div className="grid grid-cols-3 gap-1.5 sm:w-[360px]">
                      {LEVEL_LABELS.map((l, i) => (
                        <motion.button
                          key={l} type="button" whileTap={{ scale: 0.95 }}
                          onClick={() => onChange({ ...value, [c.id]: i as 0 | 1 | 2 })}
                          aria-pressed={v === i} data-testid={`course-${c.id}-${i}`}
                          className={cn("min-h-[44px] rounded-lg border px-1.5 text-xs font-medium leading-tight transition-all sm:text-[13px]",
                            v === i ? levelStyle[i] : "border-border bg-background hover:border-primary/40")}
                        >
                          {l}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>
    </div>
  );
}

export function NextIcon() {
  return <ChevronLeft className="h-5 w-5" />;
}

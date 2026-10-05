import type { ReactNode } from "react";
import { ListOrdered, TrendingUp, BookOpen, SlidersHorizontal } from "lucide-react";
import type { Answers } from "@/lib/survey-definition";
import { personalizedSummary } from "@/lib/personalized-results";

const formatNumber = (n: number) => n.toLocaleString("en-US");

function Block({ icon, title, children, id }: { icon: ReactNode; title: string; children: ReactNode; id: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5" data-testid={`results-${id}`}>
      <h4 className="mb-3 flex items-center gap-2 font-semibold text-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
);

export function PersonalizedResults({ answers }: { answers: Answers }) {
  const s = personalizedSummary(answers);
  return (
    <div className="grid gap-3 text-start" dir="rtl" data-testid="personalized-results">
      <div>
        <h3 className="text-xl font-semibold text-primary">{s.isInstitution ? "أولويات تطوير فريق العمل" : "ملخص احتياجاتك التدريبية"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {s.isInstitution ? "بصفتك تمثل جهة عملك، هذه أبرز النقاط من إجاباتك." : "هذه أبرز النقاط من إجاباتك."}
        </p>
      </div>

      <Block id="priorities" icon={<ListOrdered className="h-4 w-4" />} title="أولوياتك التدريبية">
        {s.priorities.length ? (
          <ol className="grid gap-2">
            {s.priorities.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 text-[15px]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold tabular-nums text-primary-foreground">{formatNumber(i + 1)}</span>
                {p.label}
              </li>
            ))}
          </ol>
        ) : <Empty>لم يُسجَّل ترتيب للمسارات في هذه الإجابات.</Empty>}
      </Block>

      <Block id="skills" icon={<TrendingUp className="h-4 w-4" />} title="مهارات تستحق التطوير">
        {s.skills.length ? (
          <ul className="grid gap-2.5">
            {s.skills.map((k) => (
              <li key={k.id} className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-[15px] leading-relaxed">{k.label}</p>
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  الأهمية {formatNumber(k.importance)} من 5 — الأداء الحالي {formatNumber(k.performance)} من 5 — الفرق {formatNumber(k.gap)}
                </p>
              </li>
            ))}
          </ul>
        ) : <Empty>لا توجد مهارة قيّمتها مهمة (4 أو 5) وأداؤها الحالي أقل من أهميتها في إجاباتك.</Empty>}
      </Block>

      <Block id="courses" icon={<BookOpen className="h-4 w-4" />} title="دورات أبديت اهتمامك بها">
        {s.courses.length ? (
          <ul className="grid gap-2.5">
            {s.courses.map((c) => (
              <li key={c.id} className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-[15px] font-medium leading-relaxed">{c.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.reason}</p>
              </li>
            ))}
          </ul>
        ) : <Empty>لم تحدد اهتماماً بدورة محددة في إجاباتك.</Empty>}
      </Block>

      <Block id="preferences" icon={<SlidersHorizontal className="h-4 w-4" />} title="تفضيلات التدريب">
        {s.preferences.length ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            {s.preferences.map((p) => (
              <div key={p.label} className="rounded-lg bg-muted/50 px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{p.label}</dt>
                <dd className="mt-0.5 text-[15px] leading-relaxed">{p.values.join("، ")}</dd>
              </div>
            ))}
          </dl>
        ) : <Empty>لم تُسجَّل تفضيلات في هذه الإجابات.</Empty>}
      </Block>

      <p className="text-xs leading-relaxed text-muted-foreground" data-testid="results-disclaimer">
        هذا ملخص لإجاباتك الذاتية كما أدخلتها، وليس تقييماً أو اختباراً معتمداً لمهاراتك.
      </p>
    </div>
  );
}

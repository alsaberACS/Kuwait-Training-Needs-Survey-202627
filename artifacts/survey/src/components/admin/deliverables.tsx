import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, ClipboardList, Download, ExternalLink, Eye, FileBadge, FileSignature, FileText, Files, Layers3, Loader2, ScrollText, X } from "lucide-react";
import {
  useListDeliverables, getListDeliverablesQueryKey, getDeliverableFile,
  type Deliverable, type DeliverableCategory, type ContractPhase,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Err, Kpi, Panel, Pill, Reveal, Skel, fmt } from "./shared";

type Mode = "view" | "download";
type Busy = { id: string; mode: Mode } | null;

const CATEGORY: Record<DeliverableCategory, { label: string; sub: string; icon: typeof FileText; tone: "navy" | "gold" | "teal" | "clay" }> = {
  contract: { label: "الوثيقة التعاقدية", sub: "المرجع الحاكم لنطاق العمل والمراحل والمخرجات.", icon: FileSignature, tone: "navy" },
  deliverable: { label: "المخرجات المسلّمة", sub: "الوثائق التي سُلّمت إلى الغرفة حتى الآن، كلٌّ مربوط بمرحلة من مراحل العقد.", icon: FileBadge, tone: "gold" },
  instrument: { label: "أدوات جمع البيانات", sub: "نسخ الاستبانة التي بُني عليها المسح الميداني.", icon: ClipboardList, tone: "teal" },
  report: { label: "تقارير المتابعة", sub: "التقارير الدورية المرفوعة إلى الغرفة وفق المادة 6 من العقد.", icon: ScrollText, tone: "clay" },
};
const ORDER: DeliverableCategory[] = ["contract", "deliverable", "instrument", "report"];

const mb = (bytes: number) => (bytes >= 1024 * 1024 ? `${fmt(bytes / 1024 / 1024, 1)} MB` : `${fmt(bytes / 1024, 0)} KB`);
const fileName = (d: Deliverable) => `${d.title.replace(/[\\/:*?"<>|]/g, "-")}.pdf`;

export function Deliverables() {
  const q = useListDeliverables({ query: { queryKey: getListDeliverablesQueryKey(), staleTime: 300000, refetchOnWindowFocus: false } });
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ doc: Deliverable; url: string } | null>(null);
  const urls = useRef(new Map<string, string>());
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => () => { for (const u of urls.current.values()) URL.revokeObjectURL(u); urls.current.clear(); }, []);

  const load = async (doc: Deliverable) => {
    const cached = urls.current.get(doc.id);
    if (cached) return cached;
    const blob = await getDeliverableFile(doc.id, { responseType: "blob" });
    const url = URL.createObjectURL(blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }));
    urls.current.set(doc.id, url);
    return url;
  };

  const act = async (doc: Deliverable, mode: Mode, target: HTMLElement) => {
    if (busy) return;
    setBusy({ id: doc.id, mode });
    setError(null);
    try {
      const url = await load(doc);
      if (mode === "view") {
        opener.current = target;
        setViewing({ doc, url });
      } else {
        const a = document.createElement("a");
        a.href = url; a.download = fileName(doc); a.click();
      }
    } catch {
      setError(`تعذّر تحميل «${doc.title}». تحقّق من الاتصال ثم أعد المحاولة.`);
    } finally {
      setBusy(null);
    }
  };

  const docs = q.data?.documents ?? [];
  const phases = q.data?.phases ?? [];
  const groups = useMemo(() => ORDER.map((c) => ({ category: c, items: docs.filter((d) => d.category === c) })).filter((g) => g.items.length), [docs]);
  const totalPages = docs.reduce((s, d) => s + d.pages, 0);
  const coveredPhases = new Set(docs.filter((d) => d.category !== "contract" && d.category !== "report").flatMap((d) => d.phases)).size;
  const latest = docs.reduce<Deliverable | null>((best, d) => (!best || d.issuedOn > best.issuedOn ? d : best), null);

  if (q.isLoading) return <Skel rows={5} />;
  if (q.isError) return <Err onRetry={() => q.refetch()} />;

  return (
    <div className="grid gap-5" data-testid="deliverables">
      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="الوثائق المحفوظة" value={fmt(docs.length, 0)} icon={Files} accent hint="العقد والمخرجات وأدوات الجمع وتقارير المتابعة" />
          <Kpi label="إجمالي الصفحات" value={fmt(totalPages, 0)} icon={FileText} hint="بصيغة PDF قابلة للعرض والتنزيل" />
          <Kpi label="مراحل العقد المغطاة بمخرج" value={`${fmt(coveredPhases, 0)} / 10`} icon={Layers3} hint="مراحل المادة 3 التي يسندها مخرج مسلّم أو أداة جمع" />
          <Kpi label="آخر وثيقة" value={latest ? latest.issuedLabel.replace(/^بدء التنفيذ /, "") : "—"} icon={CalendarDays} hint={latest?.title} />
        </div>
      </Reveal>

      {error && <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert" data-testid="deliverables-error">{error}</p>}

      <Reveal i={1}>
        <Panel title="خريطة التغطية التعاقدية" sub="مراحل العقد العشر (المادة 3) وعدد الوثائق المحفوظة التي تسند كل مرحلة، باستثناء العقد نفسه وتقارير المتابعة." testId="phase-coverage">
          <PhaseMap phases={phases} docs={docs} />
        </Panel>
      </Reveal>

      {groups.map((g, gi) => {
        const meta = CATEGORY[g.category];
        return (
          <Reveal key={g.category} i={gi + 2}>
            <Panel title={meta.label} sub={meta.sub} testId={`deliverables-${g.category}`}
              action={<Pill tone={meta.tone}>{fmt(g.items.length, 0)} {g.items.length === 1 ? "وثيقة" : "وثائق"}</Pill>}>
              <div className={cn("grid gap-3", g.items.length > 1 && "lg:grid-cols-2")}>
                {g.items.map((d) => <DocCard key={d.id} doc={d} phases={phases} busy={busy} onAct={act} />)}
              </div>
            </Panel>
          </Reveal>
        );
      })}

      {docs.length === 0 && <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">لا توجد وثائق محفوظة بعد.</p>}

      <ViewerDialog state={viewing} onClose={() => setViewing(null)} restoreFocus={() => opener.current?.focus()} />
    </div>
  );
}

function PhaseMap({ phases, docs }: { phases: ContractPhase[]; docs: Deliverable[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5" dir="rtl">
      {phases.map((p) => {
        const items = docs.filter((d) => d.category !== "contract" && d.category !== "report" && d.phases.includes(p.number));
        const on = items.length > 0;
        return (
          <li key={p.number} className={cn("min-w-0 rounded-xl border p-3", on ? "border-accent/50 bg-accent/10" : "border-dashed border-border bg-background/50")} data-testid={`phase-${p.number}`}
            title={items.map((d) => d.title).join(" · ")}>
            <div className="flex items-center justify-between gap-2">
              <span className={cn("font-display text-[11px] font-semibold tracking-wider", on ? "text-accent" : "text-muted-foreground")}>المرحلة {p.number}</span>
              <span className={cn("font-display rounded-md px-1.5 text-xs font-bold tabular-nums", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{items.length}</span>
            </div>
            <p className={cn("mt-1.5 text-[11px] leading-relaxed", on ? "text-foreground" : "text-muted-foreground")}>{p.title}</p>
          </li>
        );
      })}
    </ol>
  );
}

function DocCard({ doc, phases, busy, onAct }: { doc: Deliverable; phases: ContractPhase[]; busy: Busy; onAct: (d: Deliverable, m: Mode, target: HTMLElement) => void }) {
  const meta = CATEGORY[doc.category];
  const Icon = meta.icon;
  const isBusy = (m: Mode) => busy?.id === doc.id && busy.mode === m;
  const phaseLabel = doc.phases.length === phases.length ? "جميع المراحل" : doc.phases.map((n) => `المرحلة ${n}`).join(" · ");
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-background/60 p-4" data-testid={`doc-${doc.id}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-accent"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={meta.tone}>{meta.label}</Pill>
            {doc.reference && <span className="text-[11px] text-muted-foreground"><bdi>{doc.reference}</bdi></span>}
          </div>
          <h3 className="mt-1.5 text-base font-bold leading-snug text-primary">{doc.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{doc.subtitle}</p>
        </div>
      </div>
      <ul className="mt-3 grid gap-1 text-xs leading-relaxed">
        {doc.highlights.map((h) => (
          <li key={h} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" />{h}</li>
        ))}
      </ul>
      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-card p-2.5 text-center">
        <div><dt className="text-[10px] text-muted-foreground">تاريخ الإصدار</dt><dd className="mt-0.5 text-xs font-semibold tabular-nums">{doc.issuedLabel.replace(/^بدء التنفيذ /, "")}</dd></div>
        <div><dt className="text-[10px] text-muted-foreground">الصفحات</dt><dd className="font-display mt-0.5 text-xs font-semibold tabular-nums">{fmt(doc.pages, 0)}</dd></div>
        <div><dt className="text-[10px] text-muted-foreground">الحجم</dt><dd className="font-display mt-0.5 text-xs font-semibold tabular-nums"><bdi dir="ltr">{mb(doc.sizeBytes)}</bdi></dd></div>
      </dl>
      <div className="mt-3 grid gap-1 text-[11px] leading-relaxed text-muted-foreground">
        <p><span className="font-semibold text-foreground">مراحل العقد: </span>{phaseLabel}</p>
        {doc.contractDeliverable && <p><span className="font-semibold text-foreground">مخرج العقد المقابل: </span>{doc.contractDeliverable}</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={(e) => onAct(doc, "view", e.currentTarget)} disabled={!!busy} data-testid={`button-view-${doc.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {isBusy("view") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} عرض
        </button>
        <button onClick={(e) => onAct(doc, "download", e.currentTarget)} disabled={!!busy} data-testid={`button-download-${doc.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60">
          {isBusy("download") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تنزيل PDF
        </button>
      </div>
    </article>
  );
}

function ViewerDialog({ state, onClose, restoreFocus }: { state: { doc: Deliverable; url: string } | null; onClose: () => void; restoreFocus: () => void }) {
  return (
    <Dialog.Root open={!!state} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[hsl(206_62%_10%/.55)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content dir="rtl" data-testid="dialog-document" onCloseAutoFocus={(e) => { e.preventDefault(); restoreFocus(); }}
          className="fixed inset-x-2 bottom-2 top-[4dvh] z-[71] mx-auto flex max-w-5xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 sm:inset-x-4">
          <div className="h-1.5 sadu opacity-60" />
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[11px] font-semibold tracking-[.16em] text-accent">{state ? CATEGORY[state.doc.category].label : ""}</p>
              <Dialog.Title className="mt-0.5 truncate text-lg font-bold leading-snug text-primary">{state?.doc.title}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                {state ? `${fmt(state.doc.pages, 0)} صفحة · ${state.doc.issuedLabel}` : ""} — إن لم يظهر المستند داخل الإطار على هاتفك، استخدم «فتح في تبويب» أو «تنزيل».
              </Dialog.Description>
            </div>
            {state && (
              <>
                <a href={state.url} target="_blank" rel="noopener" className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted sm:inline-flex" data-testid="button-open-tab">
                  <ExternalLink className="h-3.5 w-3.5" /> فتح في تبويب
                </a>
                <a href={state.url} download={fileName(state.doc)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground" data-testid="button-download-open">
                  <Download className="h-3.5 w-3.5" /> تنزيل
                </a>
              </>
            )}
            <Dialog.Close className="rounded-lg border border-border p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="إغلاق" data-testid="button-close-document">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 bg-muted">
            {state && <iframe key={state.doc.id} src={state.url} title={state.doc.title} className="h-full w-full" />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

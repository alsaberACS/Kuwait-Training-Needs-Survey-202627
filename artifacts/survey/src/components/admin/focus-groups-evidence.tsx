import { createContext, useContext, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FileText, Quote, X, AlertTriangle } from "lucide-react";
import type { FocusGroupEvidence, FocusGroupSource } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export type EvidenceRequest = { title: string; ids: string[]; note?: string };
type Ctx = { open: (r: EvidenceRequest) => void };
export const EvidenceContext = createContext<Ctx>({ open: () => {} });
export const useEvidence = () => useContext(EvidenceContext);

/** Small citation trigger: shows how many cited excerpts sit behind a statement. */
export function CiteButton({ ids, title, note, className, label }: { ids: string[]; title: string; note?: string; className?: string; label?: string }) {
  const { open } = useEvidence();
  if (!ids.length) return <span className={cn("text-[11px] text-muted-foreground", className)}>لا مقتطف مُستشهد</span>;
  return (
    <button type="button" onClick={() => open({ title, ids, note })} data-testid={`button-evidence-${ids[0]}`}
      className={cn("inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-[hsl(32_70%_28%)] transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden", className)}>
      <Quote className="h-3 w-3" />{label ?? "الدليل"} <span className="tabular-nums">({ids.length})</span>
    </button>
  );
}

export function EvidenceDialog({ request, onClose, restoreFocus, evidence, groups }: {
  request: EvidenceRequest | null; onClose: () => void; restoreFocus: () => void; evidence: Map<string, FocusGroupEvidence>; groups: Map<string, FocusGroupSource>;
}) {
  const items = (request?.ids ?? []).map((id) => evidence.get(id)).filter((e): e is FocusGroupEvidence => !!e);
  const missing = (request?.ids.length ?? 0) - items.length;
  return (
    <Dialog.Root open={!!request} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[hsl(206_62%_10%/.55)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content dir="rtl" data-testid="dialog-evidence"
           onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}
          className="fixed inset-x-3 bottom-3 top-[8dvh] z-[71] mx-auto flex max-w-2xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 sm:bottom-auto sm:max-h-[84dvh]">
          <div className="h-1.5 sadu opacity-60" />
          <div className="flex items-start gap-3 border-b border-border p-5">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[11px] font-semibold tracking-[.16em] text-accent">الدليل من السجلات</p>
              <Dialog.Title className="mt-1 text-lg font-bold leading-snug text-primary">{request?.title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {request?.note ?? "المقتطف كما ورد في المصدر بلغته الأصلية، يليه معناه بالعربية كإعادة صياغة تحليلية لا كاقتباس حرفي."}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg border border-border p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="إغلاق" data-testid="button-close-evidence">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-5">
            {items.map((e) => {
              const g = groups.get(e.groupId);
              return (
                <article key={e.id} className="rounded-2xl border border-border bg-background/60 p-4" data-testid={`evidence-${e.id}`}>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-md bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground">{g?.label ?? e.groupId}</span>
                    <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /><bdi dir="ltr" className="font-mono">{g?.sourceFile ?? "—"}</bdi></span>
                    <span>الأسطر <bdi dir="ltr" className="tabular-nums">{e.lineStart === e.lineEnd ? e.lineStart : `${e.lineStart}–${e.lineEnd}`}</bdi></span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5">{e.language === "en" ? "الأصل بالإنجليزية" : "الأصل بالعربية"}</span>
                  </div>
                  <blockquote dir={e.language === "en" ? "ltr" : "rtl"} lang={e.language}
                    className={cn("mt-3 border-accent bg-card p-3 text-sm leading-relaxed", e.language === "en" ? "border-l-4 text-left" : "border-r-4 text-right")}>
                    {e.quote}
                  </blockquote>
                  <p className="mt-3 text-sm leading-relaxed"><span className="font-semibold text-secondary-foreground">المعنى: </span>{e.meaning}</p>
                  {e.caution && <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(14_60%_45%)]" />{e.caution}</p>}
                </article>
              );
            })}
            {items.length === 0 && <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">لم يُعثر على المقتطفات المُشار إليها في هذا التقرير.</p>}
            {missing > 0 && items.length > 0 && <p className="text-[11px] text-muted-foreground">تعذّر عرض <bdi className="tabular-nums">{missing}</bdi> من المراجع المُشار إليها.</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function EvidenceProvider({ value, children }: { value: Ctx; children: ReactNode }) {
  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}

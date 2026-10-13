import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import {
  useListAdminResponses, getListAdminResponsesQueryKey, type SurveyResponse, type ListAdminResponsesParams, type SurveyPath,
} from "@workspace/api-client-react";
import { QUESTION_LABELS, TRACK_LABELS, COURSE_LABELS, LEVEL_LABELS, SUB_LABELS, optionLabel, Q, SKILLS } from "@/lib/survey-definition";
import { cn } from "@/lib/utils";
import { fmt, Panel, Skel, Err, Empty } from "./shared";

export function Responses() {
  const [f, setF] = useState<ListAdminResponsesParams>({ page: 1, pageSize: 20 });
  const [open, setOpen] = useState<SurveyResponse | null>(null);
  const q = useListAdminResponses(f, { query: { queryKey: getListAdminResponsesQueryKey(f), placeholderData: (p) => p } });
  const upd = (p: Partial<ListAdminResponsesParams>) => setF({ ...f, ...p, page: p.page ?? 1 });
  const sel = "h-10 rounded-lg border border-input bg-card px-3 text-sm";
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={f.path ?? ""} onChange={(e) => upd({ path: (e.target.value || undefined) as SurveyPath | undefined })} data-testid="filter-resp-path">
          <option value="">كل المسارات</option><option value="B2B">B2B</option><option value="B2C">B2C</option>
        </select>
        <select className={sel} value={f.status ?? ""} onChange={(e) => upd({ status: (e.target.value || undefined) as ListAdminResponsesParams["status"] })} data-testid="filter-resp-status">
          <option value="">كل الحالات</option><option value="complete">مكتملة</option><option value="draft">مسودة</option>
        </select>
        <select className={sel} value={f.sector ?? ""} onChange={(e) => upd({ sector: e.target.value || undefined })} data-testid="filter-resp-sector">
          <option value="">كل القطاعات</option>{Q.Q5.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select className={sel} value={f.nationality ?? ""} onChange={(e) => upd({ nationality: e.target.value || undefined })} data-testid="filter-resp-nationality">
          <option value="">كل الجنسيات</option>{Q.Q1.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm">
          <input type="checkbox" checked={!!f.hasContact} onChange={(e) => upd({ hasContact: e.target.checked || undefined })} data-testid="filter-resp-contact" /> لديه بيانات تواصل
        </label>
      </div>
      {q.isLoading ? <Skel /> : q.isError || !q.data ? <Err onRetry={() => q.refetch()} /> : !q.data.items.length ? (
        <Empty title="لا توجد ردود مطابقة" text="غيّر عوامل التصفية، أو انتظر وصول الردود الأولى من الميدان." />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>{["التاريخ", "الحالة", "المسار", "القطاع", "الجنسية", "المدة", "التواصل", ""].map((h) => <th key={h} className="px-2 py-2 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {q.data.items.map((r) => {
                  const a = r.answers as Record<string, unknown>;
                  const sector = (a.Q5 as { sector?: string } | undefined)?.sector;
                  return (
                    <tr key={r.id} className="hover:bg-muted/40" data-testid={`row-response-${r.id}`}>
                      <td className="px-2 py-2.5 tabular-nums text-xs">{new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="px-2 py-2.5"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", r.status === "complete" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>{r.status === "complete" ? "مكتملة" : "مسودة"}</span></td>
                      <td className="px-2 py-2.5 font-medium">{r.path ?? "—"}</td>
                      <td className="px-2 py-2.5 text-xs">{sector ? optionLabel("Q5", sector) : "—"}</td>
                      <td className="px-2 py-2.5 text-xs">{a.Q1 ? optionLabel("Q1", String(a.Q1)) : "—"}</td>
                      <td className="px-2 py-2.5 tabular-nums text-xs">{r.durationSec ? `${fmt(r.durationSec / 60)} د` : "—"}</td>
                      <td className="px-2 py-2.5 text-xs">{r.contact?.name || r.contact?.email || r.contact?.phone ? <span dir="auto">{r.contact?.name ?? r.contact?.email ?? r.contact?.phone}</span> : "—"}</td>
                      <td className="px-2 py-2.5"><button onClick={() => setOpen(r)} className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:border-primary" data-testid={`button-open-${r.id}`}>عرض</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground tabular-nums">{q.data.total} رد · صفحة {q.data.page} من {pages}</span>
            <div className="flex gap-1">
              <button disabled={(f.page ?? 1) <= 1} onClick={() => setF({ ...f, page: (f.page ?? 1) - 1 })} className="rounded-lg border border-border p-2 disabled:opacity-40" data-testid="button-prev-page"><ChevronRight className="h-4 w-4" /></button>
              <button disabled={(f.page ?? 1) >= pages} onClick={() => setF({ ...f, page: (f.page ?? 1) + 1 })} className="rounded-lg border border-border p-2 disabled:opacity-40" data-testid="button-next-page"><ChevronLeft className="h-4 w-4" /></button>
            </div>
          </div>
        </Panel>
      )}
      {open && <ResponseDrawer r={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function renderAnswer(qid: string, v: unknown): ReactNode {
  if (v === undefined || v === null) return "—";
  if (qid === "Q5") {
    const x = v as { sector?: string; sub?: string; other?: string };
    return [x.sector && optionLabel("Q5", x.sector), x.sub && (SUB_LABELS[x.sector ?? ""]?.[x.sub] ?? x.sub), x.other].filter(Boolean).join(" · ");
  }
  if (qid === "Q14" || qid === "Q18") {
    const m = v as Record<string, { importance?: number; performance?: number }>;
    return (
      <div className="grid gap-1">
        {SKILLS.map((s) => <div key={s.id} className="flex justify-between gap-3 text-xs"><span>{s.label}</span><span className="shrink-0 tabular-nums">أهمية {m[s.id]?.importance ?? "–"} · أداء {m[s.id]?.performance ?? "–"}</span></div>)}
      </div>
    );
  }
  if (qid === "Q24") return <ol className="list-inside list-decimal text-xs">{(v as string[]).map((t) => <li key={t}>{TRACK_LABELS[t] ?? t}</li>)}</ol>;
  if (qid === "Q25") {
    const m = v as Record<string, number>;
    return (
      <div className="grid gap-1">
        {Object.entries(m).map(([c, l]) => (
          <div key={c} className="flex justify-between gap-3 text-xs"><span>{COURSE_LABELS[c] ?? c}</span>
            <span className={cn("shrink-0 rounded px-1.5", l === 2 ? "bg-accent/25 font-semibold" : l === 1 ? "bg-secondary" : "text-muted-foreground")}>{LEVEL_LABELS[l] ?? l}</span></div>
        ))}
      </div>
    );
  }
  if (Array.isArray(v)) return (v as string[]).map((x) => optionLabel(qid, x)).join("، ");
  return optionLabel(qid, String(v));
}

function ResponseDrawer({ r, onClose }: { r: SurveyResponse; onClose: () => void }) {
  const order = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q14", "Q15", "Q18", "Q19", "Q20", "Q21", "Q22", "Q23", "Q24", "Q25G", "Q25", "Q26"];
  const a = r.answers as Record<string, unknown>;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", damping: 26, stiffness: 240 }}
        onClick={(e) => e.stopPropagation()} className="absolute inset-y-0 start-0 w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl" data-testid="drawer-response">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground" dir="ltr">{r.id}</p>
            <h2 className="mt-1 text-xl font-bold text-primary">رد {r.path ?? ""} · {r.status === "complete" ? "مكتمل" : "مسودة"}</h2>
            <p className="text-xs text-muted-foreground">{r.device ?? "—"} · {r.sourceTag ? `src=${r.sourceTag}` : "بدون مصدر"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted" data-testid="button-close-drawer"><X className="h-5 w-5" /></button>
        </div>
        {(r.contact?.name || r.contact?.email || r.contact?.phone) && (
          <div className="mt-4 rounded-xl ink-panel p-4 text-sm">
            <p className="font-semibold text-accent">بيانات التواصل</p>
            <p className="mt-1">{r.contact?.name}</p>
            <p dir="ltr" className="text-end">{r.contact?.email}</p>
            <p dir="ltr" className="text-end">{r.contact?.phone}</p>
          </div>
        )}
        <dl className="mt-5 divide-y divide-border">
          {order.filter((k) => a[k] !== undefined).map((k) => (
            <div key={k} className="py-3">
              <dt className="text-xs font-semibold text-muted-foreground">{k} · {QUESTION_LABELS[k]}</dt>
              <dd className="mt-1 text-sm">{renderAnswer(k, a[k])}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { updateResponse, type SurveyResponse, type UpdateResponseRequest } from "@workspace/api-client-react";

export type SaveStatus = "dirty" | "saving" | "saved" | "error";

/**
 * One serialized writer for draft autosave and section navigation.
 * A successful older write never marks newer edits as saved.
 */
export function useDraftAutosave({
  id, snapshot, enabled, onSaved,
}: {
  id: string | null;
  snapshot: UpdateResponseRequest;
  enabled: boolean;
  onSaved: (response: SurveyResponse) => void;
}) {
  const [status, setStatus] = useState<SaveStatus>("dirty");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const latest = useRef({ id, snapshot, enabled, key: JSON.stringify(snapshot), onSaved });
  latest.current = { id, snapshot, enabled, key: JSON.stringify(snapshot), onSaved };
  const savedKey = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  const key = latest.current.key;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  const write = useCallback((data: UpdateResponseRequest, responseId: string, force = false) => {
    const writeKey = JSON.stringify(data);
    const request = queue.current.catch(() => undefined).then(async () => {
      if (!latest.current.enabled || latest.current.id !== responseId) return;
      // Debounced work superseded by a newer answer must not overwrite it.
      if (!force && writeKey !== latest.current.key) return;
      if (savedKey.current === writeKey) return;
      if (mounted.current) setStatus("saving");
      try {
        const response = await updateResponse(responseId, data);
        if (latest.current.id !== responseId) return;
        savedKey.current = writeKey;
        latest.current.onSaved(response);
        if (mounted.current) {
          setLastSavedAt(new Date(response.updatedAt));
          setStatus(latest.current.key === writeKey ? "saved" : "dirty");
        }
        return response;
      } catch (error) {
        if (mounted.current && latest.current.id === responseId) {
          setStatus(latest.current.key === writeKey ? "error" : "dirty");
        }
        throw error;
      }
    });
    queue.current = request.catch(() => undefined);
    return request;
  }, []);

  useEffect(() => {
    savedKey.current = null;
    setLastSavedAt(null);
  }, [id]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!enabled || !id) return;
    if (savedKey.current === key) { setStatus("saved"); return; }
    setStatus("dirty");
    timer.current = setTimeout(() => {
      void write(latest.current.snapshot, id).catch(() => undefined);
    }, 650);
    return () => clearTimeout(timer.current);
  }, [id, key, enabled, write]);

  const saveNow = useCallback(async (nextStep?: number) => {
    clearTimeout(timer.current);
    const current = latest.current;
    if (!current.id || !current.enabled) throw new Error("No active draft to save");
    const data = nextStep === undefined ? current.snapshot : { ...current.snapshot, currentStep: nextStep };
    return write(data, current.id, true);
  }, [write]);

  // The warning applies only to unsaved required answers, never optional contact.
  useEffect(() => {
    if (!enabled || status === "saved") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [enabled, status]);

  const visibleStatus = status === "saved" && savedKey.current !== key ? "dirty" : status;
  return { status: visibleStatus as SaveStatus, lastSavedAt, saveNow };
}

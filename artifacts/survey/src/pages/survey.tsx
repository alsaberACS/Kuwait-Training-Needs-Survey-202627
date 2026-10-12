import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Lock, Clock, ShieldCheck, ArrowRight, Loader2, WifiOff, RefreshCw, Sparkles, Copy, Check, Building2, UserRound, Bookmark, Phone, Mail, User } from "lucide-react";
import {
  useCreateResponse, useGetResponse, getGetResponseQueryKey, useUpdateResponse, useCompleteResponse,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  Q, Q5_SUB, SKILLS, TRACKS, SURVEY_TITLE, SURVEY_INTRO, CONSENT_TEXT, CONTACT_INTRO, CONTACT_FIELDS,
  THANK_YOU_TEXT, THANK_YOU_SIGN, SECTION_TITLES, type Answers, type Path,
} from "@/lib/survey-definition";
import {
  STEP_INTRO, STEP_S1, STEP_PATH, STEP_S4, STEP_S5, PROGRESS_LABELS, suggestPath, questionNumbers,
    orderedCourseGroups, selectedCourseGroups, pruneCourseAnswers, defaultTrackOrder, validTrackOrder, validateStep, bookedCourses, EMAIL_RE, validatePhone, ownerAllowed, jobLevelRequired, b2bAllowed, normalizeDraft,
} from "@/lib/survey-logic";
import {
  QuestionShell, SingleChoice, MultiChoice, OptionCard, SkillMatrix, RankList, CourseMatrix, NextIcon,
} from "@/components/survey/controls";
import { SurveyNavigationContext, focusSurveyTarget } from "@/components/survey/navigation";
import { PersonalizedResults } from "@/components/survey/personalized-results";
import { surveyProgress } from "@/lib/survey-progress";
import { useDraftAutosave, type SaveStatus } from "@/hooks/use-draft-autosave";

const LS_KEY = "kw-tna-response-id";
const LS_START = "kw-tna-started";

function Brand({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={`${import.meta.env.BASE_URL}asdc-logo.jpg`}
        alt="شعار مركز عبدالعزيز حمد الصقر للتنمية والتطوير"
        width={72}
        height={72}
        className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain p-1 sm:h-[72px] sm:w-[72px]"
      />
      <div className="leading-tight">
        <p className={cn("text-[13px] font-semibold", light ? "text-white" : "text-foreground")}>غرفة تجارة وصناعة الكويت</p>
        <p className={cn("text-xs", light ? "text-white/70" : "text-muted-foreground")}>مركز عبدالعزيز حمد الصقر للتنمية</p>
      </div>
    </div>
  );
}

function Progress({ step, answers, status, submitted, submitting, savingContact, lastSavedAt }: {
  step: number; answers: Answers; status: SaveStatus; submitted: boolean; submitting: boolean; savingContact: boolean; lastSavedAt: Date | null;
}) {
  const labels = PROGRESS_LABELS(answers.Q7);
  const idx = step - 1;
  const progress = surveyProgress(answers, submitted);
  const reducedMotion = useReducedMotion();
  const saving = submitting || savingContact || (!submitted && status === "saving");
  const message = submitting ? "جارٍ إرسال الاستبانة" : savingContact ? "جارٍ حفظ بيانات التواصل" : submitted ? "الاستبانة مُرسلة" :
    status === "saving" ? "جارٍ حفظ الإجابات" : status === "dirty" ? "تغييرات لم تُحفظ بعد" :
    status === "error" ? "تعذّر الحفظ" : "حُفظت الإجابات";
  return (
    <div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">{submitted ? "اكتملت الاستبانة · التواصل اختياري" : labels[idx]}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground" data-testid="status-autosave" role="status"
            title={!submitted && status === "saved" && lastSavedAt ? `آخر حفظ: ${lastSavedAt.toLocaleTimeString("ar-KW")}` : undefined}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : submitted || status === "saved" ? <Check className="h-3 w-3 text-[hsl(var(--teal))]" /> : status === "error" ? <WifiOff className="h-3 w-3 text-destructive" /> : <Clock className="h-3 w-3" />}
            {message}
          </span>
        </div>
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="تقدم الإجابات المطلوبة"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} data-testid="progress-required">
          <motion.div className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-l from-accent to-[hsl(var(--teal))]"
            initial={false} animate={{ width: `${progress.percent}%` }} transition={{ duration: reducedMotion ? 0 : 0.25 }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground" data-testid="text-required-progress">
          {submitted ? "حُفظت جميع الإجابات المطلوبة · 100٪" : `${progress.completed.toLocaleString("en-US")} من ${progress.total.toLocaleString("en-US")} سؤالاً مطلوباً مكتملاً · ${progress.percent.toLocaleString("en-US")}٪`}
        </p>
        <ol className="mt-2 hidden grid-cols-4 gap-2 sm:grid">
          {labels.map((l, i) => (
            <li key={l} className={cn("flex items-center gap-1.5 text-[11px]", i <= idx ? "text-foreground" : "text-muted-foreground/70")}>
              <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                i < idx ? "bg-[hsl(var(--teal))] text-white" : i === idx ? "bg-accent text-accent-foreground" : "bg-muted")}>
                {i < idx ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : i + 1}
              </span>{l}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SectionHead({ title, kicker, note }: { title: string; kicker: string; note?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 mt-8">
      <p className="font-display text-xs font-semibold uppercase tracking-wider text-accent">{kicker}</p>
      <h2 className="mt-1 text-2xl sm:text-3xl font-bold leading-snug text-primary">{title}</h2>
      {note && <p className="mt-2 text-muted-foreground leading-relaxed">{note}</p>}
      <div className="mt-4 h-[3px] w-16 rounded-full bg-accent" />
    </motion.div>
  );
}

function detectDevice() {
  return /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768 ? "mobile" : "desktop";
}

export default function SurveyPage() {
  const [storedId, setStoredId] = useState<string | null>(() => localStorage.getItem(LS_KEY));
  const [responseId, setResponseId] = useState<string | null>(null);
  const [step, setStep] = useState(STEP_INTRO);
  const [answers, setAnswers] = useState<Answers>({});
  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "+965 " });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [netError, setNetError] = useState<null | (() => void)>(null);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const navigationLock = useRef(false);
  const [resumeHandled, setResumeHandled] = useState(false);
  const [advanceRequest, setAdvanceRequest] = useState<{ questionId: string; targetId?: string; step: number } | null>(null);
  const requestAdvance = (questionId: string, targetId?: string) => setAdvanceRequest({ questionId, targetId, step });

  const createM = useCreateResponse();
  const updateM = useUpdateResponse();
  const completeM = useCompleteResponse();
  const queryClient = useQueryClient();
  const draftSnapshot = useMemo(() => ({
    answers: answers as Record<string, unknown>, path: answers.Q7, currentStep: step, consent: true,
  }), [answers, step]);
  const draftSave = useDraftAutosave({
    id: responseId,
    snapshot: draftSnapshot,
    enabled: !!responseId && step >= STEP_S1 && step < STEP_S5 && !submitted && !done,
    onSaved: (response) => queryClient.setQueryData(getGetResponseQueryKey(response.id), response),
  });

  const resumeQ = useGetResponse(storedId ?? "", {
    query: { enabled: !!storedId && !resumeHandled, queryKey: getGetResponseQueryKey(storedId ?? ""), retry: 1 },
  });

  useEffect(() => {
    if (!storedId || resumeHandled) return;
    if (resumeQ.isError) { localStorage.removeItem(LS_KEY); setStoredId(null); setResumeHandled(true); }
    if (resumeQ.data && resumeQ.data.status === "complete") {
      const r = resumeQ.data;
      setResponseId(r.id);
      setAnswers((r.answers ?? {}) as Answers);
      setConsent(true);
      if (r.contact) setContact({ name: r.contact.name ?? "", email: r.contact.email ?? "", phone: r.contact.phone ?? "+965 " });
      setSubmitted(true);
      setStep(STEP_S5);
      setResumeHandled(true);
    }
  }, [resumeQ.data, resumeQ.isError, storedId, resumeHandled]);

  const showResume = !!storedId && !resumeHandled && resumeQ.data?.status === "draft";
  const checkingResume = !!storedId && !resumeHandled && resumeQ.isLoading;

  const doResume = () => {
    const r = resumeQ.data!;
    setResponseId(r.id);
    const resumed = normalizeDraft(r.answers ?? {});
    setAnswers(resumed);
    setConsent(true);
    if (r.contact) setContact({ name: r.contact.name ?? "", email: r.contact.email ?? "", phone: r.contact.phone ?? "+965 " });
    // Older drafts may have reached contact without being submitted.
    const requestedStep = Math.min(Math.max(r.currentStep || STEP_S1, STEP_S1), STEP_S4);
    setStep(!resumed.Q7 || (jobLevelRequired(resumed) && !resumed.Q6) ? STEP_S1 : requestedStep);
    setResumeHandled(true);
  };
  const startFresh = () => {
    localStorage.removeItem(LS_KEY); setStoredId(null); setResumeHandled(true);
  };

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    setAnswers((a) => {
      const next = { ...a, [k]: v };
      if (k === "Q5" && (!jobLevelRequired(next) || (!ownerAllowed(next) && next.Q6 === "owner"))) delete next.Q6;
      if (k === "Q5" && !b2bAllowed(next) && next.Q7 === "B2B") delete next.Q7;
      return next;
    });
    setErrors((e) => {
      const clearLevelError = k === "Q5" && !jobLevelRequired({ Q5: v as Answers["Q5"] });
      if (!e[k as string] && !(clearLevelError && e.Q6)) return e;
      const n = { ...e };
      delete n[k as string];
      if (clearLevelError) delete n.Q6;
      return n;
    });
  };

  const path = answers.Q7;
  const nums = useMemo(() => questionNumbers(path, answers.Q5?.sector), [path, answers.Q5?.sector]);
  const suggestion = suggestPath(answers);
  const groups = useMemo(() => orderedCourseGroups(answers), [answers.Q7, answers.Q5?.sector, answers.Q6]); // eslint-disable-line react-hooks/exhaustive-deps
  const groupOptions = useMemo(
    () => groups.map((g) => ({
      id: g.id,
      label: g.label,
      description: `${g.courses.length} دورات`,
    })),
    [groups],
  );
  const chosenGroups = selectedCourseGroups(answers);
  const chosenCourseCount = chosenGroups.reduce((n, g) => n + g.courses.length, 0);
  const setGroups = (ids: string[]) => {
    setAnswers((a) => ({ ...a, Q25G: ids, Q25: pruneCourseAnswers(a.Q25, ids) }));
    setErrors((e) => { if (!e.Q25G && !e.Q25) return e; const n = { ...e }; delete n.Q25G; delete n.Q25; return n; });
  };

  useEffect(() => {
    if (step === STEP_S4 && !validTrackOrder(answers.Q24)) set("Q24", defaultTrackOrder());
  }, [step, answers.Q24]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo({ top: 0 }); }, [step, done]); // instant: the 0.3s section crossfade should land on the new section, not mid-scroll

  const begin = async () => {
    if (!consent) { setErrors({ consent: "يلزم الموافقة على المشاركة للمتابعة" }); return; }
    setNetError(null);
    try {
      const src = new URLSearchParams(window.location.search).get("src") ?? undefined;
      const r = responseId ? { id: responseId } : await createM.mutateAsync({ data: { device: detectDevice(), sourceTag: src } });
      if (!responseId) {
        localStorage.setItem(LS_KEY, r.id);
        localStorage.setItem(LS_START, String(Date.now()));
        setResponseId(r.id);
      }
      await updateM.mutateAsync({ id: r.id, data: { consent: true, currentStep: STEP_S1 } });
      setStep(STEP_S1);
    } catch {
      setNetError(() => begin);
    }
  };

  const save = async (nextStep: number) => {
    await draftSave.saveNow(nextStep);
  };

  const next = async () => {
    if (navigationLock.current || submitted) return;
    setAdvanceRequest(null);
    const stages = step === STEP_S4 ? [STEP_S1, STEP_PATH, STEP_S4] : [step];
    const invalid = stages.map((s) => ({ step: s, errors: validateStep(s, answers) }))
      .find((v) => Object.keys(v.errors).length > 0);
    const e = invalid?.errors ?? {};
    setErrors(e);
    if (Object.keys(e).length) {
      if (invalid && invalid.step !== step) setStep(invalid.step);
      const first = Object.keys(e)[0];
      const target = document.getElementById(`q-${first}`);
      if (target) focusSurveyTarget(target);
      return;
    }
    setNetError(null);
    navigationLock.current = true;
    setNavigating(true);
    try {
      if (step === STEP_S4) {
        if (!responseId || !answers.Q7) return;
        const started = Number(localStorage.getItem(LS_START) ?? Date.now());
        await draftSave.saveNow();
        const completed = await completeM.mutateAsync({
          id: responseId,
          data: { path: answers.Q7, answers: answers as Record<string, unknown>, durationSec: Math.max(0, Math.round((Date.now() - started) / 1000)) },
        });
        queryClient.setQueryData(getGetResponseQueryKey(responseId), completed);
        setAnswers((completed.answers ?? {}) as Answers);
        setSubmitted(true);
        finish();
        return;
      } else {
        await save(step + 1);
      }
      setStep(step + 1);
    } catch {
      setNetError(() => next);
    } finally {
      navigationLock.current = false;
      setNavigating(false);
    }
  };

  const contactErrors = () => {
    const e: Record<string, string> = {};
    if (contact.email.trim() && !EMAIL_RE.test(contact.email.trim())) e.email = "صيغة البريد الإلكتروني غير صحيحة";
    const ph = contact.phone.trim();
    if (ph && ph !== "+965" && !validatePhone(ph)) e.phone = "يرجى إدخال رقم صحيح، مثال: +965 5XXX XXXX";
    return e;
  };

  const finish = () => {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_START);
    setDone(true);
  };

  const saveContact = async () => {
    const e = contactErrors();
    setErrors(e);
    if (Object.keys(e).length || !responseId || !submitted) return;
    setNetError(null);
    const ph = contact.phone.trim();
    const c = {
      name: contact.name.trim() || undefined,
      email: contact.email.trim() || undefined,
      phone: ph && ph !== "+965" ? ph : undefined,
    };
    try {
      const updated = await updateM.mutateAsync({
        id: responseId,
        data: { contact: c },
      });
      queryClient.setQueryData(getGetResponseQueryKey(responseId), updated);
      finish();
    } catch {
      setNetError(() => saveContact);
    }
  };

  const back = () => { setAdvanceRequest(null); setErrors({}); setNetError(null); setStep((s) => Math.max(STEP_S1, s - 1)); };
  const busy = createM.isPending || updateM.isPending || completeM.isPending || navigating;

  useEffect(() => {
    if (!advanceRequest || busy || done || advanceRequest.step !== step) return;
    // Wait for the selected state and any dependent options to render before moving.
    const timer = window.setTimeout(() => {
      setAdvanceRequest(null);
      if (advanceRequest.targetId) {
        const target = document.getElementById(advanceRequest.targetId);
        if (target) { focusSurveyTarget(target); return; }
      }
      const questions = Array.from(document.querySelectorAll<HTMLElement>("main [data-survey-question]"));
      const index = questions.findIndex((q) => q.dataset.surveyQuestion === advanceRequest.questionId);
      if (index < 0) return;
      const following = questions[index + 1];
      if (following) focusSurveyTarget(following);
      else if (step < STEP_S5) void next(); // validates and submits before opening optional contact
    }, 300);
    return () => window.clearTimeout(timer);
  }, [advanceRequest, answers, busy, step, done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (done) return <ThankYou answers={answers} />;
  if (checkingResume) return <ResumeSkeleton />;
  if (showResume) return <ResumePrompt step={resumeQ.data?.currentStep ?? 1} path={resumeQ.data?.path ?? undefined} onResume={doResume} onFresh={startFresh} />;
  if (step === STEP_INTRO)
    return (
      <Intro consent={consent} setConsent={(v) => { setConsent(v); setErrors({}); }} error={errors.consent} onStart={begin} busy={busy}
        netError={!!netError} onRetry={() => netError?.()} />
    );

  const booked = bookedCourses(answers);

  return (
    <SurveyNavigationContext.Provider value={requestAdvance}>
    <div className="min-h-[100dvh] paper-bg grain">
      <Progress step={step} answers={answers} status={draftSave.status} submitted={submitted} submitting={completeM.isPending} savingContact={submitted && updateM.isPending} lastSavedAt={draftSave.lastSavedAt} />
      <main className="mx-auto max-w-3xl px-4 pb-40" inert={navigating || completeM.isPending}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.3 }}>
            {step === STEP_S1 && (
              <>
                <SectionHead kicker="01" title={SECTION_TITLES.s1} note="أسئلة قصيرة تساعدنا على فهم موقعك. ننتقل تلقائياً بعد الإجابات الفردية؛ عند تعدد الاختيارات اضغط «السؤال التالي» بعد الانتهاء. يمكنك الرجوع وتعديل إجاباتك." />
                <div className="grid gap-4">
                   <div className="grid gap-4">
                    <QuestionShell id="Q1" num={nums.Q1} title={Q.Q1.text} error={errors.Q1}>
                      <SingleChoice qid="Q1" options={Q.Q1.options} value={answers.Q1} onChange={(v) => set("Q1", v)} />
                    </QuestionShell>
                    <QuestionShell id="Q2" num={nums.Q2} title={Q.Q2.text} error={errors.Q2}>
                      <SingleChoice qid="Q2" options={Q.Q2.options} value={answers.Q2} onChange={(v) => set("Q2", v)} />
                    </QuestionShell>
                  </div>
                  <QuestionShell id="Q3" num={nums.Q3} title={Q.Q3.text} error={errors.Q3}>
                    <SingleChoice qid="Q3" cols={2} options={Q.Q3.options} value={answers.Q3} onChange={(v) => set("Q3", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q4" num={nums.Q4} title={Q.Q4.text} error={errors.Q4}>
                    <SingleChoice qid="Q4" cols={2} options={Q.Q4.options} value={answers.Q4} onChange={(v) => set("Q4", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q5" num={nums.Q5} title={Q.Q5.text} error={errors.Q5}>
                    <div className="grid gap-2.5">
                      {Q.Q5.options.map((op) => {
                        const sel = answers.Q5?.sector === op.id;
                        const sub = Q5_SUB[op.id];
                        return (
                          <div key={op.id}>
                            <OptionCard label={op.label} selected={sel} testId={`option-Q5-${op.id}`}
                              onClick={() => { set("Q5", sel ? answers.Q5 : { sector: op.id }); if (!sub) requestAdvance("Q5"); }} />
                            <AnimatePresence>
                              {sel && sub && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="ms-4 mt-2 border-s-2 border-accent ps-4 pb-1">
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">حدد المجال:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {sub.map((s) => {
                                        const on = answers.Q5?.sub === s.id;
                                        return (
                                          <button key={s.id} type="button" data-testid={`option-Q5-${op.id}-${s.id}`}
                                            onClick={() => { set("Q5", { sector: op.id, sub: s.id, other: s.other ? answers.Q5?.other : undefined }); if (!s.other) requestAdvance("Q5"); }}
                                            className={cn("min-h-[42px] rounded-full border px-4 text-sm transition-all",
                                              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50")}>
                                            {s.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {answers.Q5?.sub === "other" && (
                                      <div>
                                        <input autoFocus value={answers.Q5?.other ?? ""} data-testid="input-Q5-other"
                                          onChange={(e) => set("Q5", { ...answers.Q5, other: e.target.value })}
                                          placeholder="اكتب اسم القطاع أو الجهة"
                                          className="mt-3 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
                                        <button type="button" disabled={!answers.Q5?.other?.trim()} onClick={() => requestAdvance("Q5")} data-testid="next-question-Q5"
                                          className="mt-3 min-h-11 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40">
                                          السؤال التالي
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </QuestionShell>
                  {jobLevelRequired(answers) && <QuestionShell id="Q6" num={nums.Q6} title={Q.Q6.text} error={errors.Q6}>
                     <SingleChoice qid="Q6" options={Q.Q6.options.filter((o) => o.id !== "owner" || ownerAllowed(answers))} value={answers.Q6} onChange={(v) => set("Q6", v)} />
                  </QuestionShell>}
                  <QuestionShell id="Q7" num={nums.Q7} title={Q.Q7.text} error={errors.Q7}
                    hint={suggestion && !answers.Q7 ? "بناءً على إجاباتك، ميّزنا لك المسار الأقرب. أكّد اختيارك بالضغط عليه." : "اختيارك هنا يحدد الأسئلة التالية."}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["B2B", "B2C"] as const).filter((p) => p !== "B2B" || b2bAllowed(answers)).map((p) => {
                        const sel = answers.Q7 === p;
                        const sug = suggestion === p && !answers.Q7;
                        const Icon = p === "B2B" ? Building2 : UserRound;
                        const op = Q.Q7.options.find((x) => x.id === p)!;
                        return (
                          <motion.button key={p} type="button" whileTap={{ scale: 0.98 }} onClick={() => { set("Q7", p); requestAdvance("Q7"); }} data-testid={`option-Q7-${p}`}
                            className={cn("relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 p-5 text-start transition-all",
                              sel ? "border-primary ink-panel shadow-xl" : sug ? "border-accent bg-accent/[.07] ring-4 ring-accent/15" : "border-border bg-background hover:border-primary/40")}>
                            {sel && <div className="absolute -start-6 -top-6 h-24 w-24 sadu opacity-15 rotate-12" />}
                            <div className="flex w-full items-center justify-between">
                              <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", sel ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground")}>
                                <Icon className="h-5 w-5" />
                              </span>
                              <span className={cn("font-display text-2xl font-bold", sel ? "text-accent" : "text-primary/25")}>{p}</span>
                            </div>
                            <span className="font-semibold leading-relaxed">{op.label}</span>
                            <span className={cn("text-sm leading-relaxed", sel ? "text-white/75" : "text-muted-foreground")}>{Q.Q7.descriptions[p]}</span>
                            {sug && <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground"><Sparkles className="h-3 w-3" /> مقترح لك</span>}
                          </motion.button>
                        );
                      })}
                    </div>
                  </QuestionShell>
                </div>
              </>
            )}

            {step === STEP_PATH && path === "B2B" && (
              <>
                <SectionHead kicker="02 · B2B" title={SECTION_TITLES.s2} note="أسئلة موجهة لصنّاع القرار حول احتياجات مؤسستكم وفرق العمل." />
                <div className="grid gap-4">
                  <QuestionShell id="Q8" num={nums.Q8} title={Q.Q8.text} error={errors.Q8}>
                    <SingleChoice qid="Q8" cols={2} options={Q.Q8.options} value={answers.Q8} onChange={(v) => set("Q8", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q9" num={nums.Q9} title={Q.Q9.text} error={errors.Q9}>
                    <SingleChoice qid="Q9" options={Q.Q9.options} value={answers.Q9} onChange={(v) => set("Q9", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q14" num={nums.Q14} title={Q.Q14.text} hint="قيّم كل مهارة مرتين: أهميتها، ثم مستوى الأداء الحالي" error={errors.Q14}>
                    <SkillMatrix qid="Q14" skills={SKILLS} value={answers.Q14} onChange={(v) => set("Q14", v)} impLabel={Q.Q14.importance} perfLabel={Q.Q14.performance} showMissing={!!errors.Q14} />
                  </QuestionShell>
                </div>
              </>
            )}

            {step === STEP_PATH && path === "B2C" && (
              <>
                <SectionHead kicker="02 · B2C" title={SECTION_TITLES.s3} note="أسئلة عنك وعن طموحك المهني. لا توجد إجابة صحيحة أو خاطئة." />
                <div className="grid gap-4">
                  <QuestionShell id="Q18" num={nums.Q18} title={Q.Q18.text} hint="قيّم كل مهارة مرتين: أهميتها لك، ثم أداؤك الحالي" error={errors.Q18}>
                    <SkillMatrix qid="Q18" skills={SKILLS} value={answers.Q18} onChange={(v) => set("Q18", v)} impLabel={Q.Q18.importance} perfLabel={Q.Q18.performance} showMissing={!!errors.Q18} />
                  </QuestionShell>
                </div>
              </>
            )}

            {step === STEP_S4 && (
              <>
                <SectionHead kicker="03" title={SECTION_TITLES.s4} note="اقتربنا من النهاية. هنا نتعرف على تفضيلاتك والدورات التي تهمك." />
                <div className="grid gap-4">
                   <QuestionShell id="Q19" num={nums.Q19} title={Q.Q19.text} hint="يمكنك اختيار أكثر من خيار" error={errors.Q19}>
                     <MultiChoice qid="Q19" cols={2} options={Q.Q19.options} value={answers.Q19} onChange={(v) => set("Q19", v)} />
                  </QuestionShell>
                   <QuestionShell id="Q20" num={nums.Q20} title={Q.Q20.text} hint="يمكنك اختيار أكثر من خيار" error={errors.Q20}>
                     <MultiChoice qid="Q20" cols={2} options={Q.Q20.options} value={answers.Q20} onChange={(v) => set("Q20", v)} />
                  </QuestionShell>
                  <div className="grid gap-4 sm:grid-cols-2">
                     <QuestionShell id="Q21" num={nums.Q21} title={Q.Q21.text} hint="يمكنك اختيار أكثر من خيار" error={errors.Q21}>
                       <MultiChoice qid="Q21" options={Q.Q21.options} value={answers.Q21} onChange={(v) => set("Q21", v)} />
                    </QuestionShell>
                    <QuestionShell id="Q22" num={nums.Q22} title={Q.Q22.text} error={errors.Q22}>
                      <SingleChoice qid="Q22" options={Q.Q22.options} value={answers.Q22} onChange={(v) => set("Q22", v)} />
                    </QuestionShell>
                  </div>
                   <QuestionShell id="Q24" num={nums.Q24} title={Q.Q24.text} hint={Q.Q24.hint} error={errors.Q24}>
                    <RankList tracks={TRACKS} value={validTrackOrder(answers.Q24) ? answers.Q24 : defaultTrackOrder()} onChange={(v) => set("Q24", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q25G" num={nums.Q25G} title={Q.Q25G.text} hint={Q.Q25G.hint} error={errors.Q25G}>
                    <MultiChoice qid="Q25G" cols={2} options={groupOptions} value={answers.Q25G} onChange={setGroups} />
                  </QuestionShell>
                  <QuestionShell
                    id="Q25" num={nums.Q25} title={Q.Q25.text} error={errors.Q25}
                    hint={chosenGroups.length
                      ? `نعرض لك ${chosenCourseCount} دورة ضمن ${chosenGroups.length === 1 ? "المسار الذي اخترته" : "المسارات التي اخترتها"} فقط. غيّر اختيار المسارات أعلاه في أي وقت.`
                      : "اختر مساراً تدريبياً واحداً على الأقل في السؤال السابق لتظهر دوراته هنا."}
                  >
                    {chosenGroups.length ? (
                      <CourseMatrix groups={chosenGroups} value={answers.Q25} onChange={(v) => set("Q25", v)} showMissing={!!errors.Q25} />
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground" data-testid="text-courses-placeholder">
                        لم تختر أي مسار بعد — ستظهر الدورات هنا فور اختيارك للمسارات التي تهمك.
                      </div>
                    )}
                  </QuestionShell>
                  <QuestionShell id="Q26" num={nums.Q26} title={Q.Q26.text} error={errors.Q26}>
                     <MultiChoice qid="Q26" max={Q.Q26.max} options={Q.Q26.options} value={answers.Q26} onChange={(v) => set("Q26", v)} />
                  </QuestionShell>
                </div>
              </>
            )}

            {step === STEP_S5 && (
              <>
                <div className="mb-5 mt-8 flex items-start gap-3 rounded-2xl border border-[hsl(var(--teal)/.35)] bg-secondary/60 p-5" role="status" data-testid="status-survey-submitted">
                  <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[hsl(var(--teal))]" />
                  <div>
                    <p className="font-semibold text-primary">تم إرسال إجابات الاستبانة بنجاح</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">بيانات التواصل اختيارية. يمكنك إضافتها الآن أو إنهاء المشاركة أو إغلاق الصفحة؛ إجاباتك مُرسلة ومحفوظة بالفعل.</p>
                  </div>
                </div>
                <PersonalizedResults answers={answers} />
                <SectionHead kicker="04" title={SECTION_TITLES.s5} note={CONTACT_INTRO} />
                {booked.length > 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-5 overflow-hidden rounded-2xl ink-panel p-6" data-testid="card-booked">
                    <div className="absolute -end-10 -top-10 h-40 w-40 sadu opacity-10 rotate-12" />
                    <p className="flex items-center gap-2 text-sm font-semibold text-accent"><Bookmark className="h-4 w-4" /> اخترت الحجز الفوري لـ {booked.length} {booked.length === 1 ? "دورة" : "دورات"}</p>
                    <ul className="mt-3 grid gap-2">
                      {booked.map((c) => (
                        <li key={c.id} className="flex items-start gap-2 rounded-lg bg-white/[.06] px-3 py-2 text-[15px]"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{c.label}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm leading-relaxed text-white/80">لنحجز لك مقعداً في أقرب دفعة، اترك وسيلة تواصل واحدة على الأقل وسيتواصل معك فريق المركز مباشرة.</p>
                  </motion.div>
                ) : (
                  <div className="mb-5 rounded-2xl border border-dashed border-accent/50 bg-accent/[.06] p-5 text-sm leading-relaxed">
                    هل ترغب في استلام جدول الدورات القادمة وخصم التسجيل المبكر؟ اترك بياناتك أدناه، أو أنهِ المشاركة دون إضافة بيانات.
                  </div>
                )}
                <div className="grid gap-4 rounded-2xl border border-card-border bg-card p-5 sm:p-7">
                  <Field icon={User} label={CONTACT_FIELDS.name} value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} testId="input-name" />
                  <Field icon={Mail} label={CONTACT_FIELDS.email} value={contact.email} type="email" ltr error={errors.email} onChange={(v) => { setContact({ ...contact, email: v }); setErrors({}); }} testId="input-email" placeholder="name@company.com" />
                  <Field icon={Phone} label={CONTACT_FIELDS.phone} value={contact.phone} type="tel" ltr error={errors.phone} onChange={(v) => { setContact({ ...contact, phone: v }); setErrors({}); }} testId="input-phone" placeholder="+965 5XXX XXXX" />
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> تُستخدم بياناتك للتواصل بشأن البرامج التدريبية فقط.</p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
          <AnimatePresence>
            {!submitted && draftSave.status === "error" && !netError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert"
                className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
                data-testid="alert-autosave">
                <WifiOff className="h-5 w-5 shrink-0 text-destructive" />
                <span className="flex-1">تعذّر حفظ آخر تغييراتك. لا تغلق الصفحة حتى يكتمل الحفظ.</span>
                <button type="button" onClick={() => { void draftSave.saveNow().catch(() => undefined); }}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 font-semibold"
                  data-testid="button-retry-save"><RefreshCw className="h-4 w-4" /> إعادة الحفظ</button>
              </motion.div>
            )}
          {netError && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-destructive text-destructive-foreground">
              <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5 text-sm" data-testid="status-network-error">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span className="flex-1">{submitted ? "تعذّر حفظ بيانات التواصل. إجابات الاستبانة مُرسلة بالفعل؛ أعد المحاولة أو أنهِ المشاركة دون إضافة بيانات." : "تعذّر حفظ إجاباتك. تحقق من الاتصال ثم أعد المحاولة. لا تغلق الصفحة حتى يكتمل الحفظ."}</span>
                <button onClick={() => netError()} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-medium" data-testid="button-retry">
                  <RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className={cn("mx-auto flex max-w-3xl items-center gap-3 px-4 py-3", step === STEP_S5 && "flex-col sm:flex-row")}>
          {step > STEP_S1 && !submitted && (
            <button onClick={back} disabled={busy} className="flex h-13 items-center gap-1.5 rounded-xl border border-border px-4 py-3.5 font-medium hover:bg-muted" data-testid="button-back">
              <ArrowRight className="h-4 w-4" /> السابق
            </button>
          )}
          {step === STEP_S5 && submitted && (
            <button type="button" onClick={finish} disabled={busy} className="min-h-11 w-full rounded-xl border border-border px-3 py-3 text-sm font-medium hover:bg-muted sm:w-auto" data-testid="button-skip-contact">
              إنهاء دون إضافة بيانات
            </button>
          )}
          {Object.keys(errors).length > 0 && step !== STEP_S5 && (
            <span className="hidden text-sm text-destructive sm:block">بعض الأسئلة بحاجة إلى إجابة</span>
          )}
          <button
            onClick={step === STEP_S5 ? saveContact : next} disabled={busy}
            className={cn("ms-auto flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[.98] disabled:opacity-70 sm:flex-none sm:min-w-48", step === STEP_S5 && "w-full sm:w-auto")}
            data-testid={step === STEP_S5 ? "button-submit" : "button-next"}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : step === STEP_S5 ? <>حفظ بيانات التواصل <Check className="h-5 w-5" /></> : <>التالي <NextIcon /></>}
          </button>
        </div>
      </div>
    </div>
    </SurveyNavigationContext.Provider>
  );
}

function Field({
  icon: Icon, label, value, onChange, type = "text", ltr, error, testId, placeholder,
}: {
  icon: typeof User; label: string; value: string; onChange: (v: string) => void; type?: string; ltr?: boolean;
  error?: string; testId: string; placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium">{label} <span className="text-xs text-muted-foreground">(اختياري)</span></span>
      <div className={cn("flex items-center gap-2 rounded-xl border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30", error ? "border-destructive" : "border-input")}>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={ltr ? "ltr" : undefined} placeholder={placeholder}
          className={cn("h-12 min-w-0 w-full flex-1 bg-transparent outline-none", ltr && "text-end")} data-testid={testId} />
      </div>
      {error && <span className="mt-1 block text-sm text-destructive">{error}</span>}
    </label>
  );
}

function Intro({ consent, setConsent, error, onStart, busy, netError, onRetry }: {
  consent: boolean; setConsent: (v: boolean) => void; error?: string; onStart: () => void; busy: boolean; netError: boolean; onRetry: () => void;
}) {
  return (
    <div className="min-h-[100dvh] grain bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative overflow-hidden ink-panel px-6 pb-14 pt-6 sm:px-10 lg:min-h-[100dvh] lg:pb-10">
        <div className="absolute inset-x-0 bottom-0 h-3 sadu opacity-80" />
        <div className="absolute -start-24 top-1/3 h-72 w-72 rounded-full bg-[hsl(var(--teal)/.25)] blur-3xl" />
        <Brand light />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative mt-12 lg:mt-28 max-w-xl">
          <p className="font-display text-sm font-medium tracking-wide text-accent">دراسة وطنية · 2026/2027</p>
          <h1 className="mt-3 text-[1.9rem] sm:text-5xl font-bold leading-[1.35] text-white">{SURVEY_TITLE}</h1>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/80">
            <span className="flex items-center gap-2 rounded-full bg-white/[.08] px-3 py-1.5"><Clock className="h-4 w-4 text-accent" /> 5 إلى 7 دقائق</span>
            <span className="flex items-center gap-2 rounded-full bg-white/[.08] px-3 py-1.5"><ShieldCheck className="h-4 w-4 text-accent" /> إجابات سرية تماماً</span>
            <span className="flex items-center gap-2 rounded-full bg-white/[.08] px-3 py-1.5"><Sparkles className="h-4 w-4 text-accent" /> أسئلة تتكيف مع إجاباتك</span>
          </div>
        </motion.div>
      </div>
      <div className="relative -mt-6 rounded-t-3xl bg-background px-6 py-8 sm:px-10 lg:mt-0 lg:flex lg:items-center lg:rounded-none">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="mx-auto max-w-lg">
          <p className="text-[17px] leading-[2] text-foreground/90" data-testid="text-intro">{SURVEY_INTRO}</p>
          <ol className="mt-6 grid gap-2 text-sm">
            {["معلومات عامة عنك", "أسئلة مخصصة لمسارك: مؤسسة أو فرد", "تفضيلاتك والدورات التي تهمك", "بيانات التواصل (اختياري)"].map((s, i) => (
              <motion.li key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-3">
                <span className="font-display flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">{i + 1}</span>{s}
              </motion.li>
            ))}
          </ol>
          <button type="button" onClick={() => setConsent(!consent)} data-testid="checkbox-consent"
            className={cn("mt-8 flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-start transition-all",
              consent ? "border-primary bg-primary/[.05]" : error ? "border-destructive/60" : "border-border hover:border-primary/40")}>
            <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all", consent ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
              {consent && <Check className="h-4 w-4 animate-pop" strokeWidth={3} />}
            </span>
            <span className="text-[15px] leading-relaxed">{CONSENT_TEXT}</span>
          </button>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {netError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" data-testid="status-network-error">
              <WifiOff className="h-4 w-4" /><span className="flex-1">تعذّر الاتصال بالخادم.</span>
              <button onClick={onRetry} className="font-semibold underline" data-testid="button-retry">إعادة المحاولة</button>
            </div>
          )}
          <button onClick={onStart} disabled={busy} data-testid="button-start"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-transform active:scale-[.98] disabled:opacity-70">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>ابدأ الاستبانة <NextIcon /></>}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function ResumeSkeleton() {
  return (
    <div className="min-h-[100dvh] paper-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function ResumePrompt({ step, path, onResume, onFresh }: { step: number; path?: Path; onResume: () => void; onFresh: () => void }) {
  const labels = PROGRESS_LABELS(path);
  const s = Math.min(Math.max(step, 1), 4);
  return (
    <div className="min-h-[100dvh] paper-bg grain flex items-center justify-center p-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-card-border bg-card p-7 shadow-2xl shadow-primary/10" data-testid="card-resume">
        <Brand />
        <h1 className="mt-8 text-2xl font-bold text-primary">أهلاً بعودتك</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">احتفظنا بإجاباتك السابقة. يمكنك المتابعة من حيث توقفت.</p>
        <div className="mt-6 grid grid-cols-4 gap-1.5">
          {labels.map((l, i) => <div key={l} className={cn("h-1.5 rounded-full", i < s - 1 ? "bg-[hsl(var(--teal))]" : i === s - 1 ? "bg-accent" : "bg-muted")} />)}
        </div>
        <p className="mt-2 text-sm">التوقف عند: <span className="font-semibold">{labels[s - 1]}</span></p>
        <button onClick={onResume} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground" data-testid="button-resume">
          متابعة الاستبانة <NextIcon />
        </button>
        <button onClick={onFresh} className="mt-2 w-full rounded-xl py-3 text-sm font-medium text-muted-foreground hover:bg-muted" data-testid="button-start-fresh">
          البدء من جديد
        </button>
      </motion.div>
    </div>
  );
}

function ThankYou({ answers }: { answers: Answers }) {
  const redirectUrl = "https://health.acs-kw.com/api/c";
  useEffect(() => {
    window.location.replace(redirectUrl);
  }, []);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const copy = async () => {
    const url = window.location.origin + import.meta.env.BASE_URL;
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked */ }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };
  return (
    <div className="relative min-h-[100dvh] overflow-hidden ink-panel grain flex items-center justify-center p-6">
      <div className="absolute inset-x-0 top-0 h-3 sadu opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-3 sadu opacity-80" />
      <div className="absolute -end-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -start-32 bottom-0 h-96 w-96 rounded-full bg-[hsl(var(--teal)/.3)] blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative w-full max-w-3xl text-center">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 12 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-2xl shadow-accent/30">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 text-2xl sm:text-3xl font-semibold leading-[1.8] text-white" data-testid="text-thank-you">
          {THANK_YOU_TEXT}
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 font-display text-accent">— {THANK_YOU_SIGN}</motion.p>
        <a href={redirectUrl} data-testid="link-post-submit"
          className="mx-auto mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-primary">
          متابعة
        </a>
        <div className="mt-8 rounded-2xl bg-background p-4 text-start text-foreground sm:p-6">
          <PersonalizedResults answers={answers} />
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-10 rounded-2xl border border-white/10 bg-white/[.05] p-5">
          <p className="text-sm text-white/75">صوت زملائك يصنع الفرق أيضاً. شارك الاستبانة معهم.</p>
          <button onClick={copy} className="mx-auto mt-3 flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-primary transition-transform active:scale-95" data-testid="button-copy-link">
            {copied ? <><Check className="h-4 w-4" /> تم نسخ الرابط</> : <><Copy className="h-4 w-4" /> نسخ رابط الاستبانة</>}
          </button>
        </motion.div>
        <div className="mt-10 flex justify-center opacity-80"><Brand light /></div>
      </motion.div>
    </div>
  );
}

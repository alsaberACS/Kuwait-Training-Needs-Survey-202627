import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  orderedCourseGroups, defaultTrackOrder, validateStep, bookedCourses, EMAIL_RE, validatePhone,
} from "@/lib/survey-logic";
import {
  QuestionShell, SingleChoice, MultiChoice, OptionCard, SkillMatrix, RankList, CourseMatrix, NextIcon,
} from "@/components/survey/controls";

const LS_KEY = "kw-tna-response-id";
const LS_START = "kw-tna-started";

function Brand({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-primary">
        <div className="absolute inset-0 sadu opacity-60" />
        <div className="absolute inset-[7px] rounded-md bg-primary flex items-center justify-center font-display text-[11px] font-bold text-accent">ASDC</div>
      </div>
      <div className="leading-tight">
        <p className={cn("text-[13px] font-semibold", light ? "text-white" : "text-foreground")}>غرفة تجارة وصناعة الكويت</p>
        <p className={cn("text-xs", light ? "text-white/70" : "text-muted-foreground")}>مركز عبدالعزيز حمد الصقر للتنمية</p>
      </div>
    </div>
  );
}

function Progress({ step, path, saving }: { step: number; path?: Path; saving: boolean }) {
  const labels = PROGRESS_LABELS(path);
  const idx = step - 1;
  const pct = Math.min(100, ((idx + 0.5) / labels.length) * 100);
  return (
    <div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">{labels[idx]}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground" data-testid="status-autosave">
            {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> جارٍ الحفظ</> : <><Check className="h-3 w-3 text-[hsl(var(--teal))]" /> محفوظ تلقائياً</>}
          </span>
        </div>
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-l from-accent to-[hsl(var(--teal))]"
            initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
        </div>
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
  const [resumeHandled, setResumeHandled] = useState(false);

  const createM = useCreateResponse();
  const updateM = useUpdateResponse();
  const completeM = useCompleteResponse();

  const resumeQ = useGetResponse(storedId ?? "", {
    query: { enabled: !!storedId && !resumeHandled, queryKey: getGetResponseQueryKey(storedId ?? ""), retry: 1 },
  });

  useEffect(() => {
    if (!storedId || resumeHandled) return;
    if (resumeQ.isError) { localStorage.removeItem(LS_KEY); setStoredId(null); setResumeHandled(true); }
    if (resumeQ.data && resumeQ.data.status === "complete") {
      localStorage.removeItem(LS_KEY); setStoredId(null); setResumeHandled(true);
    }
  }, [resumeQ.data, resumeQ.isError, storedId, resumeHandled]);

  const showResume = !!storedId && !resumeHandled && resumeQ.data?.status === "draft";
  const checkingResume = !!storedId && !resumeHandled && resumeQ.isLoading;

  const doResume = () => {
    const r = resumeQ.data!;
    setResponseId(r.id);
    setAnswers((r.answers ?? {}) as Answers);
    setConsent(true);
    if (r.contact) setContact({ name: r.contact.name ?? "", email: r.contact.email ?? "", phone: r.contact.phone ?? "+965 " });
    setStep(Math.min(Math.max(r.currentStep || STEP_S1, STEP_S1), STEP_S5));
    setResumeHandled(true);
  };
  const startFresh = () => {
    localStorage.removeItem(LS_KEY); setStoredId(null); setResumeHandled(true);
  };

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    setErrors((e) => { if (!e[k as string]) return e; const n = { ...e }; delete n[k as string]; return n; });
  };

  const path = answers.Q7;
  const nums = useMemo(() => questionNumbers(path), [path]);
  const suggestion = suggestPath(answers);
  const groups = useMemo(() => orderedCourseGroups(answers), [answers.Q7, answers.Q5?.sector, answers.Q6]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step === STEP_S4 && !answers.Q24) set("Q24", defaultTrackOrder());
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, done]);

  const begin = async () => {
    if (!consent) { setErrors({ consent: "يلزم الموافقة على المشاركة للمتابعة" }); return; }
    setNetError(null);
    try {
      const src = new URLSearchParams(window.location.search).get("src") ?? undefined;
      const r = await createM.mutateAsync({ data: { device: detectDevice(), sourceTag: src } });
      localStorage.setItem(LS_KEY, r.id);
      localStorage.setItem(LS_START, String(Date.now()));
      setResponseId(r.id);
      await updateM.mutateAsync({ id: r.id, data: { consent: true, currentStep: STEP_S1 } }).catch(() => undefined);
      setStep(STEP_S1);
    } catch {
      setNetError(() => begin);
    }
  };

  const save = async (nextStep: number) => {
    if (!responseId) return;
    await updateM.mutateAsync({
      id: responseId,
      data: { answers: answers as Record<string, unknown>, path: answers.Q7, currentStep: nextStep, consent: true },
    });
  };

  const next = async () => {
    const e = validateStep(step, answers);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`q-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setNetError(null);
    try {
      await save(step + 1);
      setStep(step + 1);
    } catch {
      setNetError(() => next);
    }
  };

  const contactErrors = () => {
    const e: Record<string, string> = {};
    if (contact.email.trim() && !EMAIL_RE.test(contact.email.trim())) e.email = "صيغة البريد الإلكتروني غير صحيحة";
    const ph = contact.phone.trim();
    if (ph && ph !== "+965" && !validatePhone(ph)) e.phone = "يرجى إدخال رقم صحيح، مثال: +965 5XXX XXXX";
    return e;
  };

  const submit = async () => {
    const e = contactErrors();
    setErrors(e);
    if (Object.keys(e).length || !responseId || !answers.Q7) return;
    setNetError(null);
    const ph = contact.phone.trim();
    const c = {
      name: contact.name.trim() || undefined,
      email: contact.email.trim() || undefined,
      phone: ph && ph !== "+965" ? ph : undefined,
    };
    const started = Number(localStorage.getItem(LS_START) ?? Date.now());
    try {
      await completeM.mutateAsync({
        id: responseId,
        data: { path: answers.Q7, answers: answers as Record<string, unknown>, contact: c, durationSec: Math.round((Date.now() - started) / 1000) },
      });
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_START);
      setDone(true);
    } catch {
      setNetError(() => submit);
    }
  };

  const back = () => { setErrors({}); setNetError(null); setStep((s) => Math.max(STEP_S1, s - 1)); };
  const busy = createM.isPending || updateM.isPending || completeM.isPending;

  if (done) return <ThankYou />;
  if (checkingResume) return <ResumeSkeleton />;
  if (showResume) return <ResumePrompt step={resumeQ.data?.currentStep ?? 1} path={resumeQ.data?.path ?? undefined} onResume={doResume} onFresh={startFresh} />;
  if (step === STEP_INTRO)
    return (
      <Intro consent={consent} setConsent={(v) => { setConsent(v); setErrors({}); }} error={errors.consent} onStart={begin} busy={busy}
        netError={!!netError} onRetry={() => netError?.()} />
    );

  const booked = bookedCourses(answers);

  return (
    <div className="min-h-[100dvh] paper-bg grain">
      <Progress step={step} path={path} saving={updateM.isPending} />
      <main className="mx-auto max-w-3xl px-4 pb-40">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.3 }}>
            {step === STEP_S1 && (
              <>
                <SectionHead kicker="01" title={SECTION_TITLES.s1} note="سبعة أسئلة قصيرة تساعدنا على فهم موقعك، وتحدد الأسئلة الأنسب لك في الخطوة التالية." />
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                              onClick={() => set("Q5", sel ? answers.Q5 : { sector: op.id })} />
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
                                            onClick={() => set("Q5", { sector: op.id, sub: s.id, other: s.other ? answers.Q5?.other : undefined })}
                                            className={cn("min-h-[42px] rounded-full border px-4 text-sm transition-all",
                                              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50")}>
                                            {s.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {answers.Q5?.sub === "other" && (
                                      <input autoFocus value={answers.Q5?.other ?? ""} data-testid="input-Q5-other"
                                        onChange={(e) => set("Q5", { ...answers.Q5, other: e.target.value })}
                                        placeholder="اكتب اسم القطاع أو الجهة"
                                        className="mt-3 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
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
                  <QuestionShell id="Q6" num={nums.Q6} title={Q.Q6.text} error={errors.Q6}>
                    <SingleChoice qid="Q6" options={Q.Q6.options} value={answers.Q6} onChange={(v) => set("Q6", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q7" num={nums.Q7} title={Q.Q7.text} error={errors.Q7}
                    hint={suggestion && !answers.Q7 ? "بناءً على إجاباتك، ميّزنا لك المسار الأقرب. أكّد اختيارك بالضغط عليه." : "اختيارك هنا يحدد الأسئلة التالية."}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["B2B", "B2C"] as const).map((p) => {
                        const sel = answers.Q7 === p;
                        const sug = suggestion === p && !answers.Q7;
                        const Icon = p === "B2B" ? Building2 : UserRound;
                        const op = Q.Q7.options.find((x) => x.id === p)!;
                        return (
                          <motion.button key={p} type="button" whileTap={{ scale: 0.98 }} onClick={() => set("Q7", p)} data-testid={`option-Q7-${p}`}
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
                  <QuestionShell id="Q10" num={nums.Q10} title={Q.Q10.text} hint="يمكنك اختيار أكثر من خيار" error={errors.Q10}>
                    <MultiChoice qid="Q10" options={Q.Q10.options} value={answers.Q10} onChange={(v) => set("Q10", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q11" num={nums.Q11} title={Q.Q11.text} error={errors.Q11}>
                    <MultiChoice qid="Q11" max={2} options={Q.Q11.options} value={answers.Q11} onChange={(v) => set("Q11", v)} />
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
                  <QuestionShell id="Q15" num={nums.Q15} title={Q.Q15.text} hint="يمكنك اختيار أكثر من خيار" error={errors.Q15}>
                    <MultiChoice qid="Q15" options={Q.Q15.options} value={answers.Q15} onChange={(v) => set("Q15", v)} />
                  </QuestionShell>
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
                  <QuestionShell id="Q19" num={nums.Q19} title={Q.Q19.text} error={errors.Q19}>
                    <SingleChoice qid="Q19" cols={2} options={Q.Q19.options} value={answers.Q19} onChange={(v) => set("Q19", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q20" num={nums.Q20} title={Q.Q20.text} error={errors.Q20}>
                    <SingleChoice qid="Q20" cols={2} options={Q.Q20.options} value={answers.Q20} onChange={(v) => set("Q20", v)} />
                  </QuestionShell>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <QuestionShell id="Q21" num={nums.Q21} title={Q.Q21.text} error={errors.Q21}>
                      <SingleChoice qid="Q21" options={Q.Q21.options} value={answers.Q21} onChange={(v) => set("Q21", v)} />
                    </QuestionShell>
                    <QuestionShell id="Q22" num={nums.Q22} title={Q.Q22.text} error={errors.Q22}>
                      <SingleChoice qid="Q22" options={Q.Q22.options} value={answers.Q22} onChange={(v) => set("Q22", v)} />
                    </QuestionShell>
                  </div>
                  <QuestionShell id="Q23" num={nums.Q23} title={Q.Q23.text} error={errors.Q23}>
                    <SingleChoice qid="Q23" cols={2} options={Q.Q23.options} value={answers.Q23} onChange={(v) => set("Q23", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q24" num={nums.Q24} title={Q.Q24.text} hint="اسحب البطاقات أو استخدم الأسهم. الأعلى هو الأهم." error={errors.Q24}>
                    <RankList tracks={TRACKS} value={answers.Q24 ?? defaultTrackOrder()} onChange={(v) => set("Q24", v)} />
                  </QuestionShell>
                  <QuestionShell id="Q25" num={nums.Q25} title={Q.Q25.text} hint="رتّبنا المجالات حسب مسارك. يمكنك طي أي مجال لا يهمك بضغطة واحدة." error={errors.Q25}>
                    <CourseMatrix groups={groups} value={answers.Q25} onChange={(v) => set("Q25", v)} showMissing={!!errors.Q25} />
                  </QuestionShell>
                  <QuestionShell id="Q26" num={nums.Q26} title={Q.Q26.text} error={errors.Q26}>
                    <MultiChoice qid="Q26" max={2} options={Q.Q26.options} value={answers.Q26} onChange={(v) => set("Q26", v)} />
                  </QuestionShell>
                </div>
              </>
            )}

            {step === STEP_S5 && (
              <>
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
                    هل ترغب في استلام جدول الدورات القادمة وخصم التسجيل المبكر؟ اترك بياناتك أدناه، أو أرسل الاستبانة مباشرة.
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
          {netError && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-destructive text-destructive-foreground">
              <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5 text-sm" data-testid="status-network-error">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span className="flex-1">تعذّر حفظ إجاباتك. تحقق من الاتصال ثم أعد المحاولة، إجاباتك محفوظة على جهازك.</span>
                <button onClick={() => netError()} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-medium" data-testid="button-retry">
                  <RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          {step > STEP_S1 && (
            <button onClick={back} disabled={busy} className="flex h-13 items-center gap-1.5 rounded-xl border border-border px-4 py-3.5 font-medium hover:bg-muted" data-testid="button-back">
              <ArrowRight className="h-4 w-4" /> السابق
            </button>
          )}
          {Object.keys(errors).length > 0 && step !== STEP_S5 && (
            <span className="hidden text-sm text-destructive sm:block">بعض الأسئلة بحاجة إلى إجابة</span>
          )}
          <button
            onClick={step === STEP_S5 ? submit : next} disabled={busy}
            className="ms-auto flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[.98] disabled:opacity-70 sm:flex-none sm:min-w-48"
            data-testid={step === STEP_S5 ? "button-submit" : "button-next"}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : step === STEP_S5 ? <>إرسال الاستبانة <Check className="h-5 w-5" /></> : <>التالي <NextIcon /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, value, onChange, type = "text", ltr, error, testId, placeholder,
}: {
  icon: typeof User; label: string; value: string; onChange: (v: string) => void; type?: string; ltr?: boolean;
  error?: string; testId: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label} <span className="text-xs text-muted-foreground">(اختياري)</span></span>
      <div className={cn("flex items-center gap-2 rounded-xl border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30", error ? "border-destructive" : "border-input")}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={ltr ? "ltr" : undefined} placeholder={placeholder}
          className={cn("h-12 flex-1 bg-transparent outline-none", ltr && "text-end")} data-testid={testId} />
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
          <p className="mt-4 text-center text-xs text-muted-foreground">إعداد وتنفيذ: آسيا للاستشارات والتدريب · لصالح مركز عبدالعزيز حمد الصقر للتنمية</p>
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

function ThankYou() {
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative max-w-xl text-center">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 12 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-2xl shadow-accent/30">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 text-2xl sm:text-3xl font-semibold leading-[1.8] text-white" data-testid="text-thank-you">
          {THANK_YOU_TEXT}
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 font-display text-accent">— {THANK_YOU_SIGN}</motion.p>
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

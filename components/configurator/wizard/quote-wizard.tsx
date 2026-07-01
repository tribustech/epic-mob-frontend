"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  buildQuoteRecord,
  contactPreferenceOptions,
  emptyAnswers,
  exclusiveRoomIds,
  hasAnyAnswer,
  finishOptions,
  lightingOptions,
  materialOptions,
  NU_STIU,
  plansOptions,
  propertyTypes,
  roomOptions,
  spaceStates,
  stepOrder,
  styleOptions,
  timelineOptions,
  totalSteps,
  type AnswerOption,
  type ContactPreference,
  type QuoteAnswers,
  type QuoteFile,
} from "@/lib/quote-wizard";
import { contactDetails } from "@/lib/site-data";
import { newSessionId, sendRecord, trackEvent } from "@/lib/wizard-analytics";
import { AnswerCard } from "./answer-card";
import { SummaryStep } from "./summary-step";
import { UploadDropzone } from "./upload-dropzone";
import { WizardProgress } from "./wizard-progress";
import { WizardStep } from "./wizard-step";

const STORAGE_KEY = "epicmob-quote-wizard";

type SubmitResult = { whatsAppUrl: string; emailed: boolean };

// ── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "set"; key: "propertyType" | "spaceState" | "plansStatus" | "style" | "timeline"; value: string }
  | { type: "toggle"; key: "rooms" | "materials" | "finishes" | "lighting"; value: string; exclusive?: string[] }
  | { type: "setFiles"; value: QuoteFile[] }
  | { type: "setContact"; key: keyof QuoteAnswers["contact"]; value: string }
  | { type: "hydrate"; value: QuoteAnswers };

function toggle(list: string[], value: string, exclusive?: string[]): string[] {
  const has = list.includes(value);
  if (exclusive?.includes(value)) {
    return has ? [] : [value];
  }
  const cleaned = exclusive ? list.filter((item) => !exclusive.includes(item)) : list;
  return has ? cleaned.filter((item) => item !== value) : [...cleaned, value];
}

function reducer(state: QuoteAnswers, action: Action): QuoteAnswers {
  switch (action.type) {
    case "set":
      return { ...state, [action.key]: action.value };
    case "toggle":
      return { ...state, [action.key]: toggle(state[action.key], action.value, action.exclusive) };
    case "setFiles":
      return { ...state, files: action.value };
    case "setContact":
      return { ...state, contact: { ...state.contact, [action.key]: action.value } };
    case "hydrate":
      return action.value;
    default:
      return state;
  }
}

// ── Motion ───────────────────────────────────────────────────────────────────

// Fade only (no transform) so the sticky footer bar stays pinned to the viewport.
const variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const softIds = new Set([NU_STIU, "ajutati-ma", "info", "altceva"]);

export function QuoteWizard() {
  const [answers, dispatch] = useReducer(reducer, emptyAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const hydrated = useRef(false);
  const sessionId = useRef("");
  const stepIndexRef = useRef(0);
  const submittedRef = useRef(false);
  const capturedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Restore progress from sessionStorage on mount.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: "hydrate", value: JSON.parse(saved) as QuoteAnswers });
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  // Persist on every change (after initial hydrate).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* ignore */
    }
  }, [answers]);

  // Scroll back to the top whenever the step changes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  // Funnel start + capture the draft when they leave without submitting.
  // pagehide covers tab-close / refresh / cross-site nav; the unmount cleanup
  // covers in-app (client-side) navigation, where pagehide never fires.
  useEffect(() => {
    sessionId.current = newSessionId();
    trackEvent("wizard_started");

    function captureAbandon() {
      if (submittedRef.current || capturedRef.current) return;
      if (!hasAnyAnswer(answersRef.current)) return;
      capturedRef.current = true;
      sendRecord({
        status: "abandoned",
        sessionId: sessionId.current,
        step: stepOrder[stepIndexRef.current],
        index: stepIndexRef.current,
        ...buildQuoteRecord(answersRef.current),
      });
    }

    window.addEventListener("pagehide", captureAbandon);
    return () => {
      window.removeEventListener("pagehide", captureAbandon);
      captureAbandon();
    };
  }, []);

  // Funnel: count each step the user reaches.
  useEffect(() => {
    stepIndexRef.current = stepIndex;
    trackEvent("wizard_step", { step: stepOrder[stepIndex], index: stepIndex });
  }, [stepIndex]);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, totalSteps - 1));
    setStepIndex(clamped);
  }

  const next = () => goTo(stepIndex + 1);
  const back = () => goTo(stepIndex - 1);

  function pickAndAdvance(action: Action) {
    dispatch(action);
    window.setTimeout(next, 240);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!response.ok) throw new Error("Cererea nu a putut fi trimisă. Verifică datele de contact.");
      const data = (await response.json()) as SubmitResult;
      submittedRef.current = true;
      trackEvent("wizard_submitted", { emailed: data.emailed });
      sendRecord({
        status: "submitted",
        sessionId: sessionId.current,
        step: "summary",
        index: stepIndexRef.current,
        emailed: data.emailed,
        ...buildQuoteRecord(answers),
      });
      setResult(data);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "A apărut o problemă.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <SuccessScreen result={result} name={answers.contact.name} />;
  }

  const stepId = stepOrder[stepIndex];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <WizardProgress current={stepIndex} onBack={back} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {stepId === "propertyType" ? (
            <WizardStep eyebrow="Să începem" question="Unde dorești lucrarea?">
              <SingleGrid options={propertyTypes} value={answers.propertyType} onPick={(id) => pickAndAdvance({ type: "set", key: "propertyType", value: id })} />
            </WizardStep>
          ) : null}

          {stepId === "spaceState" ? (
            <WizardStep eyebrow="Spațiul" question="Cum se prezintă spațiul?">
              <SingleGrid options={spaceStates} value={answers.spaceState} onPick={(id) => pickAndAdvance({ type: "set", key: "spaceState", value: id })} />
            </WizardStep>
          ) : null}

          {stepId === "rooms" ? (
            <WizardStep
              eyebrow="Camere"
              question="Ce vrei să mobilăm?"
              description="Poți alege mai multe."
              footer={<ContinueButton onClick={next} />}
            >
              <MultiGrid
                options={roomOptions}
                values={answers.rooms}
                onToggle={(id) => dispatch({ type: "toggle", key: "rooms", value: id, exclusive: exclusiveRoomIds })}
              />
            </WizardStep>
          ) : null}

          {stepId === "plans" ? (
            <WizardStep
              eyebrow="Detalii"
              question="Ai schițe, planuri sau poze?"
              footer={<ContinueButton onClick={next} />}
            >
              <SingleGrid options={plansOptions} value={answers.plansStatus} onPick={(id) => dispatch({ type: "set", key: "plansStatus", value: id })} />
              <div className="mt-8">
                <p className="mb-3 text-sm font-medium uppercase tracking-wide text-espresso/45">
                  Încarcă fișiere (opțional)
                </p>
                <UploadDropzone files={answers.files} onChange={(files) => dispatch({ type: "setFiles", value: files })} />
              </div>
            </WizardStep>
          ) : null}

          {stepId === "style" ? (
            <WizardStep eyebrow="Stil" question="Ce stil te reprezintă?">
              <SingleGrid options={styleOptions} value={answers.style} onPick={(id) => pickAndAdvance({ type: "set", key: "style", value: id })} />
            </WizardStep>
          ) : null}

          {stepId === "details" ? (
            <WizardStep
              eyebrow="Opțional"
              question="Știi deja materialele?"
              description="Sari peste liniștit — te ghidăm noi la consultație."
              footer={
                <div className="flex items-center justify-between gap-3">
                  <ContinueButton onClick={next} />
                  <button type="button" onClick={next} className="btn-warm btn-warm--ghost shrink-0">
                    Sari peste
                  </button>
                </div>
              }
            >
              <div className="space-y-8">
                <OptionGroup label="Materiale" options={materialOptions} values={answers.materials} onToggle={(id) => dispatch({ type: "toggle", key: "materials", value: id })} />
                <OptionGroup label="Finisaje" options={finishOptions} values={answers.finishes} onToggle={(id) => dispatch({ type: "toggle", key: "finishes", value: id })} />
                <OptionGroup label="Iluminare" options={lightingOptions} values={answers.lighting} onToggle={(id) => dispatch({ type: "toggle", key: "lighting", value: id })} />
              </div>
            </WizardStep>
          ) : null}

          {stepId === "timeline" ? (
            <WizardStep eyebrow="Termen" question="Când ai nevoie de proiect?">
              <SingleGrid options={timelineOptions} value={answers.timeline} onPick={(id) => pickAndAdvance({ type: "set", key: "timeline", value: id })} />
            </WizardStep>
          ) : null}

          {stepId === "contact" ? (
            <ContactStep answers={answers} dispatch={dispatch} onContinue={next} />
          ) : null}

          {stepId === "summary" ? (
            <SummaryStep answers={answers} onEdit={goTo} onSubmit={handleSubmit} submitting={submitting} error={error} />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Building blocks ──────────────────────────────────────────────────────────

function SingleGrid({ options, value, onPick }: { options: AnswerOption[]; value: string; onPick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <AnswerCard key={option.id} option={option} selected={value === option.id} soft={softIds.has(option.id)} onSelect={onPick} />
      ))}
    </div>
  );
}

function MultiGrid({ options, values, onToggle }: { options: AnswerOption[]; values: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <AnswerCard key={option.id} option={option} selected={values.includes(option.id)} soft={softIds.has(option.id)} multi onSelect={onToggle} />
      ))}
    </div>
  );
}

function OptionGroup({ label, options, values, onToggle, single }: { label: string; options: AnswerOption[]; values: string[]; onToggle: (id: string) => void; single?: boolean }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-espresso/45">{label}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <AnswerCard key={option.id} option={option} selected={values.includes(option.id)} soft={softIds.has(option.id)} multi={!single} onSelect={onToggle} />
        ))}
      </div>
    </div>
  );
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-warm btn-warm--primary">
      Continuă
      <ArrowRight size={18} strokeWidth={2} />
    </button>
  );
}

// ── Contact step ─────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text", placeholder, error }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium uppercase tracking-wide text-espresso/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3.5 text-espresso outline-none transition placeholder:text-espresso/35 ${
          error ? "border-terracotta-deep focus:border-terracotta-deep" : "border-espresso/15 focus:border-terracotta"
        }`}
      />
      {error ? <span className="mt-1.5 block text-sm text-terracotta-deep">{error}</span> : null}
    </label>
  );
}

type ContactErrors = { name?: string; phone?: string; email?: string };

function ContactStep({ answers, dispatch, onContinue }: { answers: QuoteAnswers; dispatch: React.Dispatch<Action>; onContinue: () => void }) {
  const c = answers.contact;
  const [errors, setErrors] = useState<ContactErrors>({});

  function setField(key: keyof QuoteAnswers["contact"], value: string) {
    dispatch({ type: "setContact", key, value });
    if (errors[key as keyof ContactErrors]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function handleContinue() {
    const nextErrors: ContactErrors = {};
    if (!c.name.trim()) nextErrors.name = "Spune-ne cum te cheamă.";
    if (!c.phone.trim()) nextErrors.phone = "Avem nevoie de un număr de telefon.";
    if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) {
      nextErrors.email = "Adresa de email nu pare corectă.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onContinue();
  }

  return (
    <WizardStep
      eyebrow="Ultimul pas"
      question="Cum te contactăm?"
      description="Ai nevoie doar de nume și telefon. Emailul e opțional."
      footer={
        <button type="button" onClick={handleContinue} className="btn-warm btn-warm--primary">
          Vezi rezumatul
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nume complet" value={c.name} onChange={(value) => setField("name", value)} placeholder="Ex: Andrei Popescu" error={errors.name} />
        <Field label="Telefon" type="tel" value={c.phone} onChange={(value) => setField("phone", value)} placeholder="Ex: 07xx xxx xxx" error={errors.phone} />
        <div className="sm:col-span-2">
          <Field label="Email (opțional)" type="email" value={c.email} onChange={(value) => setField("email", value)} placeholder="nume@exemplu.ro" error={errors.email} />
        </div>
      </div>
      <div className="mt-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-espresso/45">Cum preferi să te contactăm?</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {contactPreferenceOptions.map((option) => (
            <AnswerCard key={option.id} option={option} selected={c.preference === option.id} onSelect={(id) => dispatch({ type: "setContact", key: "preference", value: id as ContactPreference })} />
          ))}
        </div>
      </div>
    </WizardStep>
  );
}

// ── Success ──────────────────────────────────────────────────────────────────

function SuccessScreen({ result, name }: { result: SubmitResult; name: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/12">
        <ArrowRight size={26} className="text-terracotta" />
      </div>
      <p className="eyebrow-warm mt-8">Cerere trimisă</p>
      <h2 className="display-font mt-4 text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.08] text-espresso">
        Mulțumim{name ? `, ${name}` : ""}!
      </h2>
      <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-espresso/60">
        {result.emailed
          ? "Ți-am trimis rezumatul pe email și echipa noastră revine în cel mai scurt timp."
          : "Am primit cererea ta și revenim în cel mai scurt timp."}
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <a href={result.whatsAppUrl} target="_blank" rel="noreferrer" className="btn-warm btn-warm--primary">
          Continuă pe WhatsApp
          <ArrowRight size={18} strokeWidth={2} />
        </a>
        <a href={`tel:${contactDetails.phone.replace(/\s/g, "")}`} className="btn-warm btn-warm--ghost">
          Sună-ne
        </a>
      </div>
    </div>
  );
}

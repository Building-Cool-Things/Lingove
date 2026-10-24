"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { WritingView } from "@/app/actions/writing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_CHIP: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  MEDIUM: "bg-amber-100   text-amber-700   border-amber-200   dark:bg-amber-900/30   dark:text-amber-400   dark:border-amber-800",
  HARD:   "bg-rose-100    text-rose-700    border-rose-200    dark:bg-rose-900/30    dark:text-rose-400    dark:border-rose-800",
};

const ERROR_LABEL: Record<string, string> = {
  grammar: "Grammar", spelling: "Spelling", punctuation: "Punctuation",
  clarity: "Clarity", structure: "Structure",
};
const ERROR_BADGE: Record<string, string> = {
  grammar:     "bg-rose-100    text-rose-700    dark:bg-rose-900/40    dark:text-rose-300",
  spelling:    "bg-orange-100  text-orange-700  dark:bg-orange-900/40  dark:text-orange-300",
  punctuation: "bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-300",
  clarity:     "bg-sky-100     text-sky-700     dark:bg-sky-900/40     dark:text-sky-300",
  structure:   "bg-violet-100  text-violet-700  dark:bg-violet-900/40  dark:text-violet-300",
};
const ERROR_DOT: Record<string, string> = {
  grammar: "bg-rose-400", spelling: "bg-orange-400",
  punctuation: "bg-amber-400", clarity: "bg-sky-400", structure: "bg-violet-400",
};
const ERROR_BORDER_L: Record<string, string> = {
  grammar: "border-l-rose-400", spelling: "border-l-orange-400",
  punctuation: "border-l-amber-400", clarity: "border-l-sky-400",
  structure: "border-l-violet-400",
};
const ERROR_HOVER_BG: Record<string, string> = {
  grammar: "hover:bg-rose-50/70    dark:hover:bg-rose-950/30",
  spelling: "hover:bg-orange-50/70  dark:hover:bg-orange-950/30",
  punctuation: "hover:bg-amber-50/70 dark:hover:bg-amber-950/30",
  clarity: "hover:bg-sky-50/70     dark:hover:bg-sky-950/30",
  structure: "hover:bg-violet-50/70  dark:hover:bg-violet-950/30",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function scoreToBand(s: number) {
  if (s >= 9) return "Excellent";
  if (s >= 7) return "Good";
  if (s >= 5) return "Fair";
  return "Needs work";
}
function scoreToTextColor(s: number) {
  if (s >= 7.5) return "text-emerald-600 dark:text-emerald-400";
  if (s >= 5)   return "text-amber-600   dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}
function scoreToStroke(s: number) {
  if (s >= 7.5) return "#9ADBBE";
  if (s >= 5)   return "#52C79A";
  return "#EDBF73";
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 108 }: { score: number; size?: number }) {
  const r    = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" strokeWidth="9" className="stroke-border" />
        <circle
          cx={cx} cy={cx} r={r} fill="none" strokeWidth="9"
          stroke={scoreToStroke(score)}
          strokeDasharray={`${(score / 10) * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className={cn("text-3xl font-bold tabular-nums leading-none", scoreToTextColor(score))}>
          {score.toFixed(1)}
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">/10</p>
      </div>
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

// ── ScoreStat ─────────────────────────────────────────────────────────────────

function ScoreStat({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className={cn("text-lg font-bold tabular-nums leading-none", color ?? "text-foreground")}>
        {value}
      </span>
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

// ── CorrectionCard ────────────────────────────────────────────────────────────

function CorrectionCard({ s }: { s: WritingView["sentenceAnalysis"][number] }) {
  const [open, setOpen] = useState(false);
  const key   = (s.errorType ?? "").toLowerCase();
  const badge = ERROR_BADGE[key]  ?? "bg-muted text-muted-foreground";
  const dot   = ERROR_DOT[key]    ?? "bg-muted-foreground";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-start rounded-none px-4 py-3.5 text-left hover:bg-muted/50"
      >
        <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", dot)} />
        <div className="mx-3 min-w-0 flex-1">
          {s.errorType && (
            <span className={cn("mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", badge)}>
              {ERROR_LABEL[key] ?? s.errorType}
            </span>
          )}
          <p className="line-clamp-2 text-sm leading-6 text-foreground">{s.original}</p>
        </div>
        {open
          ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </Button>

      {open && (
        <div className="space-y-2.5 border-t border-border bg-muted/30 px-4 pb-4 pt-3">
          <div className="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400">
            <XCircle className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-through opacity-70">{s.original}</span>
          </div>
          {s.correctedSentence && (
            <div className="flex items-start gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              <span>{s.correctedSentence}</span>
            </div>
          )}
          {s.errorExplanation && (
            <p className="border-l-2 border-border pl-3 text-xs leading-5 text-muted-foreground">
              {s.errorExplanation}
            </p>
          )}
          {s.improvementTip && s.improvementTip !== s.errorExplanation && (
            <div className="flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400">
              <Sparkles className="mt-0.5 size-3 shrink-0" />
              <span>{s.improvementTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AnnotatedEssay (left panel) ───────────────────────────────────────────────

function AnnotatedEssay({
  sentences,
  wordCount,
}: {
  sentences: WritingView["sentenceAnalysis"];
  wordCount: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const sorted = [...sentences].sort((a, b) => a.index - b.index);

  return (
    <div className="hidden w-[42%] shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/20 lg:flex">
      {/* Sticky sub-header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background px-5 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Response
          </p>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            {wordCount} words
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-emerald-400" />Correct</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-rose-400" />Grammar</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-orange-400" />Spelling</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-amber-400" />Punct.</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-sky-400" />Clarity</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-violet-400" />Structure</span>
        </div>
      </div>

      {/* Sentences */}
      <div className="flex-1 space-y-0.5 px-4 py-5">
        {sorted.map((s, i) => {
          const key       = (s.errorType ?? "").toLowerCase();
          const borderCls = s.hasError
            ? (ERROR_BORDER_L[key] ?? "border-l-rose-400")
            : "border-l-emerald-300 dark:border-l-emerald-700";
          const hoverCls  = s.hasError
            ? (ERROR_HOVER_BG[key] ?? "hover:bg-rose-50/70 dark:hover:bg-rose-950/30")
            : "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20";

          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "cursor-default rounded-r-md border-l-[3px] px-3 py-2 transition-colors duration-100",
                borderCls,
                hoverCls,
                hovered === i && "ring-1 ring-inset ring-border"
              )}
            >
              <p className="text-[13px] leading-7 text-foreground">{s.original}</p>
              {hovered === i && s.hasError && key && (
                <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", ERROR_BADGE[key])}>
                  {ERROR_LABEL[key]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function WritingAnalysis({ submission }: { submission: WritingView }) {
  const router = useRouter();
  const [idealOpen, setIdealOpen] = useState(false);

  const {
    topic, difficulty, type, answer, wordCount,
    grammarSummary, sentenceAnalysis,
    vocabEvaluation, strongWords, missedWords,
    improvementPlan, generalFeedback, idealAnswer,
  } = submission;

  const errorSentences = sentenceAnalysis.filter((s) => s.hasError);
  const correctCount   = sentenceAnalysis.length - errorSentences.length;
  const accuracyRate   = grammarSummary
    ? 1 - grammarSummary.errorCount / Math.max(1, grammarSummary.totalSentences)
    : correctCount / Math.max(1, sentenceAnalysis.length);
  const grammarScore   = Math.max(1, Math.min(10, Math.round(accuracyRate * 10)));
  const wrongVocab     = vocabEvaluation.filter((v) => !v.usedCorrectly);
  const correctVocab   = vocabEvaluation.filter((v) => v.usedCorrectly);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-5 py-3">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate text-sm font-bold text-foreground">{topic}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold", DIFFICULTY_CHIP[difficulty])}>
            {difficulty}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{type}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => router.push("/dashboard")}>
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => router.push("/dashboard/writing/practice")}>
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Practice again</span>
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — annotated essay */}
        <AnnotatedEssay sentences={sentenceAnalysis} wordCount={wordCount} />

        {/* Right — analysis */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6 xl:px-8">

          {/* 1 ── Score hero ── */}
          <div className="rounded-2xl border border-secondary bg-secondary/40 p-5 dark:border-secondary dark:bg-secondary/20">
            <div className="flex items-center gap-5">
              <ScoreRing score={grammarScore} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Grammar Score</p>
                <p className={cn("mt-0.5 text-xl font-bold", scoreToTextColor(grammarScore))}>
                  {scoreToBand(grammarScore)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <ScoreStat value={sentenceAnalysis.length} label="Sentences" />
                  <div className="h-6 w-px bg-border" />
                  <ScoreStat value={grammarSummary?.errorCount ?? 0} label="Errors" color="text-rose-500 dark:text-rose-400" />
                  <div className="h-6 w-px bg-border" />
                  <ScoreStat value={correctCount} label="Correct" color="text-emerald-600 dark:text-emerald-400" />
                  <div className="h-6 w-px bg-border" />
                  <ScoreStat value={`${Math.round(accuracyRate * 100)}%`} label="Accuracy" />
                </div>
              </div>
            </div>
            {grammarSummary?.mostCommonError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                <AlertCircle className="size-3.5 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Most common error: <span className="font-bold">{grammarSummary.mostCommonError}</span>
                </p>
              </div>
            )}
          </div>

          {/* 2 ── Examiner feedback ── */}
          {generalFeedback && (
            <div className="mt-5">
              <SectionTitle>Examiner Feedback</SectionTitle>
              <div className="rounded-xl border-l-4 border-indigo-300 bg-indigo-50/70 px-5 py-4 dark:bg-indigo-950/25">
                <p className="text-sm leading-7 text-foreground">{generalFeedback}</p>
              </div>
            </div>
          )}

          {/* 3 ── Sentence corrections ── */}
          {errorSentences.length > 0 && (
            <div className="mt-6">
              <SectionTitle>
                Sentence Corrections · {errorSentences.length} issue{errorSentences.length !== 1 ? "s" : ""}
              </SectionTitle>
              <div className="space-y-2">
                {errorSentences.map((s, i) => <CorrectionCard key={i} s={s} />)}
              </div>
            </div>
          )}

          {/* 4 ── Vocabulary ── */}
          {(wrongVocab.length > 0 || correctVocab.length > 0) && (
            <div className="mt-6">
              <SectionTitle>Vocabulary Evaluation</SectionTitle>
              <div className="space-y-2">
                {wrongVocab.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400">
                      Used incorrectly
                    </p>
                    <div className="space-y-2">
                      {wrongVocab.map((v, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded-md bg-rose-100 px-2.5 py-0.5 font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            {v.word}
                          </span>
                          {v.suggestion && (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                {v.suggestion}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {correctVocab.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Used correctly
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {correctVocab.map((v, i) => (
                        <span key={i} className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          {v.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5 ── Strong / Missed words ── */}
          {(strongWords.length > 0 || missedWords.length > 0) && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {strongWords.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Strong words
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {strongWords.map((w, i) => (
                      <span key={i} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {missedWords.length > 0 && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    Words to learn
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missedWords.map((w, i) => (
                      <span key={i} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-violet-700 shadow-sm ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:ring-violet-800">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6 ── Improvement plan ── */}
          {improvementPlan.length > 0 && (
            <div className="mt-6">
              <SectionTitle>Improvement Plan</SectionTitle>
              <div className="space-y-2">
                {improvementPlan.map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-6 text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7 ── Model answer (collapsible) ── */}
          {idealAnswer && (
            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => setIdealOpen((v) => !v)}
                className="h-auto w-full justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 px-5 py-4 hover:bg-indigo-100/80 dark:border-indigo-900/40 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/40"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="size-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Model Answer</span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                    Examiner
                  </span>
                </div>
                {idealOpen
                  ? <ChevronUp className="size-4 text-indigo-400" />
                  : <ChevronDown className="size-4 text-indigo-400" />}
              </Button>
              {idealOpen && (
                <div className="mt-0.5 rounded-b-xl border border-t-0 border-indigo-200 bg-card p-5 dark:border-indigo-900/40">
                  <p className="whitespace-pre-wrap text-sm leading-8 text-foreground">{idealAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* Mobile: essay fallback */}
          <details className="mt-6 lg:hidden">
            <summary className="cursor-pointer rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground">
              View your submitted response
            </summary>
            <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{answer}</p>
            </div>
          </details>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 pb-8">
            <Button onClick={() => router.push("/dashboard/writing/practice")}>
              <RotateCcw className="size-4" />
              Practice again
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <LayoutDashboard className="size-4" />
              Dashboard
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

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
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { WritingView } from "@/app/actions/writing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  HARD:   "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
};

const ERROR_LABEL: Record<string, string> = {
  grammar: "Grammar", spelling: "Spelling", punctuation: "Punctuation",
  clarity: "Clarity", structure: "Structure",
};

const ERROR_BADGE: Record<string, string> = {
  grammar:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  spelling:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  punctuation: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  clarity:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  structure:   "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const ERROR_DOT: Record<string, string> = {
  grammar: "bg-rose-400", spelling: "bg-orange-400",
  punctuation: "bg-amber-400", clarity: "bg-blue-400", structure: "bg-violet-400",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function scoreToBand(score: number) {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  return "Needs work";
}

function scoreToColor(score: number) {
  if (score >= 7.5) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 5)   return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function scoreToStroke(score: number) {
  if (score >= 7.5) return "#10b981";
  if (score >= 5)   return "#f59e0b";
  return "#ef4444";
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  const cx = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none" strokeWidth="10"
          stroke={scoreToStroke(score)}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn("text-4xl font-black leading-none tabular-nums", scoreToColor(score))}>
          {score.toFixed(1)}
        </div>
        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/10</div>
      </div>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

// ── CorrectionCard ────────────────────────────────────────────────────────────

function CorrectionCard({ s }: { s: WritingView["sentenceAnalysis"][number] }) {
  const [open, setOpen] = useState(false);
  const badge = s.errorType ? ERROR_BADGE[s.errorType] : "bg-muted text-muted-foreground";
  const dot   = s.errorType ? ERROR_DOT[s.errorType]   : "bg-muted-foreground";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", dot)} />
        <div className="flex-1 min-w-0">
          {s.errorType && (
            <span className={cn("mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", badge)}>
              {ERROR_LABEL[s.errorType] ?? s.errorType}
            </span>
          )}
          <p className="text-sm leading-6 text-foreground line-clamp-2">{s.original}</p>
        </div>
        <span className="ml-2 shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/30 px-4 pb-4 pt-3 space-y-3">
          <div className="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400">
            <XCircle className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-through opacity-80">{s.original}</span>
          </div>
          {s.correctedSentence && (
            <div className="flex items-start gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              <span>{s.correctedSentence}</span>
            </div>
          )}
          {s.errorExplanation && (
            <p className="text-xs leading-5 text-muted-foreground border-l-2 border-border pl-3">
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

// ── AnnotatedEssay ────────────────────────────────────────────────────────────

function AnnotatedEssay({
  sentences,
  wordCount,
}: {
  sentences: WritingView["sentenceAnalysis"];
  wordCount: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const sorted = [...sentences].sort((a, b) => a.index - b.index);

  const borderColor = (s: (typeof sorted)[number]) => {
    if (!s.hasError) return "border-l-emerald-300 dark:border-l-emerald-800";
    const map: Record<string, string> = {
      grammar: "border-l-rose-400", spelling: "border-l-orange-400",
      punctuation: "border-l-amber-400", clarity: "border-l-blue-400",
      structure: "border-l-violet-400",
    };
    return map[s.errorType ?? ""] ?? "border-l-rose-400";
  };

  const bgHover = (s: (typeof sorted)[number]) => {
    if (!s.hasError) return "hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20";
    const map: Record<string, string> = {
      grammar: "hover:bg-rose-50/60 dark:hover:bg-rose-950/20",
      spelling: "hover:bg-orange-50/60 dark:hover:bg-orange-950/20",
      punctuation: "hover:bg-amber-50/60 dark:hover:bg-amber-950/20",
      clarity: "hover:bg-blue-50/60 dark:hover:bg-blue-950/20",
      structure: "hover:bg-violet-50/60 dark:hover:bg-violet-950/20",
    };
    return map[s.errorType ?? ""] ?? "hover:bg-rose-50/60";
  };

  return (
    <div className="hidden w-[42%] shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/20 lg:flex">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Your response
          </p>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {wordCount} words
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-400 inline-block" /> Correct</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-rose-400 inline-block" /> Error</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-1">
        {sorted.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "cursor-default rounded-r-md border-l-[3px] px-3 py-2 transition-colors duration-150",
              borderColor(s),
              bgHover(s),
              hovered === i && "ring-1 ring-inset ring-border",
            )}
          >
            <p className="text-sm leading-7 text-foreground">{s.original}</p>
            {hovered === i && s.hasError && s.errorType && (
              <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", ERROR_BADGE[s.errorType])}>
                {ERROR_LABEL[s.errorType]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── StatTile ──────────────────────────────────────────────────────────────────

function StatTile({
  value, label, color,
}: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 text-center", color ?? "border-border bg-card")}>
      <p className="text-3xl font-black tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
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
  const correctSentences = sentenceAnalysis.filter((s) => !s.hasError);
  const accuracyRate = grammarSummary
    ? 1 - grammarSummary.errorCount / Math.max(1, grammarSummary.totalSentences)
    : 1;
  const grammarScore = Math.max(1, Math.min(10, Math.round(accuracyRate * 10)));

  const wrongVocab  = vocabEvaluation.filter((v) => !v.usedCorrectly);
  const correctVocab = vocabEvaluation.filter((v) => v.usedCorrectly);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate text-sm font-semibold text-foreground">{topic}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold", DIFFICULTY_STYLE[difficulty])}>
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

          {/* ── Hero score card ── */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-5">
            <div className="flex items-center gap-6">
              <ScoreRing score={grammarScore} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Grammar Score</p>
                <p className={cn("mt-1 text-2xl font-black", scoreToColor(grammarScore))}>
                  {scoreToBand(grammarScore)}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-foreground">{grammarSummary?.totalSentences ?? "—"}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Sentences</span>
                  </div>
                  <div className="w-px bg-border" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-rose-500">{grammarSummary?.errorCount ?? "—"}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Errors</span>
                  </div>
                  <div className="w-px bg-border" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-emerald-500">{correctSentences.length}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Correct</span>
                  </div>
                  <div className="w-px bg-border" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-foreground">{Math.round(accuracyRate * 100)}%</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Accuracy</span>
                  </div>
                </div>
              </div>
            </div>

            {grammarSummary?.mostCommonError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                <AlertCircle className="size-3.5 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Most common error: <span className="font-bold">{grammarSummary.mostCommonError}</span>
                </p>
              </div>
            )}
          </div>

          {/* ── Examiner feedback ── */}
          {generalFeedback && (
            <div className="mt-5">
              <SectionLabel>Examiner Feedback</SectionLabel>
              <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50/60 px-5 py-4 dark:bg-indigo-950/20">
                <p className="text-sm leading-7 text-foreground">{generalFeedback}</p>
              </div>
            </div>
          )}

          {/* ── Sentence corrections ── */}
          {errorSentences.length > 0 && (
            <div className="mt-6">
              <SectionLabel>
                Sentence Corrections · {errorSentences.length} issue{errorSentences.length !== 1 ? "s" : ""}
              </SectionLabel>
              <div className="space-y-2">
                {errorSentences.map((s, i) => (
                  <CorrectionCard key={i} s={s} />
                ))}
              </div>
            </div>
          )}

          {/* ── Vocabulary evaluation ── */}
          {vocabEvaluation.length > 0 && (
            <div className="mt-6">
              <SectionLabel>Vocabulary Evaluation · {vocabEvaluation.length} words checked</SectionLabel>
              <div className="space-y-2">
                {wrongVocab.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                      Used incorrectly
                    </p>
                    <div className="space-y-2">
                      {wrongVocab.map((v, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded-md bg-rose-100 px-2.5 py-0.5 font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            {v.word}
                          </span>
                          {v.suggestion && (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
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
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
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

          {/* ── Strong words / words to learn ── */}
          {(strongWords.length > 0 || missedWords.length > 0) && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {strongWords.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Strong words
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {strongWords.map((w, i) => (
                      <span key={i} className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {missedWords.length > 0 && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    Words to learn
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missedWords.map((w, i) => (
                      <span key={i} className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-violet-800 shadow-sm ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:ring-violet-800">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Improvement plan ── */}
          {improvementPlan.length > 0 && (
            <div className="mt-6">
              <SectionLabel>Improvement Plan</SectionLabel>
              <div className="space-y-2">
                {improvementPlan.map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-black text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-6 text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Ideal answer ── */}
          {idealAnswer && (
            <div className="mt-6">
              <button
                onClick={() => setIdealOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 px-5 py-4 text-left transition-colors hover:bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="size-4 text-indigo-500" />
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Model Answer</span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                    Examiner
                  </span>
                </div>
                {idealOpen
                  ? <ChevronUp className="size-4 text-indigo-400" />
                  : <ChevronDown className="size-4 text-indigo-400" />}
              </button>
              {idealOpen && (
                <div className="mt-1 rounded-b-xl rounded-t-none border border-t-0 border-indigo-200 bg-white p-5 dark:border-indigo-900/40 dark:bg-indigo-950/10">
                  <p className="whitespace-pre-wrap text-sm leading-8 text-foreground">{idealAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Mobile: show essay ── */}
          <details className="mt-6 lg:hidden">
            <summary className="cursor-pointer rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
              View your submitted response
            </summary>
            <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{answer}</p>
            </div>
          </details>

          {/* ── Actions ── */}
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

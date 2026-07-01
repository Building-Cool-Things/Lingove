"use client";

import {
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

import type { ReadingView } from "@/app/actions/reading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_CHIP: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  MEDIUM: "bg-amber-100   text-amber-700   border-amber-200   dark:bg-amber-900/30   dark:text-amber-400   dark:border-amber-800",
  HARD:   "bg-rose-100    text-rose-700    border-rose-200    dark:bg-rose-900/30    dark:text-rose-400    dark:border-rose-800",
};

const TYPE_LABEL: Record<string, string> = {
  MCQ: "Multiple Choice",
  TRUE_FALSE_NG: "True / False / Not Given",
  SHORT_ANSWER: "Short Answer",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreToBand(s: number) {
  if (s >= 9) return "Excellent";
  if (s >= 7) return "Good";
  if (s >= 5) return "Fair";
  return "Needs work";
}

function scoreToTextColor(s: number) {
  if (s >= 7.5) return "text-emerald-600 dark:text-emerald-400";
  if (s >= 5)   return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function scoreToStroke(s: number) {
  if (s >= 7.5) return "#10b981";
  if (s >= 5)   return "#f59e0b";
  return "#ef4444";
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
        <p className={cn("text-3xl font-black tabular-nums leading-none", scoreToTextColor(score))}>
          {score.toFixed(1)}
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">/10</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function ScoreStat({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className={cn("text-lg font-bold tabular-nums leading-none", color ?? "text-foreground")}>
        {value}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ── QuestionReview card ───────────────────────────────────────────────────────

function QuestionReview({
  question,
  result,
  questionNumber,
}: {
  question: ReadingView["questions"][number];
  result: ReadingView["results"][number] | undefined;
  questionNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const isCorrect = result?.isCorrect ?? false;
  const userAnswer = result?.userAnswer ?? "—";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        isCorrect
          ? "border-emerald-200 dark:border-emerald-800"
          : "border-rose-200 dark:border-rose-800"
      )}
    >
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-start rounded-none px-4 py-3.5 text-left hover:bg-muted/50"
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
            isCorrect
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
          )}
        >
          {questionNumber}
        </span>

        <div className="mx-3 min-w-0 flex-1">
          <span
            className={cn(
              "mb-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              isCorrect
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
            )}
          >
            {TYPE_LABEL[question.type] ?? question.type} · {isCorrect ? "Correct" : "Incorrect"}
          </span>
          <p className="line-clamp-2 text-sm leading-5 text-foreground">
            {question.text}
          </p>
        </div>

        {open
          ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </Button>

      {open && (
        <div className="space-y-3 border-t border-border bg-muted/20 px-4 pb-4 pt-3">
          {/* User's answer */}
          <div
            className={cn(
              "flex items-start gap-2 text-sm",
              isCorrect
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {isCorrect
              ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              : <XCircle className="mt-0.5 size-3.5 shrink-0" />}
            <span>
              <span className="font-semibold">Your answer: </span>
              {userAnswer || "(no answer)"}
            </span>
          </div>

          {/* Correct answer (only if wrong) */}
          {!isCorrect && (
            <div className="flex items-start gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <span className="font-semibold">Correct answer: </span>
                {question.correctAnswer}
              </span>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <p className="border-l-2 border-teal-300 pl-3 text-xs leading-5 text-muted-foreground dark:border-teal-700">
              {question.explanation}
            </p>
          )}

          {/* AI feedback for short answer */}
          {question.type === "SHORT_ANSWER" && result?.feedback && result.feedback !== "Correct!" && (
            <div className="flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400">
              <Sparkles className="mt-0.5 size-3 shrink-0" />
              <span>{result.feedback}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Passage panel ─────────────────────────────────────────────────────────────

function PassagePanel({ title, passage }: { title: string; passage: string }) {
  return (
    <div className="hidden w-[44%] shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/20 lg:flex">
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 px-5 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Reading Passage
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
      </div>
      <div className="flex-1 space-y-4 px-5 py-5">
        {passage.split("\n\n").map((para, i) => (
          <p key={i} className="text-[13px] leading-7 text-foreground">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ReadingAnalysis({ submission }: { submission: ReadingView }) {
  const router = useRouter();
  const [vocabOpen, setVocabOpen] = useState(false);

  const {
    title, topic, difficulty, passageType, passage,
    questions, results,
    correctCount, totalQuestions, score,
    generalFeedback, improvementPlan, newVocabulary,
  } = submission;

  const resultMap = new Map(results.map((r) => [r.questionIndex, r]));
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate text-sm font-semibold text-foreground">{topic}</span>
          <span className="text-muted-foreground/40">·</span>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold",
              DIFFICULTY_CHIP[difficulty]
            )}
          >
            {difficulty}
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
          <span className="hidden shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
            {passageType}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => router.push("/dashboard")}
          >
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => router.push("/dashboard/reading/practice")}
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Practice again</span>
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — passage */}
        <PassagePanel title={title} passage={passage} />

        {/* Right — analysis */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6 xl:px-8">

          {/* 1 — Score hero */}
          <div className="rounded-2xl border border-secondary bg-secondary/40 p-5 dark:border-secondary dark:bg-secondary/20">
            <div className="flex items-center gap-5">
              <ScoreRing score={score} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Reading Score
                </p>
                <p className={cn("mt-0.5 text-xl font-black", scoreToTextColor(score))}>
                  {scoreToBand(score)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <ScoreStat value={totalQuestions} label="Questions" />
                  <div className="h-6 w-px bg-border" />
                  <ScoreStat
                    value={correctCount}
                    label="Correct"
                    color="text-emerald-600 dark:text-emerald-400"
                  />
                  <div className="h-6 w-px bg-border" />
                  <ScoreStat
                    value={totalQuestions - correctCount}
                    label="Wrong"
                    color="text-rose-500 dark:text-rose-400"
                  />
                  <div className="h-6 w-px bg-border" />
                  <ScoreStat value={`${accuracy}%`} label="Accuracy" />
                </div>
              </div>
            </div>
          </div>

          {/* 2 — Examiner feedback */}
          {generalFeedback && (
            <div className="mt-5">
              <SectionTitle>Examiner Feedback</SectionTitle>
              <div className="rounded-xl border-l-4 border-teal-300 bg-teal-50/70 px-5 py-4 dark:bg-teal-950/25">
                <p className="text-sm leading-7 text-foreground">{generalFeedback}</p>
              </div>
            </div>
          )}

          {/* 3 — Question review */}
          {questions.length > 0 && (
            <div className="mt-6">
              <SectionTitle>
                Question Review · {correctCount}/{totalQuestions} correct
              </SectionTitle>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <QuestionReview
                    key={q.index}
                    question={q}
                    result={resultMap.get(q.index)}
                    questionNumber={i + 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4 — New vocabulary */}
          {newVocabulary.length > 0 && (
            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => setVocabOpen((v) => !v)}
                className="h-auto w-full justify-between rounded-xl border border-violet-200 bg-violet-50/70 px-5 py-4 hover:bg-violet-100/80 dark:border-violet-900/40 dark:bg-violet-950/25 dark:hover:bg-violet-950/40"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="size-4 text-violet-500 dark:text-violet-400" />
                  <span className="text-sm font-bold text-violet-700 dark:text-violet-300">
                    New Vocabulary
                  </span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                    {newVocabulary.length} words
                  </span>
                </div>
                {vocabOpen
                  ? <ChevronUp className="size-4 text-violet-400" />
                  : <ChevronDown className="size-4 text-violet-400" />}
              </Button>
              {vocabOpen && (
                <div className="mt-0.5 rounded-b-xl border border-t-0 border-violet-200 bg-card p-4 dark:border-violet-900/40">
                  <div className="space-y-2.5">
                    {newVocabulary.map((v, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-start gap-2 text-sm"
                      >
                        <span className="rounded-md bg-violet-100 px-2.5 py-0.5 font-semibold text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                          {v.word}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {v.level}
                        </span>
                        <span className="text-muted-foreground">{v.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5 — Improvement plan */}
          {improvementPlan.length > 0 && (
            <div className="mt-6">
              <SectionTitle>Improvement Plan</SectionTitle>
              <div className="space-y-2">
                {improvementPlan.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-black text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-6 text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile: passage fallback */}
          <details className="mt-6 lg:hidden">
            <summary className="cursor-pointer rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
              View reading passage
            </summary>
            <div className="mt-2 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              {passage.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-7 text-foreground">{para}</p>
              ))}
            </div>
          </details>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3 pb-8">
            <Button onClick={() => router.push("/dashboard/reading/practice")}>
              <RotateCcw className="size-4" />
              Practice again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

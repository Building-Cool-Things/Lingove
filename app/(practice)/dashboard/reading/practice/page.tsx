"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw } from "lucide-react";

import {
  generateReadingTask,
  submitReading,
  type ReadingTask,
  type ReadingTaskQuestion,
  type UserAnswer,
} from "@/app/actions/reading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLE = {
  EASY:   "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
  HARD:   "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800",
};

const TF_NG_OPTIONS = ["True", "False", "Not Given"];

// ── Question input ────────────────────────────────────────────────────────────

function QuestionItem({
  question,
  answer,
  onChange,
  index,
}: {
  question: ReadingTaskQuestion;
  answer: string;
  onChange: (val: string) => void;
  index: number;
}) {
  const answered = answer.trim().length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        answered ? "border-teal-200 dark:border-teal-800" : "border-border"
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
            answered
              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {index + 1}
        </span>
        <p className="text-sm font-medium leading-6 text-foreground">{question.text}</p>
      </div>

      {question.type === "MCQ" && question.options && (
        <div className="ml-9 space-y-2">
          {question.options.map((opt) => {
            const letter = opt.charAt(0);
            const selected = answer === letter;
            return (
              <button
                key={opt}
                onClick={() => onChange(letter)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                  selected
                    ? "border-teal-400 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/40 dark:text-teal-100"
                    : "border-border bg-background hover:bg-muted/50 text-foreground"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-black",
                    selected
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {letter}
                </span>
                <span className="leading-5">{opt.slice(3)}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.type === "TRUE_FALSE_NG" && (
        <div className="ml-9 flex flex-wrap gap-2">
          {TF_NG_OPTIONS.map((opt) => {
            const selected = answer === opt;
            const colorMap: Record<string, string> = {
              "True": selected
                ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
              "False": selected
                ? "border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-200"
                : "border-border hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20",
              "Not Given": selected
                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-border hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20",
            };
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  colorMap[opt] ?? "border-border",
                  !selected && "text-foreground"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "SHORT_ANSWER" && (
        <div className="ml-9">
          <textarea
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your answer here…"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground placeholder:text-muted-foreground/40 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:focus:border-teal-600 dark:focus:ring-teal-600"
          />
        </div>
      )}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function AnswerProgress({
  answered,
  total,
}: {
  answered: number;
  total: number;
}) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  const done = answered === total && total > 0;
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            done ? "bg-teal-500" : "bg-teal-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span
          className={cn(
            "font-semibold tabular-nums",
            done
              ? "text-teal-600 dark:text-teal-400"
              : "text-muted-foreground"
          )}
        >
          {answered}/{total} answered
        </span>
        {done && (
          <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
            <CheckCircle2 className="size-3" />
            Ready to submit
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReadingPracticePage() {
  const router = useRouter();
  const [task, setTask] = useState<ReadingTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const startTimeRef = useRef<number>(Date.now());

  async function loadTask() {
    setIsLoading(true);
    setAnswers({});
    startTimeRef.current = Date.now();
    try {
      const t = await generateReadingTask();
      setTask(t);
    } catch {
      // keep previous task if refresh fails
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    generateReadingTask()
      .then((t) => { if (active) { console.log('task',t); setTask(t); setAnswers({}); } })
      .catch(() => {})
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function setAnswer(questionIndex: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  }

  const totalQuestions = task?.questions.length ?? 0;
  const answeredCount = task
    ? task.questions.filter((q) => (answers[q.index] ?? "").trim().length > 0).length
    : 0;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  async function handleSubmit() {
    if (!task) return;
    setIsSubmitting(true);
    try {
      const userAnswers: UserAnswer[] = task.questions.map((q) => ({
        questionIndex: q.index,
        answer: answers[q.index] ?? "",
      }));
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      const id = await submitReading(task, userAnswers, timeTaken);
      router.push(`/dashboard/reading/analysis/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const diff = task?.difficulty ?? "EASY";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Exit
        </Button>

        {!isLoading && task && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="truncate text-sm font-medium capitalize text-foreground">
              {task.topic}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                DIFFICULTY_STYLE[diff]
              )}
            >
              {diff}
            </span>
            <span className="text-muted-foreground/40 hidden sm:inline">·</span>
            <span className="hidden rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
              {task.passageType}
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={isLoading || isSubmitting}
          onClick={loadTask}
        >
          <RotateCcw className={cn("size-4", isLoading && "animate-spin")} />
          New
        </Button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — passage panel (desktop) */}
        <div className="hidden w-[48%] shrink-0 flex-col overflow-y-auto border-r border-teal-100 bg-teal-50/60 px-7 py-8 dark:border-teal-900/40 dark:bg-teal-950/20 lg:flex xl:px-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400 dark:text-teal-500">
            Reading Passage
          </p>

          {isLoading ? (
            <div className="mt-5 space-y-3">
              {[1, 0.9, 0.75, 1, 0.85, 0.6, 1, 0.8, 0.7].map((w, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded-md bg-teal-100 dark:bg-teal-900/40"
                  style={{ width: `${w * 100}%` }}
                />
              ))}
            </div>
          ) : (
            <>
              <h2 className="mt-4 text-lg font-bold tracking-tight text-teal-950 dark:text-teal-50">
                {task?.title}
              </h2>
              <div className="mt-4 space-y-4">
                {(task?.passage ?? "").split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-[15px] leading-8 tracking-tight text-teal-900 dark:text-teal-100"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Tips */}
              {task?.tips && task.tips.length > 0 && (
                <div className="mt-8 rounded-xl border border-teal-200 bg-teal-100/60 p-4 dark:border-teal-800 dark:bg-teal-900/30">
                  <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-teal-500 dark:text-teal-400">
                    Reading Tips
                  </p>
                  <ul className="space-y-1.5">
                    {task.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-5 text-teal-800 dark:text-teal-200">
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-teal-200 text-[9px] font-bold text-teal-700 dark:bg-teal-800 dark:text-teal-300">
                          {i + 1}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right — questions */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-6 xl:px-8">

            {/* Mobile passage */}
            <details className="mb-6 lg:hidden">
              <summary className="cursor-pointer rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm font-semibold text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
                {isLoading ? "Loading passage…" : `Read Passage: ${task?.title ?? ""}`}
              </summary>
              <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 0.9, 0.75].map((w, i) => (
                      <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w * 100}%` }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(task?.passage ?? "").split("\n\n").map((para, i) => (
                      <p key={i} className="text-sm leading-7 text-foreground">{para}</p>
                    ))}
                  </div>
                )}
              </div>
            </details>

            <p className="mb-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              {isLoading ? "Loading questions…" : `${totalQuestions} Questions`}
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(task?.questions ?? []).map((q, i) => (
                  <QuestionItem
                    key={q.index}
                    question={q}
                    answer={answers[q.index] ?? ""}
                    onChange={(val) => setAnswer(q.index, val)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && (
            <div className="shrink-0 border-t border-border px-5 py-4 xl:px-8">
              <AnswerProgress answered={answeredCount} total={totalQuestions} />
              <div className="mt-4 flex justify-end">
                <Button
                  disabled={!allAnswered || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {isSubmitting ? "Submitting…" : "Submit Answers"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

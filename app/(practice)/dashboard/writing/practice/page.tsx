"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, ExternalLink, Loader2, RotateCcw } from "lucide-react";

import {
  generateWritingQuestion,
  submitWriting,
  type WritingQuestion,
} from "@/app/actions/writing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DIFFICULTY_STYLE = {
  EASY:   "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
  HARD:   "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800",
};

const TIP_ACCENT = ["bg-violet-100 text-violet-700", "bg-sky-100 text-sky-700", "bg-pink-100 text-pink-700"];

function WordProgress({ count, min, recommended, max }: {
  count: number; min: number; recommended: number; max: number;
}) {
  const pct    = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  const minPct = max > 0 ? (min / max) * 100 : 0;
  const recPct = max > 0 ? (recommended / max) * 100 : 0;

  const barClass =
    count === 0       ? "bg-muted-foreground/20"
    : count < min     ? "bg-rose-400"
    : count <= recommended ? "bg-emerald-500"
    : count <= max    ? "bg-indigo-500"
    : "bg-rose-400";

  const label =
    count === 0       ? `Write at least ${min} words`
    : count < min     ? `${min - count} more to reach minimum`
    : count > max     ? `${count - max} over limit`
    : count <= recommended ? `${recommended - count} more to hit target`
    : "Great length!";

  return (
    <div className="space-y-2">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barClass)}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-y-0 w-px bg-border" style={{ left: `${minPct}%` }} />
        <div className="absolute inset-y-0 w-px bg-border" style={{ left: `${recPct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className={cn(
          "font-semibold tabular-nums",
          count === 0       ? "text-muted-foreground"
          : count < min     ? "text-rose-600 dark:text-rose-400"
          : count <= max    ? "text-emerald-700 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
        )}>
          {count} words
        </span>
        <span className="text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export default function WritingPracticePage() {
  const router = useRouter();
  const [draft, setDraft]           = useState("");
  const [question, setQuestion]     = useState<WritingQuestion | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  async function loadQuestion() {
    setIsLoading(true);
    try {
      const q = await generateWritingQuestion();
      setQuestion(q);
      setDraft("");
    } catch {
      // keep previous question if refresh fails
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    generateWritingQuestion()
      .then((q) => { if (active) {console.log(q); setQuestion(q); setDraft(""); } })
      .catch(() => {})
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleCheck() {
    if (!question) return;
    setIsChecking(true);
    try {
      const id = await submitWriting(question, draft, wordCount);
      setSubmittedId(id);
      router.push(`/dashboard/writing/analysis/${id}`);
    } finally {
      setIsChecking(false);
    }
  }

  const diff = question?.difficulty ?? "EASY";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Exit
        </Button>

        {!isLoading && question && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize text-foreground">{question.topic}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", DIFFICULTY_STYLE[diff])}>
              {diff}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{question.type}</span>
          </div>
        )}

        <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={isLoading} onClick={loadQuestion}>
          <RotateCcw className={cn("size-4", isLoading && "animate-spin")} />
          New Que
        </Button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — tinted question panel */}
        <div className="flex w-full shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-7 py-8 lg:w-[44%] xl:px-10">

          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1d8a50] dark:text-[#7fe3a8]">
            Writing Prompt
          </p>

          {isLoading ? (
            <div className="mt-5 space-y-3">
              {[3/4, 1, 5/6, 2/3].map((w, i) => (
                <div key={i} className="h-6 animate-pulse rounded-lg bg-muted" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-xl font-semibold leading-9 tracking-tight text-foreground">
              {question?.prompt}
            </p>
          )}

          {/* Tips */}
          <div className="mt-10">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#1d8a50] dark:text-[#7fe3a8]">
              Tips
            </p>
            <ul className="space-y-3">
              {(isLoading ? Array(3).fill("") : (question?.tips ?? [])).map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    TIP_ACCENT[i] ?? TIP_ACCENT[0]
                  )}>
                    {i + 1}
                  </span>
                  {isLoading
                    ? <span className="mt-0.5 h-4 w-44 animate-pulse rounded bg-muted" />
                    : <span className="text-sm leading-5 text-foreground">{tip}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* <div className="mt-auto pt-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
              Target: {isLoading ? "—" : question?.targetWords}
            </span>
          </div> */}
        </div>

        {/* Right — writing surface (desktop) */}
        <div className="hidden flex-1 flex-col bg-background lg:flex">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isLoading ? "" : "Begin writing your response here…"}
            disabled={isLoading}
            className="flex-1 resize-none rounded-none border-0 bg-transparent px-10 py-10 text-base leading-9 text-foreground shadow-none placeholder:text-muted-foreground/30 focus-visible:ring-0 xl:px-14"
          />

          <div className="shrink-0 border-t border-border px-10 py-5 xl:px-14">
            <WordProgress
              count={wordCount}
              min={question?.minWords ?? 100}
              recommended={question?.recommendedWords ?? 130}
              max={question?.maxWords ?? 150}
            />
            <div className="mt-4 flex justify-end">
              {submittedId ? (
                <Button onClick={() => router.push(`/dashboard/writing/analysis/${submittedId}`)}>
                  <ExternalLink className="size-4" />
                  View Analysis
                </Button>
              ) : (
                <Button
                  disabled={isLoading || isChecking || wordCount < (question?.minWords ?? 1)}
                  onClick={handleCheck}
                >
                  {isChecking
                    ? <Loader2 className="size-4 animate-spin" />
                    : <ClipboardCheck className="size-4" />}
                  {isChecking ? "Analysing…" : "Check writing"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile writing area */}
        <div className="flex w-full flex-col border-t border-border bg-background lg:hidden">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isLoading ? "" : "Begin writing your response here…"}
            disabled={isLoading}
            className="min-h-60 resize-none rounded-none border-0 bg-transparent px-6 py-6 text-base leading-8 shadow-none focus-visible:ring-0"
          />
          <div className="shrink-0 border-t border-border px-6 py-4">
            <WordProgress
              count={wordCount}
              min={question?.minWords ?? 100}
              recommended={question?.recommendedWords ?? 130}
              max={question?.maxWords ?? 150}
            />
            <div className="mt-3 flex justify-end">
              {submittedId ? (
                <Button onClick={() => router.push(`/dashboard/writing/analysis/${submittedId}`)}>
                  <ExternalLink className="size-4" />
                  View Analysis
                </Button>
              ) : (
                <Button
                  disabled={isLoading || isChecking || wordCount < (question?.minWords ?? 1)}
                  onClick={handleCheck}
                >
                  {isChecking
                    ? <Loader2 className="size-4 animate-spin" />
                    : <ClipboardCheck className="size-4" />}
                  {isChecking ? "Analysing…" : "Check writing"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

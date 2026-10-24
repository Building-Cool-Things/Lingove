"use client";

import { useState } from "react";

import type { VocabCard } from "@/app/actions/vocab";
import { sectionTitle } from "@/components/page-shell";
import { cn } from "@/lib/utils";

const POS_LABEL: Record<string, string> = {
  NOUN: "noun",
  VERB: "verb",
  ADJECTIVE: "adj.",
  ADVERB: "adv.",
  PRONOUN: "pron.",
  PREPOSITION: "prep.",
  CONJUNCTION: "conj.",
  INTERJECTION: "interj.",
};

// Status pill colours from the design's "My words" list.
const STATE = {
  New: "bg-[#2A2F2D] text-[#52C79A]",
  Learning: "bg-[#EDBF73]/15 text-[#EDBF73]",
  Known: "bg-[#212524] text-[#6BD3AB]",
};

const btn = "h-11 flex-1 rounded-full text-[14.5px] font-bold transition-[transform,background-color] duration-100 active:scale-[.96]";

export function VocabFlashcard({ initial }: { initial: VocabCard[] }) {
  const [queue, setQueue] = useState<VocabCard[]>(initial);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [again, setAgain] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState(false);

  const total = initial.length;
  const current = queue[0];

  function good() {
    setKnown((k) => new Set(k).add(current.word));
    setQueue((q) => q.slice(1));
    setFlipped(false);
  }

  function repeat() {
    setAgain((a) => new Set(a).add(current.word));
    setQueue((q) => [...q.slice(1), q[0]]);
    setFlipped(false);
  }

  if (total === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        No words yet. Complete writing practices to grow your word bank.
      </span>
    );
  }

  const state = (w: string) => (known.has(w) ? "Known" : again.has(w) ? "Learning" : "New");

  return (
    <>
      <div className="flex max-w-[520px] flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className={sectionTitle}>
            {queue.length ? `${queue.length} word${queue.length !== 1 ? "s" : ""} to review` : "All done"}
          </span>
          <span className="text-[12.5px] tabular-nums text-muted-foreground">
            {known.size} of {total}
          </span>
        </div>

        {current ? (
          <>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="lg-card flex min-h-[180px] flex-col items-center justify-center gap-2 p-6 text-center hover:bg-[#212524] hover:-translate-y-0.5 transition-[background-color,transform] duration-150 ease-out"
            >
              <span className="text-[30px] font-bold tracking-[-.01em]">{current.word}</span>
              <span className="tabular-nums text-xs text-muted-foreground">
                {current.pronunciation ? `/${current.pronunciation.replace(/^\/|\/$/g, "")}/ · ` : ""}
                {POS_LABEL[current.partOfSpeech] ?? current.partOfSpeech.toLowerCase()} · {current.level}
              </span>
              <span className={cn("mt-1.5 min-h-[46px] text-[15px] leading-normal", flipped ? "text-[#52C79A] dark:text-[#52C79A]" : "text-[#A3ABA7]")}>
                {flipped ? current.meaning : "Tap to see the meaning"}
              </span>
              {flipped && current.examples.length > 0 && (
                <span className="text-[13px] italic leading-snug text-muted-foreground">
                  &ldquo;{current.examples[0]}&rdquo;
                </span>
              )}
              {flipped && current.synonyms.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Similar: {current.synonyms.slice(0, 4).join(", ")}
                </span>
              )}
            </button>
            <div className="flex gap-2">
              <button onClick={repeat} className={cn(btn, "border-[1.5px] border-[#2A2F2D] bg-[#171A19] shadow-[inset_-4px_-5px_0_#080A09]")}>
                Again
              </button>
              <button onClick={good} className={cn(btn, "lg-btn-shadow bg-primary text-primary-foreground hover:bg-[#6BD3AB] active:translate-y-px")}>
                Good
              </button>
            </div>
          </>
        ) : (
          <div className="lg-card flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-[22px] font-bold">You reviewed all {total} words</span>
            <button
              onClick={() => { setQueue(initial); setKnown(new Set()); setAgain(new Set()); }}
              className={cn(btn, "max-w-40 border border-input hover:bg-muted dark:border-[#2A2F2D]")}
            >
              Start over
            </button>
          </div>
        )}
      </div>

      <span className={sectionTitle}>My words</span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
        {initial.map((w) => (
          <div key={w.word} className="lg-card flex items-center gap-3 rounded-2xl px-3.5 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">{w.word}</span>
              <span className="truncate text-[13px] text-muted-foreground">{w.meaning}</span>
            </div>
            <span className={cn("shrink-0 rounded-full px-[9px] py-0.5 text-[11.5px] font-bold", STATE[state(w.word)])}>
              {state(w.word)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

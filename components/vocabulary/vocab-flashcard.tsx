"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VocabCard } from "@/app/actions/vocab";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  A2: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  B2: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  C1: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  C2: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

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

export function VocabFlashcard({ initial }: { initial: VocabCard[] }) {
  const [queue, setQueue] = useState<VocabCard[]>(initial);
  const [done, setDone] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = initial.length;
  const current = queue[0];

  function flip() {
    setFlipped(true);
  }

  function gotIt() {
    setQueue((q) => q.slice(1));
    setDone((d) => d + 1);
    setFlipped(false);
  }

  function again() {
    setQueue((q) => [...q.slice(1), q[0]]);
    setFlipped(false);
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
        <p className="text-5xl">📚</p>
        <p className="text-lg font-medium text-foreground">No words yet</p>
        <p className="text-sm">
          Complete writing practices to grow your word bank.
        </p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-5xl">🎉</p>
        <p className="text-2xl font-semibold">All done!</p>
        <p className="text-muted-foreground">
          You reviewed {total} word{total !== 1 ? "s" : ""}.
        </p>
        <Button variant="outline" onClick={() => { setQueue(initial); setDone(0); setFlipped(false); }}>
          Start over
        </Button>
      </div>
    );
  }

  const progress = Math.round((done / total) * 100);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="w-full max-w-lg">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{done} / {total} known</span>
          <span>{queue.length} remaining</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-lg"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "400px",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[current.level] ?? ""}`}
              >
                {current.level}
              </span>
              <span className="text-xs italic text-muted-foreground">
                {POS_LABEL[current.partOfSpeech] ?? current.partOfSpeech.toLowerCase()}
              </span>
            </div>
            <p className="text-4xl font-semibold tracking-tight text-foreground">
              {current.word}
            </p>
            {current.pronunciation && (
              <p className="text-sm text-muted-foreground">/{current.pronunciation}/</p>
            )}
            <Button className="mt-4" onClick={flip}>
              Reveal meaning
            </Button>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[current.level] ?? ""}`}
              >
                {current.level}
              </span>
              <span className="text-xs italic text-muted-foreground">
                {POS_LABEL[current.partOfSpeech] ?? current.partOfSpeech.toLowerCase()}
              </span>
              <span className="ml-auto text-lg font-semibold">{current.word}</span>
            </div>

            <p className="text-base text-foreground">{current.meaning}</p>

            {current.examples.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Examples</p>
                {current.examples.slice(0, 2).map((ex, i) => (
                  <p key={i} className="text-sm italic text-muted-foreground">"{ex}"</p>
                ))}
              </div>
            )}

            {(current.synonyms.length > 0 || current.antonyms.length > 0) && (
              <div className="flex flex-wrap gap-4">
                {current.synonyms.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Synonyms</p>
                    <div className="flex flex-wrap gap-1">
                      {current.synonyms.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {current.antonyms.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Antonyms</p>
                    <div className="flex flex-wrap gap-1">
                      {current.antonyms.slice(0, 4).map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={again}>
                Again
              </Button>
              <Button className="flex-1" onClick={gotIt}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

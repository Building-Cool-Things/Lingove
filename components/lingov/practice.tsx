"use client";

import { ArrowRight, CircleCheck, CircleX, Clock, Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { VocabCard } from "@/app/actions/vocab";
import { EXQ, FC, PT_TABS, TOPICS, WORDS, WORD_STATE, levelName } from "@/lib/lingov/data";
import { LEVEL_LABELS, READING_XP, SESSION_QUESTIONS, WORD_LIMITS, WRITING_XP } from "@/lib/skill-config";
import { cn } from "@/lib/utils";

import { pageCol } from "./app-shell";
import { titleCase } from "./reading-session";
import { useLingov } from "./store";
import { btnOutline, btnPress, btnPrimary, card, h2 } from "./ui";

const tag = "rounded-full border px-[9px] py-[2px] text-[11.5px] font-bold";

// What the Reading / Writing launchers show: the unfinished task if there is one, else the next one's level and XP.
export function useUpcoming() {
  const { S, me } = useLingov();
  const t = S.rdTask && !S.rdSub && !S.rdDemo ? S.rdTask : null;
  const q = S.wsQ && !S.wsDone && !S.wsDemo ? S.wsQ : null;
  const wl = WORD_LIMITS[me.writeDiff];
  return {
    reading: {
      topic: t ? titleCase(t.topic) : "Reading", level: t?.level ?? LEVEL_LABELS[me.readDiff], kind: t ? titleCase(t.passageType) : "Article",
      title: t?.title ?? "A new passage picked for you", mins: t ? Math.max(5, Math.round(t.passageWordCount / 25)) : 8, xp: READING_XP[t?.difficulty ?? me.readDiff],
      sub: (t ? titleCase(t.topic) : "New passage") + " · " + SESSION_QUESTIONS + " questions",
    },
    writing: {
      topic: q ? titleCase(q.topic) : "Writing", level: q?.level ?? LEVEL_LABELS[me.writeDiff], kind: q ? titleCase(q.type) : "Essay",
      title: q?.title ?? "A new writing prompt for you", min: q?.minWords ?? wl.min, mins: Math.round((q?.minWords ?? wl.min) * 0.15), xp: WRITING_XP[q?.difficulty ?? me.writeDiff],
      sub: (q?.title ?? "New prompt") + " · " + (q?.minWords ?? wl.min) + "–" + (q?.maxWords ?? wl.max) + " words",
    },
  };
}

export function Practice({ vocab }: { vocab: VocabCard[] }) {
  const { S, set, openReading, openWriting } = useLingov();
  const { reading: rd, writing: wr } = useUpcoming();

  // Real vocabulary when the user has any, otherwise the prototype's sample cards.
  const cards: [string, string, string][] = vocab.length ? vocab.map((v) => [v.word, v.pronunciation ?? "", v.meaning]) : FC;
  const fc = cards[S.fcI % cards.length];
  const total = vocab.length || 12;

  const ex = EXQ[S.exI % EXQ.length], ok = S.exSel === ex.ans;
  const exOff = !S.exChecked && S.exSel == null;

  return (
    <div className={cn(pageCol, "flex flex-col content-start gap-5")}>
      <span className="text-[30px] font-bold leading-[1.1] tracking-[-.01em]">Practice</span>
      <div className="flex w-full max-w-[620px] flex-none self-start overflow-x-auto rounded-full border border-[#2A2F2D] bg-[#171A19] p-1">
        {PT_TABS.map((label, i) => (
          <button key={label} onClick={() => set({ pt: i })} className={cn("h-9 flex-1 cursor-pointer rounded-full border-0 text-[13.5px] font-bold transition-all duration-[.14s]", S.pt === i ? "bg-[#52C79A] text-[#052013]" : "bg-transparent text-[#A3ABA7]")}>{label}</button>
        ))}
      </div>

      {S.pt === 0 && (
        <>
          <div className="flex max-w-[520px] flex-none flex-col gap-3">
            <div className="flex items-baseline justify-between"><span className={h2}>{total} words to review</span><span className="text-[12.5px] tabular-nums text-[#A3ABA7]">{(S.fcI % cards.length) + 1} of {total}</span></div>
            <div onClick={() => set({ fcFlip: !S.fcFlip })} className={cn(card, "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center hover:bg-[#212524] hover:-translate-y-0.5 transition-[background-color,transform] duration-150 ease-out")}>
              <span className="text-[30px] font-bold tracking-[-.01em]">{fc[0]}</span>
              <span className="tabular-nums text-[12px] text-[#A3ABA7]">{fc[1]}</span>
              <span className={cn("mt-[6px] min-h-[46px] text-[15px] leading-[1.5]", S.fcFlip ? "text-[#52C79A]" : "text-[#A3ABA7]")}>{S.fcFlip ? fc[2] : "Tap to see the meaning"}</span>
            </div>
            {/* Again / Good both move on, as in the prototype (no spaced repetition yet, see REPLACE.md). */}
            <div className="flex gap-2">
              <button onClick={() => set((s) => ({ fcI: s.fcI + 1, fcFlip: false }))} className={cn("h-11 flex-1 text-[14.5px]", btnOutline)}>Again</button>
              <button onClick={() => set((s) => ({ fcI: s.fcI + 1, fcFlip: false }))} className={cn("h-11 flex-1 text-[14.5px]", btnPrimary, btnPress)}>Good</button>
            </div>
          </div>
          <span className={h2}>My words</span>
          {/* dummy: word states, see REPLACE.md */}
          <div className="grid flex-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[10px]">
            {WORDS.map(([word, meaning, state]) => (
              <div key={word} className={cn(card, "flex items-center gap-3 px-[14px] py-3")}>
                <div className="flex min-w-0 flex-1 flex-col gap-[2px]"><span className="text-[15px] font-bold">{word}</span><span className="truncate text-[13px] text-[#A3ABA7]">{meaning}</span></div>
                <span className="flex-none rounded-full px-[9px] py-[2px] text-[11.5px] font-bold" style={{ color: WORD_STATE[state][0], background: WORD_STATE[state][1] }}>{state}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {S.pt === 1 && (
        <div className="grid flex-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
          {TOPICS.map(([name, pct, tr, ex2]) => {
            const Trend = tr === "up" ? TrendingUp : tr === "down" ? TrendingDown : Minus;
            return (
              <div key={name} className={cn(card, "flex flex-col gap-[10px] p-4")}>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold">{name}</span>
                  <span className={cn("flex items-center gap-1 text-[12.5px] font-bold", pct < 50 ? "text-[#EDBF73]" : "text-[#52C79A]")}><Trend size={12.5} />{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#2A2F2D]"><div className="h-full rounded-full" style={{ width: pct + "%", background: pct < 50 ? "#EDBF73" : "#52C79A" }} /></div>
                <span className="text-[13.5px] leading-[1.4] text-[#A3ABA7]">{ex2}</span>
                <button onClick={() => set({ pt: 2 })} className={cn("h-9 cursor-pointer self-start px-[14px] text-[13.5px]", btnOutline)}>Practice</button>
              </div>
            );
          })}
        </div>
      )}

      {S.pt === 2 && (
        <div className="flex max-w-[520px] flex-none flex-col gap-[14px]">
          <div className="flex items-center gap-[10px]">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#2A2F2D]"><div className="h-full rounded-full bg-[#52C79A] transition-[width] duration-[.25s]" style={{ width: ((S.exI % 3) + (S.exChecked ? 1 : 0)) / 3 * 100 + "%" }} /></div>
            <span className="text-[12.5px] font-medium tabular-nums text-[#A3ABA7]">{(S.exI % 3) + 1} of 3</span>
          </div>
          <span className="text-[12px] font-bold tracking-[.04em] text-[#A3ABA7]">CHOOSE THE CORRECT SENTENCE</span>
          <span className="text-[20px] font-bold leading-[1.3] tracking-[-.01em]">{ex.prompt}</span>
          <div className="flex flex-col gap-2">
            {ex.opts.map((text, i) => {
              const on = S.exSel === i, right = S.exChecked && i === ex.ans, wrong = S.exChecked && on && i !== ex.ans;
              const Icon = right ? CircleCheck : CircleX;
              return (
                <div
                  key={text}
                  onClick={() => !S.exChecked && set({ exSel: i })}
                  className={cn("flex min-h-[50px] cursor-pointer items-center gap-[10px] rounded-[16px] border-[1.5px] px-[14px] py-2 text-[15px] font-bold transition-all duration-150 hover:border-[#52C79A]",
                    right ? "border-[#9ADBBE] bg-[rgba(154,219,190,.14)]" : wrong ? "border-[#F26B6B] bg-[rgba(242,107,107,.12)]" : on ? "border-[#52C79A] bg-[#212524]" : "border-[#2A2F2D] bg-[#212524]")}
                >
                  <span className="flex-1">{text}</span>
                  <Icon size={18} style={{ color: right ? "#9ADBBE" : "#F26B6B", opacity: right || wrong ? 1 : 0 }} />
                </div>
              );
            })}
          </div>
          {S.exChecked && (
            <div className={cn("flex animate-[lgup_.2s_ease-out] flex-col gap-[3px] rounded-[16px] border px-[14px] py-3", ok ? "border-[#9ADBBE] bg-[rgba(154,219,190,.14)]" : "border-[#EDBF73] bg-[rgba(237,191,115,.1)]")}>
              <span className={cn("text-[14.5px] font-bold", ok ? "text-[#9ADBBE]" : "text-[#EDBF73]")}>{ok ? "Correct. +3 XP" : "Not quite"}</span>
              <span className="text-[13.5px] leading-[1.45] text-[#F3F6F4]">{ex.why}</span>
            </div>
          )}
          <button
            onClick={() => (S.exChecked ? set((s) => ({ exI: s.exI + 1, exSel: null, exChecked: false })) : set({ exChecked: true }))}
            disabled={exOff}
            className={cn("h-12 text-[15px]", btnPrimary, btnPress, exOff && "cursor-not-allowed opacity-45")}
          >
            {S.exChecked ? "Continue" : "Check"}
          </button>
        </div>
      )}

      {S.pt === 3 && (
        <div onClick={openReading} className="flex max-w-[720px] flex-none cursor-pointer flex-col gap-4 rounded-[22px] border border-[#212524] bg-[#171A19] p-6 hover:bg-[#212524] hover:-translate-y-0.5 transition-[background-color,transform] duration-150 ease-out">
          <Tags topic={rd.topic} level={rd.level} kind={rd.kind} />
          <div className="flex flex-col gap-2">
            <span className="text-[24px] font-bold leading-[1.2] tracking-[-.01em]">{rd.title}</span>
            <span className="text-[14.5px] leading-[1.55] text-[#A3ABA7]">Read a short article, then answer {SESSION_QUESTIONS} questions. Multiple choice and True / False / Not given.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className={cn("h-12 px-[22px] text-[15px]", btnPrimary)}>Start reading<ArrowRight size={15} /></button>
            <span className="flex items-center gap-[6px] text-[13px] text-[#A3ABA7]"><Clock size={13} />About {rd.mins} min · +{rd.xp} XP</span>
          </div>
        </div>
      )}

      {S.pt === 4 && (
        <div onClick={openWriting} className="flex max-w-[720px] flex-none cursor-pointer flex-col gap-4 rounded-[22px] border border-[#212524] bg-[#171A19] p-6 transition-[border-color] duration-150 hover:bg-[#212524] hover:-translate-y-0.5">
          <Tags topic={wr.topic} level={wr.level} kind={wr.kind} />
          <div className="flex flex-col gap-2">
            <span className="text-[24px] font-bold leading-[1.2] tracking-[-.01em]">{wr.title}</span>
            <span className="text-[14.5px] leading-[1.55] text-[#A3ABA7]">Write at least {wr.min} words. Get a score, feedback and a correction for every sentence.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className={cn("h-12 px-[22px] text-[15px]", btnPrimary)}>Start writing<ArrowRight size={15} /></button>
            <span className="flex items-center gap-[6px] text-[13px] text-[#A3ABA7]"><Clock size={13} />About {wr.mins} min · +{wr.xp} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Tags({ topic, level, kind }: { topic: string; level: string; kind: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-bold">{topic}</span>
      <span className={cn(tag, "border-[#212524] bg-[#212524] text-[#52C79A]")}>{levelName(level)}</span>
      <span className={cn(tag, "border-[#2A2F2D] bg-[#212524] text-[#52C79A]")}>{kind}</span>
    </div>
  );
}

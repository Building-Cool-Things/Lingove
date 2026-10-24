"use client";

// Reading session (prototype lines 492–579, logic `rwVals`), fed by app/actions/reading.ts.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookmarkPlus, Check, ChevronDown, CircleAlert, CircleCheck, CircleX, Clock, LayoutGrid, MessageSquareText,
  MousePointerClick, RotateCcw, ScanSearch, Timer, X, Zap,
} from "lucide-react";

import { saveWord } from "@/app/actions/vocab";
import { levelName } from "@/lib/lingov/data";
import { RS_SKILLS, feedback, fmtTime, glossaryRe, labelOf, paragraphsOf, questionsOf, rsSteps, scoreColor, verdict } from "@/lib/lingov/reading";
import { cn } from "@/lib/utils";
import { useLingov } from "./store";
import { btnPrimary, caps6, card } from "./ui";

const topBtn = "h-[38px] px-3 border-0 rounded-full bg-transparent text-[#F3F6F4] text-[14px] font-bold cursor-pointer flex items-center gap-[7px] hover:bg-[#212524]";
const pillGreen = "text-[11.5px] font-bold text-[#52C79A] bg-[#212524] border border-[#212524] rounded-full px-[9px] py-[2px]";
const pillBlue = "text-[11.5px] font-bold text-[#52C79A] bg-[#212524] border border-[#2A2F2D] rounded-full px-[9px] py-[2px]";
const pad = "p-[24px_20px_28px] dk:p-[40px_40px_48px]";

export const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export function SessionTopBar({ exitLabel, topic, level, kind, done, meta, onExit, onAgain }: {
  exitLabel: string; topic: string; level: string; kind: string; done: boolean; meta: [string, string] | null; onExit: () => void; onAgain: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex-none h-[60px] flex items-center gap-2.5 px-5 dk:px-7 border-b border-[#2A2F2D] bg-[#171A19]">
      <div className="flex-1 min-w-0 flex">
        <button onClick={onExit} className={cn(topBtn, "-ml-2")}><ArrowLeft size={14} />{exitLabel}</button>
      </div>
      <div className="flex items-center gap-2 flex-none">
        {topic ? <span className="text-[14.5px] font-bold">{titleCase(topic)}</span> : null}
        {level ? <span className={pillGreen}>{levelName(level)}</span> : null}
        {kind ? <span className={pillBlue}>{kind}</span> : null}
      </div>
      <div className="flex-1 min-w-0 flex justify-end gap-[2px]">
        {done ? <button onClick={() => router.push("/dashboard")} className={cn(topBtn, "hidden dk:flex")}><LayoutGrid size={14} />Dashboard</button> : null}
        {done ? (
          <button onClick={onAgain} className={cn(topBtn, "-mr-2")}>
            <RotateCcw size={14} /><span className="dk:hidden">Retry</span><span className="hidden dk:inline">Practice again</span>
          </button>
        ) : null}
        {meta ? (
          <span className="text-[13px] text-[#A3ABA7] flex items-center gap-1.5">
            <Clock size={13} /><span className="dk:hidden">{meta[0]}</span><span className="hidden dk:inline">{meta[1]}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function useSessionExit() {
  const router = useRouter();
  return () => (window.history.length > 1 ? router.back() : router.push("/dashboard/practice"));
}

export function CheckingSteps({ steps, bar }: { steps: React.ReactNode[]; bar: string }) {
  return (
    <>
      <div className="flex flex-col gap-3">{steps}</div>
      <div className="h-1 bg-[#2A2F2D] rounded-full overflow-hidden">
        <div className="h-full w-[30%] bg-[#52C79A] rounded-full" style={{ animation: `lgload ${bar} ease-in-out forwards` }} />
      </div>
    </>
  );
}

export const spinner = "size-11 rounded-full border-[3px] border-[#212524] border-t-[#52C79A] animate-[lgspin_.8s_linear_infinite] flex-none";

// Waiting for the AI to build a task, or a failed request (same card as "checking").
export function SessionStatus({ title, sub, error, onRetry }: { title: string; sub: string; error?: string; onRetry: () => void }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-5">
      <div className={cn(card, "w-full max-w-[420px] p-7 flex flex-col gap-[22px] animate-[lgup_.25s_ease-out]")}>
        <div className="flex items-center gap-[14px]">
          {error ? <span className="size-11 rounded-full bg-[rgba(242,107,107,.12)] text-[#F26B6B] flex items-center justify-center flex-none"><CircleAlert size={20} /></span> : <span className={spinner} />}
          <div className="flex flex-col gap-[2px]"><span className="text-[17px] font-bold">{error ? "Something went wrong" : title}</span><span className="text-[13px] text-[#A3ABA7]">{error || sub}</span></div>
        </div>
        {error ? (
          <button onClick={onRetry} className={cn(btnPrimary, "h-12 px-[22px] text-[15px]")}><RotateCcw size={15} />Try again</button>
        ) : (
          <div className="h-1 bg-[#2A2F2D] rounded-full overflow-hidden"><div className="h-full w-[30%] bg-[#52C79A] rounded-full" style={{ animation: "lgload 6s ease-out forwards" }} /></div>
        )}
      </div>
    </div>
  );
}

function Footer({ answered, n, ans, err, onSubmit, className }: { answered: number; n: number; ans: Record<number, string>; err: string; onSubmit: () => void; className: string }) {
  const off = answered < n;
  return (
    <div className={cn("flex-none items-center gap-4 pt-[14px] border-t border-[#2A2F2D] bg-[#171A19]", className)}>
      <div className="flex-1 min-w-0 flex flex-col gap-[7px]">
        <div className="flex gap-[5px]">
          {Array.from({ length: n }, (_, i) => <span key={i} className="flex-1 max-w-[44px] h-1.5 rounded-full transition-[background] duration-200" style={{ background: ans[i] != null ? "#52C79A" : "#2A2F2D" }} />)}
        </div>
        {err ? <span className="text-[13px] font-medium text-[#EDBF73]">{err}</span> : <span className="text-[13px] font-medium text-[#A3ABA7]"><span className="text-[#F3F6F4] tabular-nums">{answered + "/" + n}</span> answered</span>}
      </div>
      <button onClick={onSubmit} disabled={off} className={cn(btnPrimary, "h-12 px-[22px] text-[15px] flex-none")} style={{ cursor: off ? "not-allowed" : "pointer", opacity: off ? 0.45 : 1 }}>
        <CircleCheck size={15} />Submit answers
      </button>
    </div>
  );
}

export function ReadingSession({ demo }: { demo?: string }) {
  const { S, set, ready, loadReading, submitReading, applyDemo } = useLingov();
  const exit = useSessionExit();
  const [saving, setSaving] = useState(false);

  // Demo link → prototype content; otherwise resume the saved passage or ask the AI for a new one.
  const needTask = !S.rdTask || (!demo && S.rdDemo);
  useEffect(() => {
    if (!ready) return;
    if (demo) applyDemo(demo);
    else if (needTask && !S.rdLoad && !S.rdErr) loadReading();
  }, [ready, demo, needTask, S.rdLoad, S.rdErr, applyDemo, loadReading]);

  const task = needTask && !demo ? null : S.rdTask;
  const exitBar = (label: string) => ({ exitLabel: label, onExit: () => { set({ rdW: null }); exit(); }, onAgain: () => {} });
  if (!task) {
    return (
      <div className="flex h-dvh flex-col bg-[#0D0F0E] animate-[lgfade_.2s]">
        <SessionTopBar {...exitBar("Exit")} topic="" level="" kind="Article" done={false} meta={null} />
        <SessionStatus title="Preparing your passage" sub="Picked for your level and interests" error={S.rdErr} onRetry={loadReading} />
      </div>
    );
  }

  const qs = questionsOf(task), n = qs.length, paras = paragraphsOf(task), gre = glossaryRe(task);
  const gloss = (w: string) => task.glossary?.find((g) => g.word.toLowerCase() === w);
  const ans = S.rdAns, res = S.rdRes, sub = S.rdSub && !!res, checking = !sub && S.rdChecking, notDone = !sub && !S.rdChecking;
  const answered = qs.filter((_, i) => ans[i] != null).length;
  const good = qs.map((_, i) => !!res?.view.results[i]?.isCorrect);
  const right = good.filter(Boolean).length;
  const focus = S.rdFocus, wk = S.rdW, g = wk ? gloss(wk) : undefined, saved = S.rdSaved.includes(wk ?? "");
  const col = scoreColor(right, n);
  const mins = Math.max(5, Math.round(task.passageWordCount / 25));

  async function save() {
    if (!g || saved || saving) return;
    if (!S.rdDemo) {
      setSaving(true);
      try {
        const example = paras.join(" ").match(new RegExp("[^.!?]*\\b" + g.word + "\\b[^.!?]*[.!?]?", "i"))?.[0].trim() ?? "";
        await saveWord({ word: g.word, meaning: g.meaning, translation: g.native, pronunciation: g.ipa, partOfSpeech: g.partOfSpeech, example });
      } catch {
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    set((s) => ({ rdSaved: s.rdSaved.includes(wk!) ? s.rdSaved : [...s.rdSaved, wk!] }));
  }

  return (
    <div className="flex h-dvh flex-col bg-[#0D0F0E] animate-[lgfade_.2s]">
      <SessionTopBar
        {...exitBar(sub ? "Back" : "Exit")} topic={task.topic} level={task.level} kind={titleCase(task.passageType)} done={sub}
        meta={notDone ? [mins + " min", "About " + mins + " min"] : null}
        onAgain={() => set({ rdAns: {}, rdSub: false, rdChecking: false, rdRes: null, rdOpen: null, rdFocus: null, rdW: null, rdErr: "", rdT0: Date.now() })}
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto dk:flex-row dk:overflow-hidden">
        {/* Passage */}
        <div className="flex-none dk:flex-[1.05] min-w-0 min-h-0 overflow-visible dk:overflow-y-auto border-b border-[#2A2F2D] dk:border-b-0 dk:border-r relative flex flex-col">
          <div className={cn("flex-1 w-full max-w-[660px] mx-auto flex flex-col gap-1.5", pad)}>
            <span className="text-[11.5px] font-bold tracking-[.06em] text-[#52C79A]">READING PASSAGE</span>
            <h1 className="mt-2 mb-1.5 font-bold text-[26px] dk:text-[32px] leading-[1.15] tracking-[-.01em] text-balance">{task.title}</h1>
            <div className="flex items-center gap-2 flex-wrap text-[13px] text-[#A3ABA7] mb-[14px]">
              <span>{task.passageWordCount} words</span>
              {gre ? <><span className="size-[3px] rounded-full bg-[#A3ABA7]" /><span className="flex items-center gap-1.5"><MousePointerClick size={13} />Tap underlined words for their meaning</span></> : null}
            </div>
            {paras.map((en, i) => {
              const fo = focus === i;
              return (
                <div key={i} className="rounded-[14px] px-4 py-3 -mx-4 transition-all duration-300 flex flex-col gap-1.5" style={{ background: fo ? "rgba(82,199,154,.09)" : "transparent", boxShadow: fo ? "inset 0 0 0 1px rgba(82,199,154,.45)" : "none" }}>
                  {fo ? <span className="text-[12px] font-medium text-[#52C79A] flex items-center gap-1.5"><ScanSearch size={12} />The answer is in this paragraph</span> : null}
                  <p className="m-0 text-[17px] leading-[1.8] text-pretty transition-colors duration-300" style={{ color: focus == null || fo ? "#F3F6F4" : "#A3ABA7" }}>
                    {(gre ? en.split(gre) : [en]).map((t, k) => {
                      if (k % 2 === 0) return <span key={k}>{t}</span>;
                      const key = t.toLowerCase(), on = wk === key;
                      return (
                        <span key={k} onClick={() => set({ rdW: key })} className="cursor-pointer rounded-[3px] transition-all duration-150 hover:!text-[#52C79A]" style={{ borderBottom: `1.5px dotted ${on ? "#52C79A" : "#A3ABA7"}`, color: on ? "#52C79A" : "inherit", background: on ? "rgba(82,199,154,.14)" : "transparent" }}>{t}</span>
                      );
                    })}
                  </p>
                </div>
              );
            })}
          </div>
          {g ? (
            <div className="sticky bottom-0 flex-none px-5 dk:px-7 pb-4 animate-[lgup_.2s_ease-out]">
              <div className="max-w-[660px] mx-auto bg-[#212524] border border-[#2A2F2D] rounded-[16px] px-4 py-[14px] flex items-start gap-3">
                <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <div className="flex items-baseline gap-2.5"><span className="text-[17px] font-bold">{wk}</span><span className="tabular-nums text-[12px] text-[#A3ABA7]">{g.ipa}</span></div>
                  <span className="text-[14.5px] leading-[1.5]">{g.meaning}</span>
                  <span className="text-[14px] text-[#A3ABA7]">{g.native}</span>
                </div>
                <button
                  onClick={save}
                  className="h-[34px] px-3 border border-[#2A2F2D] rounded-[16px] text-[13px] font-medium cursor-pointer flex items-center gap-1.5 flex-none"
                  style={{ background: saved ? "#212524" : "transparent", color: saved ? "#52C79A" : "#F3F6F4", opacity: saving ? 0.45 : 1 }}
                >
                  {saved ? <Check size={13} /> : <BookmarkPlus size={13} />}{saved ? "Saved" : "Save word"}
                </button>
                <button onClick={() => set({ rdW: null })} aria-label="Close" className="size-[34px] border-0 rounded-[16px] bg-transparent text-[#A3ABA7] cursor-pointer flex-none flex items-center justify-center hover:bg-[#171A19]"><X size={17} /></button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Questions / checking / results */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#171A19]">
          <div className="flex-1 min-h-0 overflow-visible dk:overflow-y-auto">
            <div className={cn("w-full max-w-[700px] mx-auto flex flex-col gap-[14px]", pad)}>
              {notDone ? (
                <>
                  <div className="flex justify-between items-baseline gap-3"><span className={caps6}>{n} QUESTIONS</span><span className="text-[13px] text-[#A3ABA7]">Answer all, then submit</span></div>
                  {qs.map((x, i) => {
                    const a = ans[i], d = a != null, lk = x.p != null && focus === x.p;
                    return (
                      <div key={i} className={cn(card, "p-5 flex flex-col gap-4 transition-[border-color] duration-200")} style={{ borderColor: d ? "#212524" : "#2A2F2D" }}>
                        <div className="flex gap-3 items-start">
                          <span className="size-7 rounded-[9px] border tabular-nums text-[12.5px] flex items-center justify-center flex-none transition-all duration-200" style={{ background: d ? "#52C79A" : "#212524", color: d ? "#ffffff" : "#A3ABA7", borderColor: d ? "#52C79A" : "#2A2F2D" }}>
                            {d ? <Check size={12.5} /> : i + 1}
                          </span>
                          <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                            <span className="text-[11px] font-bold tracking-[.06em] text-[#A3ABA7]">{x.tf ? "TRUE / FALSE / NOT GIVEN" : "MULTIPLE CHOICE"}</span>
                            <span className="text-[16px] font-bold leading-[1.45] text-pretty">{x.prompt}</span>
                          </div>
                          {x.p != null ? (
                            <button onClick={() => set((s) => ({ rdFocus: s.rdFocus === x.p ? null : x.p }))} aria-label="Find in passage" className="whitespace-nowrap flex-none h-7 px-[9px] border rounded-[8px] tabular-nums text-[11.5px] cursor-pointer flex items-center gap-[5px] transition-all duration-150 hover:!border-[#52C79A]" style={{ background: lk ? "#212524" : "transparent", borderColor: lk ? "#52C79A" : "#2A2F2D", color: lk ? "#52C79A" : "#A3ABA7" }}>
                              <ScanSearch size={13} />¶{x.p + 1}
                            </button>
                          ) : null}
                        </div>
                        <div className={cn("flex flex-col gap-2 dk:pl-10", x.tf && "dk:grid dk:grid-cols-3")}>
                          {x.labels.map((t, k) => {
                            const v = x.values[k], on = a === v;
                            return (
                              <div key={k} onClick={() => set((s) => ({ rdAns: { ...s.rdAns, [i]: v } }))} className={cn("min-h-12 border-[1.5px] rounded-[16px] flex items-center gap-3 px-[14px] py-2 text-[15px] cursor-pointer transition-all duration-150", on ? "border-[#52C79A] bg-[#212524]" : "border-[#2A2F2D] bg-[#171A19] hover:border-[#52C79A]", x.tf ? "justify-start dk:justify-center" : "justify-start")}>
                                {!x.tf ? (
                                  <span className="size-6 rounded-[7px] border tabular-nums text-[11.5px] flex items-center justify-center flex-none transition-all duration-150" style={{ borderColor: on ? "#52C79A" : "#2A2F2D", background: on ? "#52C79A" : "transparent", color: on ? "#ffffff" : "#A3ABA7" }}>{v}</span>
                                ) : null}
                                <span className="leading-[1.4]" style={{ fontWeight: on ? 600 : 400 }}>{t}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : null}

              {checking ? (
                <div className="min-h-[420px] flex items-center justify-center">
                  <div className={cn(card, "w-full max-w-[420px] p-7 flex flex-col gap-[22px] animate-[lgup_.25s_ease-out]")}>
                    <div className="flex items-center gap-[14px]">
                      <span className={spinner} />
                      <div className="flex flex-col gap-[2px]"><span className="text-[17px] font-bold">Marking your answers</span><span className="text-[13px] text-[#A3ABA7]">This takes a few seconds</span></div>
                    </div>
                    <CheckingSteps bar="1.5s" steps={rsSteps(n).map(([t, d]) => (
                      <div key={t} className="flex items-center gap-3 text-[14.5px]" style={{ animation: `lgup .35s ${d}s both` }}>
                        <span className="size-[22px] rounded-full bg-[#212524] text-[#52C79A] flex items-center justify-center flex-none"><Check size={12} /></span>{t}
                      </div>
                    ))} />
                  </div>
                </div>
              ) : null}

              {sub && res ? (
                <>
                  <div className="bg-[#171A19] border border-[#212524] rounded-[24px] p-6 flex items-center gap-6 flex-wrap animate-[lgup_.3s_ease-out]">
                    <div className="relative size-[124px] flex-none">
                      <svg width="124" height="124" viewBox="0 0 124 124" className="-rotate-90">
                        <circle cx="62" cy="62" r="54" fill="none" stroke="#2A2F2D" strokeWidth="10" />
                        <circle cx="62" cy="62" r="54" fill="none" stroke={col} strokeWidth="10" strokeLinecap="round" strokeDasharray="339" strokeDashoffset={Math.round(339 * (1 - right / n))} style={{ transition: "stroke-dashoffset .8s" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-bold text-[34px] tracking-[-.01em] leading-none tabular-nums">{((right / n) * 10).toFixed(1)}</span>
                        <span className="tabular-nums text-[11.5px] text-[#A3ABA7] mt-1">/10</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-[220px] flex flex-col gap-[14px]">
                      <div className="flex flex-col gap-1"><span className={caps6}>READING SCORE</span><span className="font-bold text-[26px] tracking-[-.01em]" style={{ color: col }}>{verdict(right, n)}</span></div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="h-[26px] px-2.5 rounded-full whitespace-nowrap flex-none bg-[#212524] border border-[#212524] text-[#52C79A] text-[12.5px] font-medium flex items-center gap-1.5"><Zap size={12.5} />{"+" + res.xp + " XP"}</span>
                        <span className="h-[26px] px-2.5 rounded-full whitespace-nowrap flex-none bg-[#212524] border border-[#2A2F2D] text-[#F3F6F4] text-[12.5px] font-medium flex items-center gap-1.5"><Timer size={12.5} />{fmtTime(res.view.timeTaken)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {([[String(n), "QUESTIONS", "#F3F6F4"], [right, "CORRECT", "#9ADBBE"], [n - right, "WRONG", "#EDBF73"], [Math.round((right / n) * 100) + "%", "ACCURACY", "#F3F6F4"]] as const).map(([v, l, c], k) => (
                          <div key={l} className="min-w-0 flex flex-col gap-[2px]" style={{ paddingLeft: k ? 12 : 0, borderLeft: k ? "1px solid #2A2F2D" : "0" }}>
                            <span className="font-bold text-[21px] tabular-nums" style={{ color: c }}>{v}</span>
                            <span className="text-[10.5px] font-bold tracking-[.06em] text-[#A3ABA7]">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className={caps6}>BY SKILL</span>
                    <div className={cn(card, "px-5 py-1.5 flex flex-col")}>
                      {RS_SKILLS.map(([name, skill, note]) => ({ name, note, ids: qs.map((q, i) => (q.skill === skill ? i : -1)).filter((i) => i >= 0) })).filter((r) => r.ids.length).map(({ name, note, ids }, k, rows) => {
                        const r = ids.filter((i) => good[i]).length, c = r === ids.length ? "#52C79A" : r ? "#EDBF73" : "#EDBF73";
                        return (
                          <div key={name} className="flex items-center gap-4 py-[14px]" style={{ borderBottom: k < rows.length - 1 ? "1px solid #2A2F2D" : "0" }}>
                            <div className="flex-1 min-w-0 flex flex-col gap-[2px]"><span className="text-[14.5px] font-bold">{name}</span><span className="text-[12.5px] text-[#A3ABA7]">{note}</span></div>
                            <div className="flex gap-1 flex-none">{ids.map((i) => <span key={i} className="w-[22px] h-2 rounded-full" style={{ background: good[i] ? "#52C79A" : "#EDBF73" }} />)}</div>
                            <span className="tabular-nums text-[13px] w-[34px] text-right flex-none" style={{ color: c }}>{r + "/" + ids.length}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className={caps6}>FEEDBACK</span>
                    <div className={cn(card, "p-5 flex gap-[14px]")}>
                      <span className="size-[34px] rounded-[16px] bg-[#212524] text-[#52C79A] flex items-center justify-center flex-none"><MessageSquareText size={16} /></span>
                      <span className="text-[15.5px] leading-[1.65] text-[#F3F6F4] text-pretty">{res.view.generalFeedback || feedback(qs, good)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className={caps6}>QUESTION REVIEW · {right}/{n} CORRECT</span>
                    {qs.map((x, i) => {
                      const ok = good[i], open = S.rdOpen === i;
                      return (
                        <div key={i} className="bg-[#171A19] border rounded-[18px] overflow-hidden transition-[border-color] duration-200" style={{ borderColor: open ? (ok ? "#52C79A" : "rgba(237,191,115,.55)") : ok ? "#212524" : "rgba(237,191,115,.28)" }}>
                          <div onClick={() => set((s) => ({ rdOpen: s.rdOpen === i ? null : i }))} className="flex items-center gap-[14px] px-[18px] py-4 cursor-pointer hover:bg-[#171A19]">
                            <span className="size-7 rounded-full tabular-nums text-[12.5px] flex items-center justify-center flex-none" style={{ background: ok ? "rgba(154,219,190,.14)" : "rgba(237,191,115,.14)", color: ok ? "#9ADBBE" : "#EDBF73" }}>{i + 1}</span>
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5 items-start">
                              <span className="text-[10.5px] font-bold tracking-[.06em] rounded-[6px] px-2 py-[3px]" style={{ color: ok ? "#9ADBBE" : "#EDBF73", background: ok ? "rgba(154,219,190,.14)" : "rgba(237,191,115,.12)" }}>
                                {(x.tf ? "TRUE / FALSE / NOT GIVEN" : "MULTIPLE CHOICE") + " · " + (ok ? "CORRECT" : "INCORRECT")}
                              </span>
                              <span className="text-[15px] font-bold leading-[1.45]">{x.prompt}</span>
                            </div>
                            <ChevronDown size={18} className="text-[#A3ABA7] flex-none transition-transform duration-200" style={{ transform: `rotate(${open ? "180deg" : "0deg"})` }} />
                          </div>
                          {open ? (
                            <div className="pr-[18px] pb-[18px] pl-[60px] flex flex-col gap-3 animate-[lgup_.2s_ease-out]">
                              <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
                                <div className="bg-[#212524] border border-[#2A2F2D] rounded-[16px] px-3 py-2.5 flex flex-col gap-[3px]">
                                  <span className="text-[10.5px] font-bold tracking-[.06em] text-[#A3ABA7]">YOUR ANSWER</span>
                                  <span className="text-[14.5px] font-medium flex items-center gap-1.5" style={{ color: ok ? "#52C79A" : "#F26B6B" }}>{ok ? <CircleCheck size={14.5} /> : <CircleX size={14.5} />}{labelOf(x, ans[i])}</span>
                                </div>
                                <div className="bg-[#212524] border border-[#2A2F2D] rounded-[16px] px-3 py-2.5 flex flex-col gap-[3px]">
                                  <span className="text-[10.5px] font-bold tracking-[.06em] text-[#A3ABA7]">CORRECT ANSWER</span>
                                  <span className="text-[14.5px] font-medium text-[#52C79A]">{labelOf(x, x.correct)}</span>
                                </div>
                              </div>
                              <span className="text-[14px] leading-[1.6] text-[#F3F6F4]">{x.why}</span>
                              {x.p != null ? (
                                <button onClick={(e) => { e.stopPropagation(); set({ rdFocus: x.p }); }} className="self-start h-[34px] px-3 rounded-full text-[#F3F6F4] text-[13px] font-bold cursor-pointer flex items-center gap-1.5 border-[1.5px] border-[#2A2F2D] bg-[#171A19] shadow-[inset_-4px_-5px_0_#080A09] active:scale-[.96] active:shadow-[inset_-2px_-3px_0_#080A09] transition-transform duration-100">
                                  <ScanSearch size={13} className="text-[#52C79A]" />Show in passage
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>
          {notDone ? <Footer answered={answered} n={n} ans={ans} err={S.rdErr} onSubmit={submitReading} className="hidden dk:flex px-7 pb-[14px]" /> : null}
        </div>
      </div>
      {notDone ? <Footer answered={answered} n={n} ans={ans} err={S.rdErr} onSubmit={submitReading} className="flex dk:hidden px-5 pb-[26px]" /> : null}
    </div>
  );
}

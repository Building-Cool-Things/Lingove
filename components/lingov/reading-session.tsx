"use client";

// Reading session (prototype lines 492–579, logic `rwVals`), fed by app/actions/reading.ts.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookmarkPlus, Check, ChevronDown, CircleAlert, CircleCheck, CircleX, Clock, LayoutGrid, MessageSquareText,
  MousePointerClick, RotateCcw, ScanSearch, Timer, X, Zap,
} from "lucide-react";

import { saveWord } from "@/app/actions/vocab";
import { RS_SKILLS, feedback, fmtTime, glossaryRe, labelOf, paragraphsOf, questionsOf, rsSteps, scoreColor, verdict } from "@/lib/lingov/reading";
import { cn } from "@/lib/utils";
import { useLingov } from "./store";
import { btnPrimary, caps6, card } from "./ui";

const topBtn = "h-[38px] px-3 border-0 rounded-[10px] bg-transparent text-[#c5cee0] text-[14px] font-medium cursor-pointer flex items-center gap-[7px] hover:bg-[#0f1522]";
const pillGreen = "text-[11.5px] font-semibold text-[#7fe3a8] bg-[#0e2417] border border-[#1a3326] rounded-full px-[9px] py-[2px]";
const pillBlue = "text-[11.5px] font-semibold text-[#a9bcff] bg-[#121b36] border border-[#1f2b4d] rounded-full px-[9px] py-[2px]";
const pad = "p-[24px_20px_28px] dk:p-[40px_40px_48px]";

export const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export function SessionTopBar({ exitLabel, topic, level, kind, done, meta, onExit, onAgain }: {
  exitLabel: string; topic: string; level: string; kind: string; done: boolean; meta: [string, string] | null; onExit: () => void; onAgain: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex-none h-[60px] flex items-center gap-2.5 px-5 dk:px-7 border-b border-[#121a29] bg-[#06090e]">
      <div className="flex-1 min-w-0 flex">
        <button onClick={onExit} className={cn(topBtn, "-ml-2")}><ArrowLeft size={14} />{exitLabel}</button>
      </div>
      <div className="flex items-center gap-2 flex-none">
        {topic ? <span className="text-[14.5px] font-semibold">{titleCase(topic)}</span> : null}
        {level ? <span className={pillGreen}>{level}</span> : null}
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
          <span className="text-[13px] text-[#94a3c0] flex items-center gap-1.5">
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
      <div className="h-1 bg-[#131b2a] rounded-full overflow-hidden">
        <div className="h-full w-[30%] bg-[#1d8a50] rounded-full" style={{ animation: `lgload ${bar} ease-in-out forwards` }} />
      </div>
    </>
  );
}

export const spinner = "size-11 rounded-full border-[3px] border-[#16261d] border-t-[#1d8a50] animate-[lgspin_.8s_linear_infinite] flex-none";

// Waiting for the AI to build a task, or a failed request (same card as "checking").
export function SessionStatus({ title, sub, error, onRetry }: { title: string; sub: string; error?: string; onRetry: () => void }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-5">
      <div className={cn(card, "w-full max-w-[420px] p-7 flex flex-col gap-[22px] animate-[lgup_.25s_ease-out]")}>
        <div className="flex items-center gap-[14px]">
          {error ? <span className="size-11 rounded-full bg-[rgba(234,122,79,.12)] text-[#ea7a4f] flex items-center justify-center flex-none"><CircleAlert size={20} /></span> : <span className={spinner} />}
          <div className="flex flex-col gap-[2px]"><span className="text-[17px] font-semibold">{error ? "Something went wrong" : title}</span><span className="text-[13px] text-[#94a3c0]">{error || sub}</span></div>
        </div>
        {error ? (
          <button onClick={onRetry} className={cn(btnPrimary, "h-12 px-[22px] rounded-[12px] text-[15px]")}><RotateCcw size={15} />Try again</button>
        ) : (
          <div className="h-1 bg-[#131b2a] rounded-full overflow-hidden"><div className="h-full w-[30%] bg-[#1d8a50] rounded-full" style={{ animation: "lgload 6s ease-out forwards" }} /></div>
        )}
      </div>
    </div>
  );
}

function Footer({ answered, n, ans, err, onSubmit, className }: { answered: number; n: number; ans: Record<number, string>; err: string; onSubmit: () => void; className: string }) {
  const off = answered < n;
  return (
    <div className={cn("flex-none items-center gap-4 pt-[14px] border-t border-[#121a29] bg-[rgba(6,9,14,.96)] backdrop-blur-[14px]", className)}>
      <div className="flex-1 min-w-0 flex flex-col gap-[7px]">
        <div className="flex gap-[5px]">
          {Array.from({ length: n }, (_, i) => <span key={i} className="flex-1 max-w-[44px] h-1.5 rounded-full transition-[background] duration-200" style={{ background: ans[i] != null ? "#1d8a50" : "#1d2638" }} />)}
        </div>
        {err ? <span className="text-[13px] font-medium text-[#ea7a4f]">{err}</span> : <span className="text-[13px] font-medium text-[#94a3c0]"><span className="text-[#eaeef7] font-mono">{answered + "/" + n}</span> answered</span>}
      </div>
      <button onClick={onSubmit} disabled={off} className={cn(btnPrimary, "h-12 px-[22px] rounded-[12px] text-[15px] flex-none")} style={{ cursor: off ? "not-allowed" : "pointer", opacity: off ? 0.45 : 1 }}>
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
      <div className="flex h-dvh flex-col bg-[#040608] animate-[lgfade_.2s]">
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
    <div className="flex h-dvh flex-col bg-[#040608] animate-[lgfade_.2s]">
      <SessionTopBar
        {...exitBar(sub ? "Back" : "Exit")} topic={task.topic} level={task.level} kind={titleCase(task.passageType)} done={sub}
        meta={notDone ? [mins + " min", "About " + mins + " min"] : null}
        onAgain={() => set({ rdAns: {}, rdSub: false, rdChecking: false, rdRes: null, rdOpen: null, rdFocus: null, rdW: null, rdErr: "", rdT0: Date.now() })}
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto dk:flex-row dk:overflow-hidden">
        {/* Passage */}
        <div className="flex-none dk:flex-[1.05] min-w-0 min-h-0 overflow-visible dk:overflow-y-auto border-b border-[#121a29] dk:border-b-0 dk:border-r relative flex flex-col">
          <div className={cn("flex-1 w-full max-w-[660px] mx-auto flex flex-col gap-1.5", pad)}>
            <span className="text-[11.5px] font-semibold tracking-[.06em] text-[#4cc283]">READING PASSAGE</span>
            <h1 className="mt-2 mb-1.5 font-semibold text-[26px] dk:text-[32px] leading-[1.15] tracking-[-.035em] text-balance">{task.title}</h1>
            <div className="flex items-center gap-2 flex-wrap text-[13px] text-[#94a3c0] mb-[14px]">
              <span>{task.passageWordCount} words</span>
              {gre ? <><span className="size-[3px] rounded-full bg-[#4f6085]" /><span className="flex items-center gap-1.5"><MousePointerClick size={13} />Tap underlined words for their meaning</span></> : null}
            </div>
            {paras.map((en, i) => {
              const fo = focus === i;
              return (
                <div key={i} className="rounded-[14px] px-4 py-3 -mx-4 transition-all duration-300 flex flex-col gap-1.5" style={{ background: fo ? "rgba(29,138,80,.09)" : "transparent", boxShadow: fo ? "inset 0 0 0 1px rgba(29,138,80,.45)" : "none" }}>
                  {fo ? <span className="text-[12px] font-medium text-[#7fe3a8] flex items-center gap-1.5"><ScanSearch size={12} />The answer is in this paragraph</span> : null}
                  <p className="m-0 text-[17px] leading-[1.8] text-pretty transition-colors duration-300" style={{ color: focus == null || fo ? "#e3e9f3" : "#8391ad" }}>
                    {(gre ? en.split(gre) : [en]).map((t, k) => {
                      if (k % 2 === 0) return <span key={k}>{t}</span>;
                      const key = t.toLowerCase(), on = wk === key;
                      return (
                        <span key={k} onClick={() => set({ rdW: key })} className="cursor-pointer rounded-[3px] transition-all duration-150 hover:!text-[#7fe3a8]" style={{ borderBottom: `1.5px dotted ${on ? "#7fe3a8" : "#4f6085"}`, color: on ? "#7fe3a8" : "inherit", background: on ? "rgba(29,138,80,.14)" : "transparent" }}>{t}</span>
                      );
                    })}
                  </p>
                </div>
              );
            })}
          </div>
          {g ? (
            <div className="sticky bottom-0 flex-none px-5 dk:px-7 pb-4 animate-[lgup_.2s_ease-out]">
              <div className="max-w-[660px] mx-auto bg-[#0f1624] border border-[#223050] rounded-[16px] px-4 py-[14px] flex items-start gap-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,.8)]">
                <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <div className="flex items-baseline gap-2.5"><span className="text-[17px] font-semibold">{wk}</span><span className="font-mono text-[12px] text-[#94a3c0]">{g.ipa}</span></div>
                  <span className="text-[14.5px] leading-[1.5]">{g.meaning}</span>
                  <span className="text-[14px] text-[#94a3c0]">{g.native}</span>
                </div>
                <button
                  onClick={save}
                  className="h-[34px] px-3 border border-[#252f4a] rounded-[10px] text-[13px] font-medium cursor-pointer flex items-center gap-1.5 flex-none"
                  style={{ background: saved ? "#0e2417" : "transparent", color: saved ? "#7fe3a8" : "#eaeef7", opacity: saving ? 0.45 : 1 }}
                >
                  {saved ? <Check size={13} /> : <BookmarkPlus size={13} />}{saved ? "Saved" : "Save word"}
                </button>
                <button onClick={() => set({ rdW: null })} aria-label="Close" className="size-[34px] border-0 rounded-[10px] bg-transparent text-[#94a3c0] cursor-pointer flex-none flex items-center justify-center hover:bg-[#141d2f]"><X size={17} /></button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Questions / checking / results */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#05080c]">
          <div className="flex-1 min-h-0 overflow-visible dk:overflow-y-auto">
            <div className={cn("w-full max-w-[700px] mx-auto flex flex-col gap-[14px]", pad)}>
              {notDone ? (
                <>
                  <div className="flex justify-between items-baseline gap-3"><span className={caps6}>{n} QUESTIONS</span><span className="text-[13px] text-[#94a3c0]">Answer all, then submit</span></div>
                  {qs.map((x, i) => {
                    const a = ans[i], d = a != null, lk = x.p != null && focus === x.p;
                    return (
                      <div key={i} className={cn(card, "p-5 flex flex-col gap-4 transition-[border-color] duration-200")} style={{ borderColor: d ? "#1a3326" : "#182033" }}>
                        <div className="flex gap-3 items-start">
                          <span className="size-7 rounded-[9px] border font-mono text-[12.5px] flex items-center justify-center flex-none transition-all duration-200" style={{ background: d ? "#1d8a50" : "#0f1624", color: d ? "#ffffff" : "#94a3c0", borderColor: d ? "#1d8a50" : "#1b2538" }}>
                            {d ? <Check size={12.5} /> : i + 1}
                          </span>
                          <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                            <span className="text-[11px] font-semibold tracking-[.06em] text-[#667494]">{x.tf ? "TRUE / FALSE / NOT GIVEN" : "MULTIPLE CHOICE"}</span>
                            <span className="text-[16px] font-semibold leading-[1.45] text-pretty">{x.prompt}</span>
                          </div>
                          {x.p != null ? (
                            <button onClick={() => set((s) => ({ rdFocus: s.rdFocus === x.p ? null : x.p }))} aria-label="Find in passage" className="whitespace-nowrap flex-none h-7 px-[9px] border rounded-[8px] font-mono text-[11.5px] cursor-pointer flex items-center gap-[5px] transition-all duration-150 hover:!border-[#1d8a50]" style={{ background: lk ? "#0e2417" : "transparent", borderColor: lk ? "#1d8a50" : "#1d2638", color: lk ? "#7fe3a8" : "#94a3c0" }}>
                              <ScanSearch size={13} />¶{x.p + 1}
                            </button>
                          ) : null}
                        </div>
                        <div className={cn("flex flex-col gap-2 dk:pl-10", x.tf && "dk:grid dk:grid-cols-3")}>
                          {x.labels.map((t, k) => {
                            const v = x.values[k], on = a === v;
                            return (
                              <div key={k} onClick={() => set((s) => ({ rdAns: { ...s.rdAns, [i]: v } }))} className={cn("min-h-12 border-[1.5px] rounded-[12px] flex items-center gap-3 px-[14px] py-2 text-[15px] cursor-pointer transition-all duration-150", on ? "border-[#1d8a50] bg-[#0e2417]" : "border-[#182033] bg-[#0a0e16] hover:border-[#1d8a50]", x.tf ? "justify-start dk:justify-center" : "justify-start")}>
                                {!x.tf ? (
                                  <span className="size-6 rounded-[7px] border font-mono text-[11.5px] flex items-center justify-center flex-none transition-all duration-150" style={{ borderColor: on ? "#1d8a50" : "#252f4a", background: on ? "#1d8a50" : "transparent", color: on ? "#ffffff" : "#94a3c0" }}>{v}</span>
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
                      <div className="flex flex-col gap-[2px]"><span className="text-[17px] font-semibold">Marking your answers</span><span className="text-[13px] text-[#94a3c0]">This takes a few seconds</span></div>
                    </div>
                    <CheckingSteps bar="1.5s" steps={rsSteps(n).map(([t, d]) => (
                      <div key={t} className="flex items-center gap-3 text-[14.5px]" style={{ animation: `lgup .35s ${d}s both` }}>
                        <span className="size-[22px] rounded-full bg-[#0e2417] text-[#7fe3a8] flex items-center justify-center flex-none"><Check size={12} /></span>{t}
                      </div>
                    ))} />
                  </div>
                </div>
              ) : null}

              {sub && res ? (
                <>
                  <div className="bg-[radial-gradient(140%_140%_at_0%_0%,#0f2a1c_0%,#0a0e16_55%)] border border-[#1a3326] rounded-[24px] p-6 flex items-center gap-6 flex-wrap animate-[lgup_.3s_ease-out]">
                    <div className="relative size-[124px] flex-none">
                      <svg width="124" height="124" viewBox="0 0 124 124" className="-rotate-90">
                        <circle cx="62" cy="62" r="54" fill="none" stroke="#131b2a" strokeWidth="10" />
                        <circle cx="62" cy="62" r="54" fill="none" stroke={col} strokeWidth="10" strokeLinecap="round" strokeDasharray="339" strokeDashoffset={Math.round(339 * (1 - right / n))} style={{ transition: "stroke-dashoffset .8s" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-semibold text-[34px] tracking-[-.03em] leading-none tabular-nums">{((right / n) * 10).toFixed(1)}</span>
                        <span className="font-mono text-[11.5px] text-[#94a3c0] mt-1">/10</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-[220px] flex flex-col gap-[14px]">
                      <div className="flex flex-col gap-1"><span className={caps6}>READING SCORE</span><span className="font-semibold text-[26px] tracking-[-.03em]" style={{ color: col }}>{verdict(right, n)}</span></div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="h-[26px] px-2.5 rounded-full whitespace-nowrap flex-none bg-[#0e2417] border border-[#1a3326] text-[#7fe3a8] text-[12.5px] font-medium flex items-center gap-1.5"><Zap size={12.5} />{"+" + res.xp + " XP"}</span>
                        <span className="h-[26px] px-2.5 rounded-full whitespace-nowrap flex-none bg-[#0f1624] border border-[#182033] text-[#c5cee0] text-[12.5px] font-medium flex items-center gap-1.5"><Timer size={12.5} />{fmtTime(res.view.timeTaken)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {([[String(n), "QUESTIONS", "#eaeef7"], [right, "CORRECT", "#4cc283"], [n - right, "WRONG", "#ea7a4f"], [Math.round((right / n) * 100) + "%", "ACCURACY", "#eaeef7"]] as const).map(([v, l, c], k) => (
                          <div key={l} className="min-w-0 flex flex-col gap-[2px]" style={{ paddingLeft: k ? 12 : 0, borderLeft: k ? "1px solid #1d2638" : "0" }}>
                            <span className="font-semibold text-[21px] tabular-nums" style={{ color: c }}>{v}</span>
                            <span className="text-[10.5px] font-semibold tracking-[.06em] text-[#94a3c0]">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className={caps6}>BY SKILL</span>
                    <div className={cn(card, "px-5 py-1.5 flex flex-col")}>
                      {RS_SKILLS.map(([name, skill, note]) => ({ name, note, ids: qs.map((q, i) => (q.skill === skill ? i : -1)).filter((i) => i >= 0) })).filter((r) => r.ids.length).map(({ name, note, ids }, k, rows) => {
                        const r = ids.filter((i) => good[i]).length, c = r === ids.length ? "#4cc283" : r ? "#ffb38f" : "#ea7a4f";
                        return (
                          <div key={name} className="flex items-center gap-4 py-[14px]" style={{ borderBottom: k < rows.length - 1 ? "1px solid #121a29" : "0" }}>
                            <div className="flex-1 min-w-0 flex flex-col gap-[2px]"><span className="text-[14.5px] font-semibold">{name}</span><span className="text-[12.5px] text-[#94a3c0]">{note}</span></div>
                            <div className="flex gap-1 flex-none">{ids.map((i) => <span key={i} className="w-[22px] h-2 rounded-full" style={{ background: good[i] ? "#1d8a50" : "#ea7a4f" }} />)}</div>
                            <span className="font-mono text-[13px] w-[34px] text-right flex-none" style={{ color: c }}>{r + "/" + ids.length}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className={caps6}>FEEDBACK</span>
                    <div className={cn(card, "p-5 flex gap-[14px]")}>
                      <span className="size-[34px] rounded-[10px] bg-[#0e2417] text-[#7fe3a8] flex items-center justify-center flex-none"><MessageSquareText size={16} /></span>
                      <span className="text-[15.5px] leading-[1.65] text-[#d7deeb] text-pretty">{res.view.generalFeedback || feedback(qs, good)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className={caps6}>QUESTION REVIEW · {right}/{n} CORRECT</span>
                    {qs.map((x, i) => {
                      const ok = good[i], open = S.rdOpen === i;
                      return (
                        <div key={i} className="bg-[#0a0e16] border rounded-[18px] overflow-hidden transition-[border-color] duration-200" style={{ borderColor: open ? (ok ? "#1d8a50" : "rgba(234,122,79,.55)") : ok ? "#1a3326" : "rgba(234,122,79,.28)" }}>
                          <div onClick={() => set((s) => ({ rdOpen: s.rdOpen === i ? null : i }))} className="flex items-center gap-[14px] px-[18px] py-4 cursor-pointer hover:bg-[#0c111b]">
                            <span className="size-7 rounded-full font-mono text-[12.5px] flex items-center justify-center flex-none" style={{ background: ok ? "#0e2417" : "rgba(234,122,79,.14)", color: ok ? "#7fe3a8" : "#ea7a4f" }}>{i + 1}</span>
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5 items-start">
                              <span className="text-[10.5px] font-semibold tracking-[.06em] rounded-[6px] px-2 py-[3px]" style={{ color: ok ? "#7fe3a8" : "#ea7a4f", background: ok ? "#0e2417" : "rgba(234,122,79,.12)" }}>
                                {(x.tf ? "TRUE / FALSE / NOT GIVEN" : "MULTIPLE CHOICE") + " · " + (ok ? "CORRECT" : "INCORRECT")}
                              </span>
                              <span className="text-[15px] font-semibold leading-[1.45]">{x.prompt}</span>
                            </div>
                            <ChevronDown size={18} className="text-[#94a3c0] flex-none transition-transform duration-200" style={{ transform: `rotate(${open ? "180deg" : "0deg"})` }} />
                          </div>
                          {open ? (
                            <div className="pr-[18px] pb-[18px] pl-[60px] flex flex-col gap-3 animate-[lgup_.2s_ease-out]">
                              <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
                                <div className="bg-[#0f1624] border border-[#182033] rounded-[12px] px-3 py-2.5 flex flex-col gap-[3px]">
                                  <span className="text-[10.5px] font-semibold tracking-[.06em] text-[#94a3c0]">YOUR ANSWER</span>
                                  <span className="text-[14.5px] font-medium flex items-center gap-1.5" style={{ color: ok ? "#7fe3a8" : "#ea7a4f" }}>{ok ? <CircleCheck size={14.5} /> : <CircleX size={14.5} />}{labelOf(x, ans[i])}</span>
                                </div>
                                <div className="bg-[#0f1624] border border-[#182033] rounded-[12px] px-3 py-2.5 flex flex-col gap-[3px]">
                                  <span className="text-[10.5px] font-semibold tracking-[.06em] text-[#94a3c0]">CORRECT ANSWER</span>
                                  <span className="text-[14.5px] font-medium text-[#7fe3a8]">{labelOf(x, x.correct)}</span>
                                </div>
                              </div>
                              <span className="text-[14px] leading-[1.6] text-[#c5cee0]">{x.why}</span>
                              {x.p != null ? (
                                <button onClick={(e) => { e.stopPropagation(); set({ rdFocus: x.p }); }} className="self-start h-[34px] px-3 border border-[#252f4a] rounded-[10px] bg-transparent text-[#eaeef7] text-[13px] font-medium cursor-pointer flex items-center gap-1.5 hover:border-[#1d8a50]">
                                  <ScanSearch size={13} className="text-[#7fe3a8]" />Show in passage
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

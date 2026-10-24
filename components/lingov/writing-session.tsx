"use client";

// Writing session (prototype lines 581–679, logic `wsVals`), fed by app/actions/writing.ts.
// Demo links use the prototype's rule checker; real prompts use the AI analysis (analyseAI).
import { useEffect, useMemo } from "react";
import {
  ArrowRight, Check, CircleAlert, CircleCheck, ClipboardCheck, CloudCheck, Eraser, FileText, MousePointerClick,
  Pencil, Sparkles, Target, WandSparkles,
} from "lucide-react";

import { levelName } from "@/lib/lingov/data";
import { WCAT, WS0, analyse, analyseAI, applyAll, applyOne, levelOf, scoreCol, verdictOf, type Cat } from "@/lib/lingov/writing";
import { cn } from "@/lib/utils";
import { CheckingSteps, SessionStatus, SessionTopBar, spinner, titleCase, useSessionExit } from "./reading-session";
import { useLingov } from "./store";
import { btnPrimary, caps6, card } from "./ui";

const smallBtn = "whitespace-nowrap flex-none h-8 px-[11px] rounded-full text-[12.5px] font-bold cursor-pointer flex items-center gap-1.5";
const greenBtn = cn(smallBtn, "border-0 bg-[rgba(82,199,154,.10)] text-[#52C79A] hover:bg-[rgba(82,199,154,.18)]");
const STEPS: [string, number][] = [["Grammar", 0.15], ["Spelling", 0.4], ["Punctuation", 0.65], ["Clarity", 0.9], ["Structure", 1.15]];

export function WritingSession({ demo }: { demo?: string }) {
  const { S, set, ready, loadWriting, checkWriting, applyDemo } = useLingov();
  const exit = useSessionExit();

  // Demo link → prototype prompt; otherwise resume the saved prompt or ask the AI for a new one.
  const needQ = !S.wsQ || (!demo && S.wsDemo);
  useEffect(() => {
    if (!ready) return;
    if (demo) applyDemo(demo);
    else if (needQ && !S.wsLoad && !S.wsErr) loadWriting();
  }, [ready, demo, needQ, S.wsLoad, S.wsErr, applyDemo, loadWriting]);

  const q = needQ && !demo ? null : S.wsQ;
  const wt = S.wsText, res = S.wsRes, done = S.wsDone && (S.wsDemo || !!res), editing = !done && !S.wsChecking, checking = !done && S.wsChecking;
  const min = q?.minWords ?? 100;
  const a = useMemo(() => (res && !S.wsDemo ? analyseAI(wt, res.view, min) : analyse(wt)), [wt, res, S.wsDemo, min]);

  if (!q) {
    return (
      <div className="flex h-dvh flex-col bg-[#0D0F0E] animate-[lgfade_.2s]">
        <SessionTopBar exitLabel="Exit" topic="" level="" kind="Essay" done={false} meta={null} onExit={exit} onAgain={() => {}} />
        <SessionStatus title="Preparing your prompt" sub="Picked for your level and interests" error={S.wsErr} onRetry={loadWriting} />
      </div>
    );
  }

  const { words, sents, paras, ev, all, errs, okN, tot, cats, top, score, fb, plan, pn, crit } = a;
  const col = scoreCol(score), cat = S.wsCat, view = S.wsView;
  const hl = (id: string) => S.wsSel === id;
  const off = words < min;
  const mins = Math.round(min * 0.15);
  const shown = all.filter((x) => cat === "All" || x.type === cat);
  const delta = S.wsStart != null && score > S.wsStart + 0.05 ? "Up from " + S.wsStart.toFixed(1) + " after your fixes" : errs ? errs + (errs === 1 ? " correction" : " corrections") + " to review" : "No corrections needed";
  const improved = ev.filter((e, i) => e.fixed !== sents[i].text).length;
  const legend: [string, number][] = [["Correct", okN] as [string, number]].concat((["Grammar", "Spelling", "Punct.", "Clarity", "Structure"] as Cat[]).filter((c) => cats[c]).map((c) => [c, cats[c]!]));
  const filters: [string, number][] = [["All", errs] as [string, number]].concat((Object.keys(WCAT) as Cat[]).filter((c) => cats[c]).map((c) => [c, cats[c]!]));
  const doApply = (next: string | null, extra = {}) => { if (next != null) set({ wsText: next, wsSel: null, ...extra }); };

  return (
    <div className="flex h-dvh flex-col bg-[#0D0F0E] animate-[lgfade_.2s]">
      <SessionTopBar
        exitLabel={done ? "Back" : "Exit"} topic={q.topic} level={q.level} kind={titleCase(q.type)} done={done} meta={done ? null : [mins + " min", "About " + mins + " min"]} onExit={exit}
        onAgain={() => set({ wsText: "", wsDone: false, wsChecking: false, wsRes: null, wsErr: "", wsSel: null, wsCat: "All", wsStart: null, wsView: "orig" })}
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto dk:flex-row dk:overflow-hidden">
        {/* Left: prompt + plan, or your text after checking */}
        <div className={cn("flex-none min-w-0 min-h-0 overflow-visible dk:overflow-y-auto border-b border-[#2A2F2D] dk:border-b-0 dk:border-r flex flex-col bg-[#0D0F0E]", done ? "dk:flex-[1.1]" : "dk:flex-[0_0_40%]")}>
          {!done ? (
            <div className="w-full max-w-[560px] mx-auto p-[24px_20px_28px] dk:p-[40px_40px_48px] flex flex-col gap-7">
              <div className="flex flex-col gap-[14px]">
                <span className="text-[11.5px] font-bold tracking-[.06em] text-[#52C79A]">WRITING PROMPT</span>
                <p className="m-0 font-medium text-[19px] dk:text-[22px] leading-[1.5] tracking-[-.01em] text-pretty whitespace-pre-line">{q.prompt}</p>
              </div>
              <div className={cn(card, "p-[18px] flex flex-col gap-1")}>
                <div className="flex justify-between items-baseline mb-2"><span className={caps6}>YOUR PLAN</span><span className="tabular-nums text-[12px]" style={{ color: pn === 3 ? "#52C79A" : "#A3ABA7" }}>{pn + " of 3"}</span></div>
                {plan.map(([text, ok, hint], i) => (
                  <div key={text} className="flex items-start gap-3 px-3 py-2.5 -mx-2 rounded-[16px] transition-[background] duration-[.25s]" style={{ background: ok ? "rgba(82,199,154,.08)" : "transparent" }}>
                    <span className="size-6 rounded-full border-[1.5px] tabular-nums text-[11.5px] flex items-center justify-center flex-none transition-all duration-[.25s]" style={{ borderColor: ok ? "#52C79A" : "#2A2F2D", background: ok ? "#52C79A" : "transparent", color: ok ? "#ffffff" : "#A3ABA7" }}>{ok ? <Check size={11.5} /> : i + 1}</span>
                    <div className="flex-1 flex flex-col gap-[2px]"><span className="text-[14.5px] font-medium" style={{ color: ok ? "#F3F6F4" : "#F3F6F4" }}>{text}</span><span className="text-[12.5px] text-[#A3ABA7]">{hint}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-[2] flex-none bg-[#171A19] border-b border-[#2A2F2D] py-4 px-5 dk:px-7 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex bg-[#171A19] border border-[#2A2F2D] rounded-full p-1">
                    {([["orig", "Your text", FileText], ["imp", "Improved", Sparkles]] as const).map(([k, label, Icon]) => {
                      const on = view === k;
                      return (
                        <button key={k} onClick={() => set({ wsView: k, wsSel: null })} className="h-[30px] px-3 border-0 rounded-full text-[13px] font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-all duration-150" style={{ background: on ? "#2A2F2D" : "transparent", color: on ? "#F3F6F4" : "#A3ABA7" }}>
                          <Icon size={13} />{label}
                        </button>
                      );
                    })}
                  </div>
                  <span className="tabular-nums text-[12px] text-[#F3F6F4] bg-[#212524] border border-[#2A2F2D] rounded-full px-2.5 py-[3px] whitespace-nowrap flex-none">{words} words</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {legend.map(([name, n]) => (
                    <span key={name} className="h-7 px-2.5 rounded-full bg-[#171A19] border border-[#2A2F2D] text-[12.5px] text-[#F3F6F4] flex items-center gap-[7px] whitespace-nowrap">
                      <span className="w-2 h-[3px] rounded-[2px]" style={{ background: WCAT[name as Cat | "Correct"] }} />{name === "Correct" ? "Correct sentences" : name}<span className="tabular-nums text-[#A3ABA7]">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-full max-w-[680px] mx-auto pt-7 pb-12 px-5 dk:px-7 flex flex-col gap-[18px]">
                {view === "orig" ? (
                  <>
                    {paras.map((list, pi) => (
                      <p key={pi} className="m-0 text-[17px] leading-[2] text-[#F3F6F4] text-pretty">
                        {list.map((s) => {
                          const marks = all.filter((x) => x.si === s.idx && x.loc >= 0).sort((p, q) => p.loc - q.loc);
                          const clar = all.find((x) => x.si === s.idx && x.type === "Clarity");
                          const segs: React.ReactNode[] = [];
                          let p = 0;
                          marks.forEach((x) => {
                            if (x.loc < p) return;
                            if (x.loc > p) segs.push(<span key={"t" + p}>{s.text.slice(p, x.loc)}</span>);
                            const c = WCAT[x.type], on = hl(x.id);
                            segs.push(
                              <span key={x.id} onClick={() => set({ wsSel: x.id, wsCat: "All" })} className="cursor-pointer text-[#F3F6F4] rounded-[3px] px-[2px] py-[1px] transition-[background] duration-150 bg-[var(--b)] hover:bg-[var(--h)]" style={{ "--b": on ? c + "55" : c + "24", "--h": c + "40", boxShadow: `inset 0 -2px 0 ${c}` } as React.CSSProperties}>
                                {s.text.slice(x.loc, x.loc + x.find.length)}
                              </span>,
                            );
                            p = x.loc + x.find.length;
                          });
                          if (p < s.text.length) segs.push(<span key={"t" + p}>{s.text.slice(p)}</span>);
                          return (
                            <span key={s.idx} className="rounded-[4px] transition-[background] duration-150" style={{ borderBottom: clar ? "2px dashed " + WCAT.Clarity : "0", background: clar && hl(clar.id) ? "rgba(82,199,154,.14)" : "transparent" }}>
                              {s.lead}{segs}{s.trail}
                            </span>
                          );
                        })}
                      </p>
                    ))}
                    <span className="text-[13px] text-[#A3ABA7] flex items-center gap-2 mt-1.5"><MousePointerClick size={13} />Tap a highlight to see the correction</span>
                  </>
                ) : (
                  <>
                    {paras.map((list, pi) => (
                      <p key={pi} className="m-0 text-[17px] leading-[2] text-[#F3F6F4] text-pretty">
                        {list.map((s) => {
                          const fx = ev[s.idx].fixed, ch = fx !== s.text;
                          return (
                            <span key={s.idx}>
                              <span>{s.lead}</span>
                              <span className="rounded-[3px] py-[1px]" style={{ background: ch ? "rgba(82,199,154,.16)" : "transparent", boxShadow: ch ? "inset 0 -2px 0 #52C79A" : "none" }}>{fx}</span>
                              <span>{s.trail}</span>
                            </span>
                          );
                        })}
                      </p>
                    ))}
                    <span className="text-[13px] text-[#A3ABA7] flex items-center gap-2 mt-1.5">
                      <Sparkles size={13} className="text-[#52C79A]" />{errs ? improved + " sentences improved. Use Apply all to keep these changes." : "Nothing to improve."}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: editor, checking, or results */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#171A19]">
          {editing ? (
            <div className="flex-1 min-h-0 flex flex-col gap-[14px] w-full max-w-[820px] mx-auto p-[16px_16px_0] dk:p-[28px_32px_20px]">
              <div className={cn(card, "flex-1 min-h-0 flex flex-col overflow-hidden")}>
                <div className="flex-none flex items-center gap-3 py-3 pr-[14px] pl-5 border-b border-[#2A2F2D] min-h-14">
                  <span className="text-[14px] font-bold flex-none">Your response</span>
                  <span className="tabular-nums text-[12px] text-[#A3ABA7] flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                    {sents.length + (sents.length === 1 ? " sentence" : " sentences") + " · " + paras.length + (paras.length === 1 ? " paragraph" : " paragraphs")}
                  </span>
                  {!wt.trim() ? (S.wsDemo &&
                    <button onClick={() => set({ wsText: WS0 })} className={cn(smallBtn, "text-[#F3F6F4]", "border-[1.5px] border-[#2A2F2D] bg-[#171A19] shadow-[inset_-4px_-5px_0_#080A09] active:scale-[.96] active:shadow-[inset_-2px_-3px_0_#080A09] transition-transform duration-100")}><FileText size={12.5} className="text-[#52C79A]" />Try a sample</button>
                  ) : (
                    <button onClick={() => set({ wsText: "" })} className={cn(smallBtn, "border border-transparent bg-transparent text-[#A3ABA7] hover:bg-[#212524]")}><Eraser size={12.5} />Clear</button>
                  )}
                </div>
                <textarea
                  value={wt} onChange={(e) => set({ wsText: e.target.value, wsStart: null })} placeholder="Begin writing your response here…"
                  className="flex-1 min-h-[300px] dk:min-h-0 resize-none border-0 bg-transparent text-[#F3F6F4] px-7 py-6 font-sans text-[17px] leading-[1.9] outline-none"
                />
                <div className="flex-none pt-[14px] px-5 pb-4 border-t border-[#2A2F2D] bg-[#171A19] flex flex-col gap-[9px]">
                  <div className="flex justify-between items-baseline gap-3 text-[13px]">
                    <span className="text-[#A3ABA7]"><span className="tabular-nums text-[#F3F6F4]">{words}</span> / {min} words</span>
                    <span className="flex items-center gap-1.5" style={{ color: off ? "#A3ABA7" : "#52C79A" }}>{off ? <Target size={13} /> : <CircleCheck size={13} />}{off ? min - words + " words to go" : "Ready to check"}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map((k) => (
                      <div key={k} className="h-[5px] rounded-full bg-[#2A2F2D] overflow-hidden">
                        <div className="h-full rounded-full transition-[width] duration-200" style={{ width: Math.max(0, Math.min(100, ((words - (k * min) / 4) / (min / 4)) * 100)) + "%", background: off ? "#A3ABA7" : "#52C79A" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-none flex items-center gap-[14px] pb-6 dk:pb-0">
                {S.wsErr ? (
                  <span className="flex-1 min-w-0 text-[13px] text-[#F26B6B] flex items-center gap-[7px]"><CircleAlert size={13} />{S.wsErr}</span>
                ) : (
                  <span className="flex-1 min-w-0 text-[13px] text-[#A3ABA7] flex items-center gap-[7px]"><CloudCheck size={13} />Saved as you type</span>
                )}
                <button onClick={() => !off && checkWriting()} disabled={off} className={cn(btnPrimary, "h-12 px-[22px] text-[15px] flex-none")} style={{ cursor: off ? "not-allowed" : "pointer", opacity: off ? 0.45 : 1 }}>
                  <ClipboardCheck size={15} />Check writing
                </button>
              </div>
            </div>
          ) : null}

          {checking ? (
            <div className="flex-1 min-h-0 flex items-center justify-center p-[16px_16px_0] dk:p-[28px_32px_20px]">
              <div className={cn(card, "w-full max-w-[460px] p-7 flex flex-col gap-[22px] animate-[lgup_.25s_ease-out]")}>
                <div className="flex items-center gap-[14px]">
                  <span className={spinner} />
                  <div className="flex flex-col gap-[2px]"><span className="text-[17px] font-bold">Reading your essay</span><span className="tabular-nums text-[12.5px] text-[#A3ABA7]">{words} words · {sents.length} sentences</span></div>
                </div>
                <CheckingSteps bar="1.6s" steps={STEPS.map(([t, d]) => {
                  const c = WCAT[(t === "Punctuation" ? "Punct." : t) as Cat];
                  return (
                    <div key={t} className="flex items-center gap-3 text-[14.5px]" style={{ animation: `lgup .35s ${d}s both` }}>
                      <span className="size-2 rounded-full flex-none mx-[7px]" style={{ background: c, boxShadow: `0 0 0 4px ${c}22` }} />
                      <span className="flex-1">{t}</span><Check size={14.5} className="text-[#52C79A]" />
                    </div>
                  );
                })} />
              </div>
            </div>
          ) : null}

          {done ? (
            <div className="flex-1 min-h-0 overflow-visible dk:overflow-y-auto">
              <div className="w-full max-w-[680px] mx-auto p-[24px_20px_28px] dk:p-[40px_40px_48px] flex flex-col gap-4">
                <div className="border border-[#2A2F2D] rounded-[24px] p-[22px] flex flex-col gap-[18px] animate-[lgup_.3s_ease-out]" style={{ background: "#171A19" }}>
                  <div className="flex items-center gap-5">
                    <div className="relative size-24 flex-none">
                      <svg width="96" height="96" viewBox="0 0 124 124" className="-rotate-90">
                        <circle cx="62" cy="62" r="54" fill="none" stroke="#2A2F2D" strokeWidth="11" />
                        <circle cx="62" cy="62" r="54" fill="none" stroke={col} strokeWidth="11" strokeLinecap="round" strokeDasharray="339" strokeDashoffset={Math.round(339 * (1 - score / 10))} style={{ transition: "stroke-dashoffset .8s,stroke .3s" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-bold text-[28px] tracking-[-.01em] leading-none tabular-nums" style={{ color: col }}>{score.toFixed(1)}</span>
                        <span className="tabular-nums text-[11px] text-[#A3ABA7] mt-[3px]">/10</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className={caps6}>WRITING SCORE</span>
                      <span className="font-bold text-[26px] tracking-[-.01em]" style={{ color: col }}>{verdictOf(score)}</span>
                      <span className="text-[13px] text-[#A3ABA7]">{delta}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-2">
                    {([[sents.length, "SENTENCES", "#F3F6F4"], [errs, "ERRORS", errs ? "#EDBF73" : "#F3F6F4"], [okN, "CORRECT", "#52C79A"], [Math.round((okN / tot) * 100) + "%", "ACCURACY", "#F3F6F4"]] as const).map(([v, l, c]) => (
                      <div key={l} className="min-w-0 bg-[rgba(13,15,14,.5)] border border-[#2A2F2D] rounded-[16px] px-3 py-2.5 flex flex-col gap-[2px]">
                        <span className="font-bold text-[20px] tabular-nums" style={{ color: c }}>{v}</span>
                        <span className="text-[10.5px] font-bold tracking-[.05em] text-[#A3ABA7] whitespace-nowrap overflow-hidden text-ellipsis">{l}</span>
                      </div>
                    ))}
                  </div>
                  {top ? (
                    <div className="flex items-center gap-2.5 px-[14px] py-[11px] rounded-[16px] bg-[rgba(237,191,115,.07)] border border-[rgba(237,191,115,.22)] text-[14px] text-[#EDBF73]">
                      <CircleAlert size={16} className="text-[#EDBF73] flex-none" /><span>Most common error: <b className="font-bold text-[#F3F6F4]">{top[0]}</b></span>
                    </div>
                  ) : null}
                </div>

                <div className={cn(card, "px-5 py-[18px] flex flex-col gap-4")}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={caps6}>BY CRITERIA</span>
                    <span className="text-[12.5px] text-[#A3ABA7] flex items-center gap-1.5">Estimated level<span className="text-[11.5px] font-bold text-[#52C79A] bg-[#212524] border border-[#2A2F2D] rounded-full px-[9px] py-[2px]">{levelName(levelOf(score))}</span></span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-6 gap-y-[14px]">
                    {crit.map(([name, x, note]) => {
                      const c = x >= 8 ? "#52C79A" : x >= 5 ? "#EDBF73" : "#EDBF73";
                      return (
                        <div key={name} className="flex flex-col gap-[7px]">
                          <div className="flex justify-between items-baseline text-[13.5px]"><span className="font-medium">{name}</span><span className="tabular-nums text-[12.5px]" style={{ color: c }}>{x.toFixed(1)}</span></div>
                          <div className="h-[5px] bg-[#2A2F2D] rounded-full overflow-hidden"><div className="h-full rounded-full transition-[width] duration-[.6s]" style={{ width: x * 10 + "%", background: c }} /></div>
                          <span className="text-[12px] text-[#A3ABA7]">{note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={cn(card, "px-5 py-[18px] flex flex-col gap-2")}>
                  <span className={caps6}>FEEDBACK</span>
                  <span className="text-[15px] leading-[1.65] text-[#F3F6F4] text-pretty">{fb}</span>
                </div>

                <div className="flex flex-col gap-3 mt-1.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className={caps6}>CORRECTIONS · {errs + (errs === 1 ? " ISSUE" : " ISSUES")}</span>
                    {errs ? <button onClick={() => doApply(applyAll(wt, a), { wsCat: "All" })} className={greenBtn}><WandSparkles size={12.5} />Apply all</button> : null}
                  </div>
                  {errs ? (
                    <div className="flex gap-1.5 overflow-x-auto">
                      {filters.map(([name, n]) => {
                        const on = cat === name;
                        return (
                          <button key={name} onClick={() => set({ wsCat: name })} className="whitespace-nowrap flex-none h-8 px-3 border rounded-full text-[13px] font-medium cursor-pointer flex items-center gap-[7px]" style={{ borderColor: on ? "#2A2F2D" : "#2A2F2D", background: on ? "#2A2F2D" : "transparent", color: on ? "#F3F6F4" : "#F3F6F4" }}>
                            <span className="size-[7px] rounded-full" style={{ background: name === "All" ? "#F3F6F4" : WCAT[name as Cat] }} />{name}<span className="tabular-nums text-[11.5px] text-[#A3ABA7]">{n}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {shown.map((x) => {
                    const c = WCAT[x.type], on = hl(x.id);
                    return (
                      <div key={x.id} onClick={() => set({ wsSel: on ? null : x.id })} className="border border-[var(--bd)] hover:border-[var(--hbd)] rounded-[16px] p-4 flex flex-col gap-2.5 cursor-pointer transition-all duration-150" style={{ background: on ? "#171A19" : "#171A19", "--bd": on ? c + "99" : "#2A2F2D", "--hbd": c + "66" } as React.CSSProperties}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10.5px] font-bold tracking-[.06em] rounded-[6px] px-2 py-[3px]" style={{ color: c, background: c + "1f" }}>{x.type.toUpperCase()}</span>
                          <span className="text-[12.5px] text-[#A3ABA7] flex-1 min-w-0">{x.sub}</span>
                          <button onClick={(e) => { e.stopPropagation(); doApply(applyOne(wt, a, x)); }} className={greenBtn}><Check size={12.5} />Apply</button>
                        </div>
                        <span className="text-[15px] leading-[1.5]">
                          <span className="line-through text-[#A3ABA7]" style={{ textDecorationColor: c }}>{x.find}</span>
                          <ArrowRight size={13} className="inline text-[#A3ABA7] mx-2 align-[-1px]" />
                          <b className="text-[#52C79A] font-bold">{x.repl}</b>
                        </span>
                        <span className="text-[13.5px] leading-[1.55] text-[#A3ABA7] animate-[lgfade_.2s]">{x.why}</span>
                      </div>
                    );
                  })}
                  {!errs ? (
                    <div className={cn(card, "p-4 flex items-center gap-3")}>
                      <span className="size-9 rounded-full bg-[#52C79A] text-[#052013] flex items-center justify-center flex-none"><Check size={17} /></span>
                      <div className="flex flex-col gap-[2px]"><span className="text-[15px] font-bold">Every sentence is correct</span><span className="text-[13px] text-[#A3ABA7]">Nice work. Try a new prompt next.</span></div>
                    </div>
                  ) : null}
                </div>
                <button onClick={() => set({ wsDone: false, wsSel: null, wsView: "orig" })} className="h-12 px-[22px] rounded-full text-[#F3F6F4] text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 mt-1.5 border-[1.5px] border-[#2A2F2D] bg-[#171A19] shadow-[inset_-4px_-5px_0_#080A09] active:scale-[.96] active:shadow-[inset_-2px_-3px_0_#080A09] transition-transform duration-100">
                  <Pencil size={15} />Edit my response
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

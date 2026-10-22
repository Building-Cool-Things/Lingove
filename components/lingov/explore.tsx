"use client";

import { ArrowRight, Bookmark, Search } from "lucide-react";

import { CH, EX_CHIPS, PERSONA_TOPICS, SC, norm } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { pageCol } from "./app-shell";
import { useLingov } from "./store";
import { btnPress, btnPrimary, card, h2, input, levelPill, tile } from "./ui";

export function Explore() {
  const { S, set, goChat } = useLingov();
  const q = norm(S.exq);
  const list = SC.map((s, i) => ({ s, i })).filter(({ s }) => (S.exi === "All" || s.k === S.exi) && (!q || norm(s.title + " " + s.goal).includes(q)));
  const showFeat = S.exi === "All" && !q;
  const sc = S.scen != null ? SC[S.scen] : null;
  const feat = SC[0];

  return (
    <>
      <div className={cn(pageCol, "flex flex-col content-start gap-5")}>
        <div className="flex flex-none flex-col gap-3">
          <span className="text-[30px] font-semibold leading-[1.1] tracking-[-.035em]">Explore</span>
          <div className="relative">
            <Search size={14.5} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3c0]" />
            <input value={S.exq} onChange={(e) => set({ exq: e.target.value })} placeholder="Search scenarios" className={cn("h-11 w-full pl-[38px] pr-3 text-[14.5px]", input)} />
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-[2px]">
            {EX_CHIPS.map(([k, label]) => {
              const on = S.exi === k;
              return (
                <button key={k} onClick={() => set({ exi: k })} className={cn("flex h-9 flex-none cursor-pointer items-center gap-[6px] rounded-full border-[1.5px] px-[14px] text-[13.5px] font-medium", on ? "border-[#1d8a50] bg-[#1d8a50] text-white" : "border-[#252f4a] bg-[#090d15] text-[#eaeef7]")}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {showFeat && (
          <div className="flex flex-none flex-col gap-[10px]">
            <div className="flex items-baseline justify-between"><span className={h2}>Talk to a persona</span><span className="text-[12px] text-[#94a3c0]">Fictional characters</span></div>
            <div className="-mx-5 flex gap-[10px] overflow-x-auto px-5 pb-1 dk:mx-0 dk:px-0">
              {CH.map((h, i) => ({ h, i })).filter(({ h }) => h.persona).map(({ h, i }) => (
                <div key={i} onClick={() => goChat(i, true)} className={cn(card, "flex w-[168px] flex-none cursor-pointer flex-col gap-2 p-[14px] transition-[border-color] duration-150 hover:border-[#1d8a50] active:scale-[.98]")}>
                  <span className={cn(tile, "size-[52px] rounded-full text-[21px] text-[#c5cee0]")}><h.icon size={21} /></span>
                  <div className="flex flex-col gap-px"><span className="text-[15px] font-semibold">{h.title}</span><span className="text-[12.5px] text-[#94a3c0]">{h.name.split(" · ")[1]}</span></div>
                  <span className="self-start rounded-full bg-[#0e2417] px-[9px] py-[3px] text-[12px] font-semibold text-[#7fe3a8]">{PERSONA_TOPICS[i - 3]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showFeat && (
          <div onClick={() => set({ scen: 0 })} className="flex flex-none cursor-pointer items-center gap-4 rounded-[22px] bg-[linear-gradient(135deg,#ffc6a8,#f6a07a)] p-[18px] text-[#2a1206] shadow-[inset_0_1px_0_rgba(255,255,255,.35)] active:scale-[.99]">
            <div className="flex flex-1 flex-col gap-[6px]">
              <span className="text-[11.5px] font-semibold tracking-[.04em]">FEATURED</span>
              <span className="text-[22px] font-semibold leading-[1.15] tracking-[-.02em]">{feat.title}</span>
              <span className="text-[13px] font-semibold">{feat.goal}</span>
              <span className="text-[12.5px] font-semibold">{feat.level} · {feat.mins} min · +{feat.xp} XP</span>
            </div>
            <span className="flex size-16 flex-none items-center justify-center rounded-[16px] bg-[#2a1206] text-[28px] text-[#ffb38f]"><feat.icon size={28} /></span>
          </div>
        )}

        <div className="grid flex-none grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {list.map(({ s, i }) => (
            <div key={i} onClick={() => set({ scen: i })} className={cn(card, "flex cursor-pointer flex-col gap-[10px] p-[14px] transition-[border-color] duration-150 hover:border-[#1d8a50]")}>
              <div className="flex items-center justify-between">
                <span className={cn(tile, "size-11 rounded-[12px] text-[19px] text-[#c5cee0]")}><s.icon size={19} /></span>
                <button
                  onClick={(e) => { e.stopPropagation(); set((st) => ({ saved: st.saved.includes(i) ? st.saved.filter((x) => x !== i) : [...st.saved, i] })); }}
                  aria-label="Save"
                  className={cn("flex size-9 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-[17px] hover:bg-[#0f1522]", S.saved.includes(i) ? "text-[#1d8a50]" : "text-[#94a3c0]")}
                >
                  <Bookmark size={17} />
                </button>
              </div>
              <span className="text-[15px] font-semibold leading-[1.25]">{s.title}</span>
              <span className="text-[13px] leading-[1.4] text-[#94a3c0]">{s.goal}</span>
              <div className="mt-auto flex items-center gap-2"><span className={levelPill}>{s.level}</span><span className="text-[12px] text-[#94a3c0]">{s.mins} min · {s.xp} XP</span></div>
            </div>
          ))}
        </div>
        {!list.length && <span className="text-[14px] text-[#94a3c0]">No scenarios match. Try another topic.</span>}
      </div>

      {sc && (
        <>
          <div onClick={() => set({ scen: null })} className="fixed inset-0 z-[5] animate-[lgfade_.15s] bg-[rgba(4,7,14,.6)]" />
          <div className="fixed inset-x-0 bottom-0 z-[6] mx-auto flex max-h-[92%] w-full max-w-[480px] animate-[lgup_.22s_ease-out] flex-col gap-4 overflow-y-auto rounded-t-[28px] border border-[#182033] bg-[#0a0e16] px-5 pb-7 pt-[10px] shadow-[0_-24px_48px_-12px_rgba(0,0,0,.6)]">
            <span className="h-1 w-10 flex-none self-center rounded-full bg-[#252f4a]" />
            <div className="flex flex-none items-center gap-[14px]">
              <span className={cn(tile, "size-[60px] flex-none rounded-[16px] text-[24px] text-[#c5cee0]")}><sc.icon size={24} /></span>
              <div className="flex flex-col gap-1">
                <span className="text-[20px] font-semibold leading-[1.2] tracking-[-.02em]">{sc.title}</span>
                <span className="text-[12.5px] text-[#94a3c0]">{sc.level} · {sc.mins} min · +{sc.xp} XP</span>
              </div>
            </div>
            <span className="flex-none text-[14.5px] leading-[1.5] text-[#c5cee0]">{sc.desc}</span>
            <div className="flex flex-none flex-col gap-2">
              <span className="text-[11.5px] font-semibold tracking-[.04em] text-[#94a3c0]">GOALS</span>
              {sc.goals.map((g) => <div key={g} className="flex items-center gap-[10px] text-[14px] font-semibold"><span className="size-5 flex-none rounded-full border-[1.5px] border-[#4f6085]" />{g}</div>)}
            </div>
            <div className="flex flex-none flex-col gap-2">
              <span className="text-[11.5px] font-semibold tracking-[.04em] text-[#94a3c0]">KEY WORDS</span>
              <div className="flex flex-wrap gap-[6px]">{sc.vocab.map((v) => <span key={v} className="rounded-[8px] bg-[#0f1522] px-[10px] py-1 text-[13px] font-medium">{v}</span>)}</div>
            </div>
            {/* Prototype: every scenario starts the chat-0 mission (see REPLACE.md). */}
            <button onClick={() => { set({ scen: null }); goChat(0); }} className={cn("h-12 flex-none rounded-[12px] text-[15px]", btnPrimary, btnPress)}>Start mission<ArrowRight size={15} /></button>
          </div>
        </>
      )}
    </>
  );
}

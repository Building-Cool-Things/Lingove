"use client";

// Chats list + conversation + context panel, ported 1:1 from the prototype (`chatVals`).
import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, CheckCheck, EllipsisVertical, Languages, Lightbulb, Mic, Pause, Pencil, Play,
  Plus, Search, SendHorizontal, Target, Trash2,
} from "lucide-react";

import { CH, CHAT_SCENARIO, CTX_GOALS_DEFAULT, CTX_VOCAB_DEFAULT, HINTS, SC, norm } from "@/lib/lingov/data";
import { useLingov } from "./store";
import { btnShadow, caps, tile } from "./ui";

const FILTERS = ["All", "In progress", "Completed"];
const fmt = (n: number) => Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");

// Stable pseudo-random waveform per message id (prototype `bars`).
function bars(id: string, n: number) {
  let h = 7;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return Array.from({ length: n }, () => { h = (h * 1103 + 12345) % 9973; return 6 + (h % 20); });
}

const LIVE_BARS = Array.from({ length: 22 }, (_, k) => ({ d: (0.6 + ((k * 37) % 7) / 10).toFixed(2), dl: (((k * 13) % 10) / -10).toFixed(1) }));
const roundBtn = "size-11 border-0 rounded-full cursor-pointer flex-none flex items-center justify-center";

export function Chats() {
  const { S, set, push, startRec, cancelRec, sendVoice, togglePlay, openChat, closeChat } = useLingov();
  const router = useRouter();
  const open = S.chat != null, ci = S.chat ?? 0, c = CH[ci], cv = S.convs;
  const q = norm(S.cq);
  const hasDraft = !!S.draft.trim();

  const scRef = useRef<HTMLDivElement>(null);
  const lastH = useRef(0);
  useLayoutEffect(() => {
    const el = scRef.current;
    if (el && el.scrollHeight !== lastH.current) { lastH.current = el.scrollHeight; el.scrollTop = el.scrollHeight; }
  });

  const rows = CH.map((h, i) => ({ h, i })).filter(({ h, i }) => (i < 3 || S.started.includes(i)) && (S.cf === "All" || (S.cf === "In progress") === (h.done < h.total)) && (!q || norm(h.title).includes(q)));
  const scen = ci in CHAT_SCENARIO ? SC[CHAT_SCENARIO[ci]] : null;
  const ctxGoals = (scen ? scen.goals : CTX_GOALS_DEFAULT).slice(0, c.total);
  const tipN = cv[ci].filter((m) => m.tip).length;
  const Icon = c.icon;

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      {/* LIST */}
      <div className={`${open ? "hidden dk:flex" : "flex"} min-h-0 min-w-0 flex-1 flex-col dk:flex-[0_0_340px] dk:border-r dk:border-[#141b2b]`}>
        <div className="flex flex-none flex-col gap-3 px-5 pb-2 pt-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-[24px] font-semibold tracking-[-.02em]">Chats</span>
            <button onClick={() => router.push("/dashboard/explore")} aria-label="New mission" className={`flex size-10 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-[#1d8a50] text-[18px] text-white hover:bg-[#187544] ${btnShadow}`}><Plus size={18} /></button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3c0]" />
            <input value={S.cq} onChange={(e) => set({ cq: e.target.value })} placeholder="Search chats" className="h-[42px] w-full rounded-full border border-[#182033] bg-[#0b1019] pl-[38px] pr-[14px] text-[14.5px] text-[#eaeef7] outline-none focus:shadow-[0_0_0_2px_#1d8a50]" />
          </div>
          <div className="flex gap-2">
            {FILTERS.map((l) => (
              <button key={l} onClick={() => set({ cf: l })} className="h-8 cursor-pointer rounded-full border-0 px-[13px] text-[13px] font-medium" style={{ background: S.cf === l ? "#0e2417" : "#090d15", color: S.cf === l ? "#7fe3a8" : "#94a3c0" }}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {rows.map(({ h, i }) => {
            const msgs = cv[i], last = msgs[msgs.length - 1], dn = h.done >= h.total, RI = h.icon;
            return (
              <div key={i} onClick={() => openChat(i)} className={`flex flex-none cursor-pointer items-center gap-3 px-5 py-[10px] transition-[background] duration-[.12s] hover:bg-[#090d15] ${ci === i ? "dk:bg-[#090d15]" : ""}`}>
                <div className={`size-[52px] flex-none rounded-full text-[21px] text-[#c5cee0] ${tile}`}><RI size={21} /></div>
                <div className="-mb-[10px] flex min-w-0 flex-1 flex-col gap-[3px] border-b border-[#0d1320] pb-[10px] pt-[2px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15.5px] font-semibold">{h.title}</span>
                    <span className="flex-none text-[12px]" style={{ color: i === 0 && !dn ? "#7fe3a8" : "#94a3c0" }}>{h.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 truncate text-[13.5px] text-[#94a3c0]">
                      {!last.ai && <CheckCheck size={14} className="flex-none text-[#7fe3a8]" />}{last.text}
                    </span>
                    <span className="flex-none rounded-full px-2 py-[2px] text-[11px] font-semibold tabular-nums" style={{ color: dn ? "#7fe3a8" : "#ffb38f", background: dn ? "#0e2417" : "rgba(255,179,143,.14)" }}>{dn ? "Done" : h.done + "/" + h.total}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {!rows.length && <span className="px-5 py-6 text-[14px] text-[#94a3c0]">No chats found.</span>}
        </div>
      </div>

      {/* CONVERSATION */}
      <div className={`${open ? "flex" : "hidden dk:flex"} relative min-h-0 min-w-0 flex-1 flex-col`} style={{ backgroundColor: "#040608", backgroundImage: "radial-gradient(#0a0f1a 1px,transparent 1px)", backgroundSize: "16px 16px" }}>
        <div className="flex flex-none flex-col gap-2 border-b border-[#121a29] bg-[rgba(5,8,12,.9)] px-[14px] pt-2 backdrop-blur-[14px]">
          <div className="flex items-center gap-[10px]">
            <button onClick={closeChat} aria-label="Back" className="-ml-[6px] flex size-10 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-[20px] text-[#eaeef7] hover:bg-[#090d15] dk:hidden"><ArrowLeft size={20} /></button>
            <div className={`size-[42px] flex-none rounded-full text-[18px] text-[#c5cee0] ${tile}`}><Icon size={18} /></div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15.5px] font-semibold">{c.name}</span>
              <span className="min-h-[17px] text-[12.5px] text-[#7fe3a8]">{S.typing ? "typing…" : "in character"}</span>
            </div>
            {/* dummy: see REPLACE.md */}
            <button aria-label="More" className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-[18px] text-[#eaeef7] hover:bg-[#090d15]"><EllipsisVertical size={18} /></button>
          </div>
          <div className="flex items-center gap-[10px] pb-[10px]">
            <Target size={15} className="flex-none text-[#ffb38f]" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{c.goal}</span>
            <div className="flex w-24 flex-none gap-[3px]">
              {Array.from({ length: c.total }, (_, k) => <span key={k} className="h-[5px] flex-1 rounded-full" style={{ background: k < c.done ? "#7fe3a8" : "#141b2b" }} />)}
            </div>
            <span className="text-[11.5px] font-semibold tabular-nums text-[#94a3c0]">{c.done + "/" + c.total}</span>
          </div>
        </div>

        <div ref={scRef} className="flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto overflow-x-hidden px-[14px] pb-2 pt-[14px]">
          <span className="mb-[6px] self-center rounded-full border border-[#182033] bg-[rgba(13,19,32,.85)] px-3 py-1 text-[12px] font-medium text-[#94a3c0]">Today</span>
          {cv[ci].map((m) => {
            const me = !m.ai, trOn = S.tr.includes(m.id), playing = S.play?.id === m.id;
            return (
              <div key={m.id} className="flex animate-[lgup_.2s_ease-out] flex-col gap-1" style={{ alignItems: me ? "flex-end" : "flex-start" }}>
                <div className="max-w-[min(78%,460px)] px-[13px] pb-[6px] pt-[9px] text-[15.5px] leading-[1.4] shadow-[0_1px_1px_rgba(0,0,0,.25)] [text-wrap:pretty]" style={{ background: me ? "linear-gradient(180deg,#22975a,#1a7f49)" : "#0f1624", color: me ? "#ffffff" : "#eaeef7", borderRadius: me ? "16px 4px 16px 16px" : "4px 16px 16px 16px" }}>
                  {m.voice ? (
                    <>
                      <div className="flex min-w-[210px] items-center gap-[10px] pb-[6px] pt-[2px]">
                        <button onClick={() => togglePlay(m.id)} aria-label="Play voice message" className="flex size-9 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[15px] text-[#14653a]">{playing ? <Pause size={15} /> : <Play size={15} />}</button>
                        <div className="flex h-7 flex-1 items-center gap-[2px]">
                          {bars(m.id, 26).map((h, k, a) => <span key={k} className="min-w-[2px] flex-1 rounded-[2px]" style={{ height: h, background: playing && k / a.length <= S.play!.p / m.voice! ? "#ffffff" : "rgba(255,255,255,.4)" }} />)}
                        </div>
                        <span className="text-[12px] font-medium tabular-nums text-[#c9ecd9]">{fmt(m.voice)}</span>
                      </div>
                      <div className="border-t border-[rgba(255,255,255,.14)] pt-[6px] text-[13.5px] text-[#d3f5e1]">{m.text}</div>
                    </>
                  ) : <span>{m.text}</span>}
                  {trOn && <div className="mt-[6px] border-t border-[rgba(255,255,255,.14)] pt-[6px] text-[14px] text-[#94a3c0]">{m.hi}</div>}
                  <div className="mt-[2px] flex items-center justify-end gap-[6px] text-[10.5px]" style={{ color: me ? "#c9ecd9" : "#94a3c0" }}>
                    {m.ai && (
                      <button onClick={() => set((s) => ({ tr: s.tr.includes(m.id) ? s.tr.filter((x) => x !== m.id) : [...s.tr, m.id] }))} aria-label="Translate" className="mr-auto flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[11.5px] font-medium text-[#7fe3a8]">
                        <Languages size={11.5} />{trOn ? "Hide" : "Translate"}
                      </button>
                    )}
                    {m.time}
                    {me && <CheckCheck size={13} />}
                  </div>
                </div>
                {m.tip && (
                  <button onClick={() => set({ sheet: { ...m.tip! } })} className="flex h-[30px] cursor-pointer items-center gap-[6px] rounded-full border-0 bg-[rgba(255,179,143,.16)] px-[11px] text-[12.5px] font-semibold text-[#ffb38f] hover:bg-[rgba(255,179,143,.26)]"><Pencil size={13} />1 tip</button>
                )}
              </div>
            );
          })}
          {S.typing && (
            <div className="flex gap-1 self-start rounded-[4px_16px_16px_16px] border border-[#182033] bg-[#0f1624] px-[14px] py-3">
              {[0, 0.15, 0.3].map((d) => <span key={d} className="size-[7px] rounded-full bg-[#94a3c0]" style={{ animation: `lgdot 1s ${d}s infinite` }} />)}
            </div>
          )}
        </div>

        {S.hintOpen && (
          <div className="flex flex-none animate-[lgup_.2s_ease-out] gap-2 overflow-x-auto px-[14px] pb-2 pt-1">
            {HINTS.map((text) => (
              <button key={text} onClick={() => set({ draft: text, hintOpen: false })} className="h-9 flex-none cursor-pointer whitespace-nowrap rounded-full border border-[#252f4a] bg-[#090d15] px-[14px] text-[13.5px] font-semibold text-[#eaeef7] hover:border-[#1d8a50]">{text}</button>
            ))}
          </div>
        )}

        {S.rec ? (
          <div className="flex flex-none animate-[lgup_.15s_ease-out] items-center gap-2 bg-[#040608] px-3 pb-[26px] pt-2 dk:pb-[14px]">
            <button onClick={cancelRec} aria-label="Cancel recording" className={`${roundBtn} bg-transparent text-[19px] text-[#ff8a8a] hover:bg-[#0f1522]`}><Trash2 size={19} /></button>
            <div className="flex h-11 min-w-0 flex-1 items-center gap-[10px] rounded-full bg-[#090d15] px-4">
              <span className="size-[9px] flex-none rounded-full bg-[#ff5d5d]" style={{ animation: "lgrec 1s infinite" }} />
              <span className="flex-none text-[14.5px] font-medium tabular-nums">{fmt(S.recS)}</span>
              <div className="flex h-6 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden">
                {LIVE_BARS.map((b, k) => <span key={k} className="h-[22px] w-[3px] flex-none origin-center rounded-[2px] bg-[#7fe3a8]" style={{ animation: `lgwave ${b.d}s ${b.dl}s ease-in-out infinite` }} />)}
              </div>
            </div>
            <button onClick={sendVoice} aria-label="Send voice message" className={`${roundBtn} bg-[#1d8a50] text-[18px] text-white active:scale-95 ${btnShadow}`}><SendHorizontal size={18} /></button>
          </div>
        ) : (
          <div className="flex flex-none items-center gap-2 bg-[#040608] px-3 pb-[26px] pt-2 dk:pb-[14px]">
            <button onClick={() => set((s) => ({ hintOpen: !s.hintOpen }))} aria-label="Hint" className={`${roundBtn} text-[19px] text-[#ffb38f] transition-[background] duration-[.15s] hover:bg-[#0f1522]`} style={{ background: S.hintOpen ? "#0f1522" : "transparent" }}><Lightbulb size={19} /></button>
            <input
              value={S.draft}
              onChange={(e) => set({ draft: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); push(S.draft.trim()); } }}
              placeholder="Type a message"
              maxLength={500}
              className="h-11 min-w-0 flex-1 rounded-full border border-[#182033] bg-[#0b1019] px-4 text-[15.5px] text-[#eaeef7] outline-none focus:shadow-[0_0_0_2px_#1d8a50]"
            />
            <button onClick={startRec} aria-label="Record voice message" className={`${roundBtn} text-[19px] active:scale-95 ${btnShadow}`} style={{ background: hasDraft ? "#0f1522" : "#1d8a50", color: hasDraft ? "#7fe3a8" : "#ffffff" }}><Mic size={19} /></button>
            {hasDraft && <button onClick={() => push(S.draft.trim())} aria-label="Send" className={`${roundBtn} bg-[#1d8a50] text-[18px] text-white active:scale-95 ${btnShadow}`}><SendHorizontal size={18} /></button>}
          </div>
        )}

        {S.sheet && (
          <>
            <div onClick={() => set({ sheet: null })} className="absolute inset-0 z-[5] animate-[lgfade_.15s] bg-[rgba(4,7,14,.55)]" />
            <div className="absolute inset-x-0 bottom-0 z-[6] mx-auto flex w-full max-w-[480px] animate-[lgup_.22s_ease-out] flex-col gap-4 rounded-t-[28px] border border-[#182033] bg-[#0a0e16] px-5 pb-7 pt-[10px] shadow-[0_-24px_48px_-12px_rgba(0,0,0,.6)]">
              <span className="h-1 w-10 self-center rounded-full bg-[#252f4a]" />
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[18px] font-semibold">Tip</span>
                <span className="rounded-full bg-[rgba(255,179,143,.16)] px-[10px] py-[3px] text-[12px] font-semibold text-[#ffb38f]">{S.sheet.type}</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-[3px]">
                  <span className={caps}>YOU WROTE</span>
                  <span className="text-[16px] text-[#94a3c0]">{S.sheet.pre}<span className="text-[#eaeef7] line-through decoration-[#ffb38f]">{S.sheet.original}</span>{S.sheet.post}</span>
                </div>
                <div className="flex flex-col gap-[3px]">
                  <span className={caps}>BETTER</span>
                  <span className="text-[16px] text-[#94a3c0]">{S.sheet.pre}<b className="text-[#7fe3a8]">{S.sheet.better}</b>{S.sheet.post}</span>
                </div>
                <div className="flex flex-col gap-[3px]">
                  <span className={caps}>WHY</span>
                  <span className="text-[14.5px] leading-[1.5]">{S.sheet.why}</span>
                  <span className="text-[14px] leading-[1.5] text-[#94a3c0]">{S.sheet.whyNative}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => set({ sheet: null })} className={`h-11 flex-1 cursor-pointer rounded-[12px] border-0 bg-[#1d8a50] text-[14.5px] font-medium text-white hover:bg-[#187544] ${btnShadow}`}>Got it</button>
                {/* dummy: see REPLACE.md */}
                <button onClick={() => set({ sheet: null })} className="h-11 flex-1 cursor-pointer rounded-[12px] border border-[#252f4a] bg-transparent text-[14.5px] font-medium text-[#eaeef7] hover:bg-[#0f1522]">Save to practice</button>
              </div>
              <button onClick={() => { set({ sheet: null, pt: 2 }); router.push("/dashboard/practice"); }} className="flex h-8 cursor-pointer items-center gap-[6px] self-center border-0 bg-transparent text-[14px] font-medium text-[#7fe3a8]">Practice now<ArrowRight size={14} /></button>
            </div>
          </>
        )}
      </div>

      {/* CONTEXT PANEL (≥1240px) */}
      <div className="hidden min-h-0 w-[300px] flex-none flex-col gap-6 overflow-y-auto border-l border-[#121a29] bg-[#06090e] px-5 py-6 xw:flex">
        <div className="flex flex-col items-center gap-[10px] pt-2 text-center">
          <div className={`size-[72px] rounded-full text-[28px] text-[#c5cee0] ${tile}`}><Icon size={28} /></div>
          <div className="flex flex-col gap-[2px]">
            <span className="text-[16px] font-semibold">{c.title}</span>
            <span className="text-[13px] text-[#94a3c0]">{c.name.split(" · ")[1]}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className={caps}>MISSION GOALS</span>
            <span className="font-mono text-[12px] text-[#94a3c0]">{c.done + "/" + c.total}</span>
          </div>
          <div className="flex flex-col gap-[10px]">
            {ctxGoals.map((text, k) => {
              const d = k < c.done;
              return (
                <div key={text} className="flex items-start gap-[10px] text-[14px] leading-[1.4]" style={{ color: d ? "#94a3c0" : "#eaeef7" }}>
                  <span className="mt-px flex size-5 flex-none items-center justify-center rounded-full border-[1.5px] border-solid text-[12px] text-white" style={{ borderColor: d ? "#1d8a50" : "#2a3550", background: d ? "#1d8a50" : "transparent" }}>{d && <Check size={12} />}</span>
                  {text}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className={caps}>KEY WORDS</span>
          <div className="flex flex-wrap gap-[6px]">
            {(scen ? scen.vocab : CTX_VOCAB_DEFAULT).map((v) => <span key={v} className="rounded-[8px] border border-[#182033] bg-[#0f1624] px-[10px] py-[5px] text-[13px] font-medium">{v}</span>)}
          </div>
        </div>
        <div className="flex flex-col gap-[6px] rounded-[16px] border border-[#182033] bg-[#0a0e16] p-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
          <span className="flex items-center gap-2 text-[13px] font-semibold"><Pencil size={13} className="text-[#ffb38f]" />{(tipN || "No") + (tipN === 1 ? " tip" : " tips") + " in this chat"}</span>
          <span className="text-[13px] leading-[1.5] text-[#94a3c0]">Tap a tip under your message to see the correction and why.</span>
        </div>
      </div>
    </div>
  );
}

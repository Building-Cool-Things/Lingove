"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Download, Pencil, Search, Share, SquarePlus, Zap } from "lucide-react";

import { completeOnboarding } from "@/app/actions/onboarding";
import { signOut } from "@/lib/auth-client";
import { GOALS, INTS, LANGS, LEVELS, MODES, ONB_TITLES, TARGETS, norm } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { BrandMark, btnPress, btnPrimary, btnShadow, card, input } from "./ui";

const TOTAL = 7;
const row = "rounded-[12px] border-[1.5px] flex items-center gap-3 cursor-pointer transition-all duration-150";
const sel = (on: boolean) => (on ? "border-[#1d8a50] bg-[#0e2417]" : "border-[#1a2235] bg-[#0a0e16] hover:border-[#1d8a50]");
const search = `w-full h-[44px] pl-[38px] pr-3 text-[14.5px] ${input}`;
const stepIcon = (on: boolean) => ({ opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.5})`, transition: "all .2s cubic-bezier(.2,1.4,.4,1)" });

type InstallEvent = Event & { prompt: () => Promise<void> };

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [q, setQ] = useState("");
  const [iq, setIq] = useState("");
  const [native, setNative] = useState("hi");
  const [target, setTarget] = useState("en");
  const [ints, setInts] = useState(["food", "travel", "music"]);
  const [level, setLevel] = useState("A2");
  const [goal, setGoal] = useState(10);
  const [corr, setCorr] = useState<"instant" | "end">("instant");
  const [notify, setNotify] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const installEvt = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); installEvt.current = e as InstallEvent; };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);

  // Done screen → home.
  useEffect(() => {
    if (step <= TOTAL) return;
    const t = setTimeout(() => router.push("/dashboard"), 1500);
    return () => clearTimeout(t);
  }, [step, router]);

  const fin = step > TOTAL;
  const icount = ints.length;
  const cant = (step === 3 && icount < 3) || busy;
  const hint = err || (step === 3 ? (icount < 3 ? "Pick " + (3 - icount) + " more to continue" : icount + " selected") : "");

  async function next() {
    if (cant) return;
    if (step < TOTAL) return setStep(step + 1);
    setBusy(true);
    setErr("");
    const r = await completeOnboarding({ nativeLanguage: native, interests: ints, currentLevel: level, dailyTimeSpend: goal, correctionStyle: corr, notifyLanguages: notify });
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    setStep(TOTAL + 1);
  }

  async function back() {
    if (step > 1) return setStep(Math.min(step, TOTAL + 1) - 1);
    await signOut();
    router.push("/");
  }

  const langs = LANGS.filter((l) => !norm(q) || norm(l[1] + " " + l[2]).includes(norm(q)));
  const groups = INTS.map(([name, items]) => ({ name, items: items.filter(([, l]) => !norm(iq) || norm(l).includes(norm(iq))) })).filter((g) => g.items.length);
  const toggleInt = (k: string) => setInts((s) => (s.includes(k) ? s.filter((x) => x !== k) : s.length >= 15 ? s : [...s, k]));

  return (
    <div className="flex h-dvh flex-col bg-[#040608]">
      <div className="flex w-full flex-none items-center gap-3 self-center px-5 pb-1 pt-2 dk:max-w-[600px] dk:pt-7">
        <button onClick={back} aria-label="Back" className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] border border-[#252f4a] bg-[#090d15] text-[17px] text-[#eaeef7] hover:bg-[#0a0f1a]"><ArrowLeft size={17} /></button>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className="h-[5px] flex-1 rounded-full transition-[background] duration-[.25s]" style={{ background: i < step || fin ? "#1d8a50" : "#141b2b" }} />
          ))}
        </div>
        <span className="min-w-[28px] text-right font-mono text-[11.5px] text-[#94a3c0]">{fin ? "" : step + "/" + TOTAL}</span>
      </div>

      <div className="flex min-h-0 w-full flex-1 animate-[lgup_.25s_ease-out] flex-col gap-4 self-center overflow-y-auto overflow-x-hidden px-5 pb-3 pt-[18px] dk:max-w-[600px]">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-[26px] font-semibold leading-[1.15] tracking-[-.025em] [text-wrap:balance]">{fin ? "" : ONB_TITLES[step][0]}</h2>
          <p className="m-0 text-[14.5px] leading-[1.5] text-[#94a3c0]">{fin ? "" : ONB_TITLES[step][1]}</p>
        </div>

        {step === 1 && (
          <>
            <div className="relative">
              <Search size={14.5} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3c0]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 100+ languages" className={search} />
            </div>
            <div className="flex flex-col gap-2">
              {langs.map(([code, nat, en]) => (
                <div key={code} onClick={() => setNative(code)} className={cn(row, "min-h-[54px] px-[14px]", sel(native === code))}>
                  <div className="flex flex-1 flex-col"><span className="text-[16px] font-medium">{nat}</span><span className="text-[12.5px] text-[#94a3c0]">{en}</span></div>
                  <Check size={18} className="text-[#7fe3a8]" style={stepIcon(native === code)} />
                </div>
              ))}
              {!langs.length && <span className="px-[2px] py-3 text-[14px] text-[#94a3c0]">No language matches “{q}”.</span>}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2">
            {TARGETS.map(([k, name, note]) => {
              const live = k === "en", on = target === k, wl = notify.includes(k);
              return (
                <div key={k} onClick={() => live && setTarget(k)} className={cn(row, "min-h-[58px] px-[14px]", on && live ? "border-[#1d8a50] bg-[#0e2417]" : "border-[#1a2235] bg-[#0a0e16]", !live && "cursor-default")}>
                  <div className="flex flex-1 flex-col"><span className="text-[16px] font-medium">{name}</span><span className="text-[12.5px] text-[#94a3c0]">{note}</span></div>
                  {!live && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setNotify((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k])); }}
                      className={cn("h-8 cursor-pointer rounded-[8px] border border-[#252f4a] px-3 text-[12.5px] font-medium", wl ? "bg-[#0e2417] text-[#d3f5e1]" : "bg-transparent text-[#eaeef7]")}
                    >
                      {wl ? "We will tell you" : "Notify me"}
                    </button>
                  )}
                  {live && <Check size={18} className="text-[#7fe3a8]" />}
                </div>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-[10px]">
              <div className="relative flex-1">
                <Search size={14.5} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3c0]" />
                <input value={iq} onChange={(e) => setIq(e.target.value)} placeholder="cricket, cooking, startups…" className={search} />
              </div>
              <span className={cn("whitespace-nowrap rounded-[8px] px-[9px] py-[6px] font-mono text-[12px] font-medium", icount >= 3 ? "bg-[#0e2417] text-[#d3f5e1]" : "bg-[rgba(255,179,143,.14)] text-[#ffb38f]")}>{icount}/15</span>
            </div>
            {groups.map((g) => (
              <div key={g.name} className="flex flex-col gap-[9px]">
                <span className="text-[12px] font-semibold tracking-[.04em] text-[#94a3c0]">{g.name}</span>
                <div className="flex flex-wrap gap-2">
                  {g.items.map(([k, label]) => {
                    const on = ints.includes(k), full = !on && icount >= 15;
                    return (
                      <button
                        key={k}
                        onClick={() => toggleInt(k)}
                        className={cn("flex h-[38px] cursor-pointer items-center gap-[7px] rounded-full border-[1.5px] px-[14px] text-[14px] font-medium transition-all duration-[.14s] active:scale-[.97]", on ? "border-[#1d8a50] bg-[#1d8a50] text-white" : cn("border-[#252f4a] bg-[#090d15]", full ? "text-[#667494]" : "text-[#eaeef7]"))}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!groups.length && <span className="text-[14px] text-[#94a3c0]">Nothing found. Your search will be sent to our content team once you continue.</span>}
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-col gap-2">
              {LEVELS.map(([code, name, desc]) => {
                const on = level === code;
                return (
                  <div key={code} onClick={() => setLevel(code)} className={cn(row, "p-[14px]", sel(on))}>
                    <span className={cn("flex h-6 min-w-[30px] items-center justify-center rounded-[6px] border font-mono text-[11px]", on ? "border-[#1d8a50] bg-[#1d8a50] text-white" : "border-[#252f4a] bg-[#040608] text-[#94a3c0]")}>{code}</span>
                    <div className="flex flex-1 flex-col gap-[2px]"><span className="text-[15.5px] font-medium">{name}</span><span className="text-[13px] leading-[1.4] text-[#94a3c0]">{desc}</span></div>
                    <Check size={18} className="text-[#7fe3a8]" style={stepIcon(on)} />
                  </div>
                );
              })}
            </div>
            {/* dummy: placement test not built yet, see REPLACE.md */}
            <button className="flex h-10 cursor-pointer items-center gap-2 self-start rounded-[10px] border-0 bg-[#0e2417] px-[14px] text-[14px] font-medium text-[#d3f5e1] hover:bg-[#143a25]"><Zap size={14} />Take the 5 question test</button>
          </>
        )}

        {step === 5 && (
          <div className="grid grid-cols-2 gap-[10px]">
            {GOALS.map(([min, tag]) => {
              const on = goal === min;
              return (
                <div key={min} onClick={() => setGoal(min)} className={cn("flex cursor-pointer flex-col items-start gap-[2px] rounded-[14px] border-[1.5px] px-[14px] py-[18px] transition-all duration-150", sel(on))}>
                  <span className="text-[30px] font-semibold tracking-[-.02em] tabular-nums">{min}</span>
                  <span className="text-[13px] font-medium text-[#94a3c0]">minutes a day</span>
                  <span className={cn("mt-2 rounded-full px-[9px] py-[3px] text-[12px] font-semibold", on ? "bg-[#ffb38f] text-[#2a1206]" : "bg-[#0f1522] text-[#94a3c0]")}>{tag}</span>
                </div>
              );
            })}
          </div>
        )}

        {step === 6 && (
          <>
            <div className="flex flex-col gap-2">
              {MODES.map(([k, name, desc]) => {
                const on = corr === k;
                return (
                  <div key={k} onClick={() => setCorr(k)} className={cn(row, "p-[14px]", sel(on))}>
                    <span className={cn("flex size-[18px] flex-none items-center justify-center rounded-full border-[1.5px]", on ? "border-[#1d8a50]" : "border-[#4f6085]")}>
                      <span className="size-2 rounded-full bg-[#1d8a50] transition-transform duration-[.16s]" style={{ transform: `scale(${on ? 1 : 0})` }} />
                    </span>
                    <div className="flex flex-1 flex-col gap-[2px]"><span className="text-[15.5px] font-medium">{name}</span><span className="text-[13px] leading-[1.4] text-[#94a3c0]">{desc}</span></div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-[10px] rounded-[20px] border border-[#182033] bg-[#0a0e16] p-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_16px_32px_-20px_rgba(0,0,0,.9)]">
              <span className="text-[11.5px] font-semibold tracking-[.04em] text-[#94a3c0]">PREVIEW</span>
              <div className="self-end rounded-[16px_4px_16px_16px] bg-[#1d8a50] px-[13px] py-[9px] text-[14.5px] text-white">I am want a table</div>
              {corr === "instant" && <span className="flex items-center gap-[6px] self-end rounded-full bg-[rgba(255,179,143,.14)] px-[10px] py-[3px] text-[12px] font-semibold text-[#ffb38f]"><Pencil size={12} />1 tip</span>}
              {corr === "end" && <span className="self-end text-[12px] text-[#94a3c0]">Tips appear in your summary</span>}
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <div className={cn(card, "flex flex-col items-start gap-[14px] p-5")}>
              <BrandMark size={56} word={false} />
              <div className="flex flex-col gap-1"><span className="text-[18px] font-semibold">Lingov</span><span className="text-[13.5px] leading-[1.5] text-[#94a3c0]">Opens full screen, loads fast on slow networks and keeps your streak one tap away.</span></div>
              <div className="flex w-full flex-col gap-[10px] border-t border-[#141b2b] pt-[14px]">
                {([[Share, "Tap Share in Safari"], [SquarePlus, "Choose Add to Home Screen"]] as const).map(([Icon, t]) => (
                  <div key={t} className="flex items-center gap-[10px] text-[14px] font-semibold">
                    <span className="flex size-[26px] items-center justify-center rounded-[7px] border border-[#1b2538] bg-[linear-gradient(180deg,#141d2f,#0e1523)]"><Icon size={14} /></span>{t}
                  </div>
                ))}
              </div>
            </div>
            {/* Native install prompt when the browser offers one (needs a web manifest, see REPLACE.md). */}
            <button onClick={() => installEvt.current?.prompt()} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#252f4a] bg-[#090d15] text-[15px] font-medium text-[#eaeef7] hover:bg-[#0a0f1a]"><Download size={15} />Install on Android</button>
          </>
        )}

        {fin && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-10 text-center">
            <div className="flex size-[72px] items-center justify-center rounded-[20px] bg-[#ffb38f] text-[32px] text-[#2a1206]"><Check size={32} /></div>
            <span className="text-[24px] font-semibold tracking-[-.02em]">You are set</span>
            <span className="max-w-[290px] text-[14.5px] leading-[1.55] text-[#94a3c0]">First mission is ready: Order dinner for two. About 8 minutes.</span>
          </div>
        )}
      </div>

      {!fin && (
        <div className="flex w-full flex-none flex-col gap-2 self-center border-t border-[#141b2b] bg-[#040608] px-5 pb-7 pt-3 dk:max-w-[600px]">
          <button onClick={next} disabled={cant} className={cn("h-12 rounded-[12px] text-[15px]", btnPrimary, btnPress, btnShadow, cant && "cursor-not-allowed opacity-45")}>
            {step === TOTAL ? "Start my first mission" : "Continue"}<ArrowRight size={15} />
          </button>
          <span className={cn("min-h-4 text-center text-[12.5px]", err ? "text-[#ea7a4f]" : "text-[#94a3c0]")}>{hint}</span>
        </div>
      )}
    </div>
  );
}

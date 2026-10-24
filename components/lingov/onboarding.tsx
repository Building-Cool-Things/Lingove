"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Search, Zap } from "lucide-react";

import { completeOnboarding, scorePlacement, type PlacementQuestionView } from "@/app/actions/onboarding";
import { signOut } from "@/lib/auth-client";
import { AVATARS, INTS, LANGS, LEVELS, ONB_TITLES, levelName, norm } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { Pic, btnOutline, btnPress, btnPrimary, btnShadow, input } from "./ui";

const TOTAL = 4; // the last step is the level (picked from the list, or found by the 5 question test)
const DAILY_GOAL = 10; // minutes a day, changeable later
const row = "rounded-[16px] border-[1.5px] flex items-center gap-3 cursor-pointer transition-all duration-150";
const sel = (on: boolean) => (on ? "border-[#52C79A] bg-[rgba(82,199,154,.10)]" : "border-[#2A2F2D] bg-[#171A19] hover:border-[#52C79A]");
const search = `w-full h-[44px] pl-[38px] pr-3 text-[14.5px] ${input}`;
const stepIcon = (on: boolean) => ({ opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.5})`, transition: "all .2s cubic-bezier(.2,1.4,.4,1)" });

export function Onboarding({ name: googleName, image: googleImage, questions }: { name: string; image: string; questions: PlacementQuestionView[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(googleName ?? "");
  const [image, setImage] = useState(googleImage || AVATARS[0]);
  const [q, setQ] = useState("");
  const [iq, setIq] = useState("");
  const [native, setNative] = useState("hi");
  const [ints, setInts] = useState(["food", "travel", "music"]);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // question id -> chosen option, kept while you go back and forth
  const [qi, setQi] = useState(0); // question shown in the level test
  const [testing, setTesting] = useState(false); // the 5 question test is open on the level step
  const [level, setLevel] = useState("A2"); // the chosen level, the test fills it in
  const [tested, setTested] = useState(""); // level the test found, shown as a note
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Done screen → home.
  useEffect(() => {
    if (step <= TOTAL) return;
    const t = setTimeout(() => router.push("/dashboard"), 1500);
    return () => clearTimeout(t);
  }, [step, router]);

  const fin = step > TOTAL;
  const icount = ints.length;
  const q5 = questions[qi];
  const lastQ = qi >= questions.length - 1;
  const cant = (step === 1 && !name.trim()) || (step === 3 && icount < 3) || (testing && (!q5 || answers[q5.id] == null)) || busy;
  const hint = err || (testing ? "Question " + (qi + 1) + " of " + questions.length : step === 3 ? (icount < 3 ? "Pick " + (3 - icount) + " more to continue" : "") : "");

  function startTest() {
    setAnswers({});
    setQi(0);
    setErr("");
    setTesting(true);
  }

  async function next() {
    if (cant) return;
    if (testing) {
      if (!lastQ) return setQi(qi + 1);
      // Last answer: the server marks the test and the level it finds becomes the chosen one.
      setBusy(true);
      setErr("");
      const r = await scorePlacement(questions.map((x) => ({ questionId: x.id, choice: answers[x.id] })));
      setBusy(false);
      if (!r.ok || !r.level) return setErr(r.message);
      setLevel(r.level);
      setTested(r.level);
      return setTesting(false);
    }
    if (step < TOTAL) return setStep(step + 1);
    setBusy(true);
    setErr("");
    const r = await completeOnboarding({ name, image, nativeLanguage: native, interests: ints, currentLevel: level, dailyTimeSpend: DAILY_GOAL, notifyLanguages: [] });
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    setStep(TOTAL + 1);
  }

  async function back() {
    if (testing) return qi > 0 ? setQi(qi - 1) : setTesting(false);
    if (step > 1) return setStep(Math.min(step, TOTAL + 1) - 1);
    await signOut();
    router.push("/");
  }

  const langs = LANGS.filter((l) => !norm(q) || norm(l[1] + " " + l[2]).includes(norm(q)));
  const groups = INTS.map(([name, items]) => ({ name, items: items.filter(([, l]) => !norm(iq) || norm(l).includes(norm(iq))) })).filter((g) => g.items.length);
  // "Select all" works on what the search shows; once everything shown is picked the same button clears it.
  const shown = groups.flatMap((g) => g.items.map(([k]) => k));
  const allShown = shown.length > 0 && shown.every((k) => ints.includes(k));
  const toggleAll = () => setInts((s) => (allShown ? s.filter((k) => !shown.includes(k)) : [...new Set([...s, ...shown])]));
  const toggleInt = (k: string) => setInts((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  return (
    <div className="flex h-dvh flex-col bg-[#0D0F0E]">
      <div className="flex w-full flex-none items-center gap-3 self-center px-5 pb-1 pt-2 dk:max-w-[600px] dk:pt-7">
        <button onClick={back} aria-label="Back" className="flex size-10 cursor-pointer items-center justify-center rounded-[16px] border border-[#2A2F2D] bg-[#212524] text-[17px] text-[#F3F6F4] hover:bg-[#171A19]"><ArrowLeft size={17} /></button>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className="h-[5px] flex-1 rounded-full transition-[background] duration-[.25s]" style={{ background: i < step || fin ? "#52C79A" : "#2A2F2D" }} />
          ))}
        </div>
        <span className="min-w-[28px] text-right tabular-nums text-[11.5px] text-[#A3ABA7]">{fin ? "" : step + "/" + TOTAL}</span>
      </div>

      <div className="flex min-h-0 w-full flex-1 animate-[lgup_.25s_ease-out] flex-col gap-4 self-center overflow-y-auto overflow-x-hidden px-5 pb-3 pt-[18px] dk:max-w-[600px]">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-[26px] font-bold leading-[1.15] tracking-[-.01em] [text-wrap:balance]">{fin ? "" : testing ? "Let us find your level" : ONB_TITLES[step][0]}</h2>
          <p className="m-0 text-[14.5px] leading-[1.5] text-[#A3ABA7]">{fin ? "" : testing ? "Five quick questions, easy to hard. Pick the best answer." : ONB_TITLES[step][1]}</p>
        </div>

        {step === 1 && (
          <>
            <div className="flex flex-col gap-[7px]">
              <label htmlFor="ob-name" className="text-[13.5px] font-medium">Your name</label>
              <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="Ashfaq" autoComplete="name" className={`h-[46px] px-[14px] text-[15px] ${input}`} />
            </div>
            <div className="flex flex-col gap-[9px]">
              <span className="text-[13.5px] font-medium">Your picture</span>
              <div className="flex flex-wrap gap-3">
                {[...(googleImage.startsWith("http") ? [googleImage] : []), ...AVATARS].map((a) => (
                  <button key={a} type="button" onClick={() => setImage(a)} aria-label="Choose picture" className={cn("flex size-16 cursor-pointer items-center justify-center rounded-full border-2 bg-[#171A19] transition-all duration-150", image === a ? "border-[#52C79A]" : "border-[#2A2F2D] hover:border-[#52C79A]")}>
                    <Pic image={a} initial="" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="relative">
              <Search size={14.5} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#A3ABA7]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 100+ languages" className={search} />
            </div>
            <div className="flex flex-col gap-2">
              {langs.map(([code, nat, en]) => (
                <div key={code} onClick={() => setNative(code)} className={cn(row, "min-h-[54px] px-[14px]", sel(native === code))}>
                  <div className="flex flex-1 flex-col"><span className="text-[16px] font-medium">{nat}</span><span className="text-[12.5px] text-[#A3ABA7]">{en}</span></div>
                  <Check size={18} className="text-[#52C79A]" style={stepIcon(native === code)} />
                </div>
              ))}
              {!langs.length && <span className="px-[2px] py-3 text-[14px] text-[#A3ABA7]">No language matches “{q}”.</span>}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-[10px]">
              <div className="relative flex-1">
                <Search size={14.5} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#A3ABA7]" />
                <input value={iq} onChange={(e) => setIq(e.target.value)} placeholder="cricket, cooking, startups…" className={search} />
              </div>
              <span className={cn("whitespace-nowrap rounded-[8px] px-[9px] py-[6px] tabular-nums text-[12px] font-medium", icount >= 3 ? "bg-[#212524] text-[#6BD3AB]" : "bg-[rgba(237,191,115,.14)] text-[#EDBF73]")}>{icount}</span>
              <button type="button" onClick={toggleAll} className="h-[34px] flex-none cursor-pointer whitespace-nowrap rounded-full border border-[#2A2F2D] bg-transparent px-3 text-[12.5px] font-bold text-[#F3F6F4] hover:bg-[#212524]">{allShown ? "Clear all" : "Select all"}</button>
            </div>
            {groups.map((g) => (
              <div key={g.name} className="flex flex-col gap-[9px]">
                <span className="text-[12px] font-bold tracking-[.04em] text-[#A3ABA7]">{g.name}</span>
                <div className="flex flex-wrap gap-2">
                  {g.items.map(([k, label]) => {
                    const on = ints.includes(k);
                    return (
                      <button
                        key={k}
                        onClick={() => toggleInt(k)}
                        className={cn("flex h-[38px] cursor-pointer items-center gap-[7px] rounded-full border-[1.5px] px-[14px] text-[14px] font-medium transition-all duration-[.14s] active:scale-[.97]", on ? "border-[#52C79A] bg-[#52C79A] text-[#052013]" : "border-[#2A2F2D] bg-[#212524] text-[#F3F6F4]")}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!groups.length && <span className="text-[14px] text-[#A3ABA7]">Nothing found. Your search will be sent to our content team once you continue.</span>}
          </>
        )}

        {step === 4 && !testing && (
          <>
            <div className="flex flex-col gap-2">
              {LEVELS.map(([code, name, desc], i) => {
                const on = level === code;
                return (
                  <div key={code} onClick={() => setLevel(code)} className={cn(row, "p-[14px]", sel(on))}>
                    <span className={cn("flex h-6 min-w-[30px] items-center justify-center rounded-[6px] border tabular-nums text-[11px]", on ? "border-[#52C79A] bg-[#52C79A] text-[#052013]" : "border-[#2A2F2D] bg-[#0D0F0E] text-[#A3ABA7]")}>{i + 1}</span>
                    <div className="flex flex-1 flex-col gap-[2px]"><span className="text-[15.5px] font-medium">{name}</span><span className="text-[13px] leading-[1.4] text-[#A3ABA7]">{desc}</span></div>
                    <Check size={18} className="text-[#52C79A]" style={stepIcon(on)} />
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={startTest} className={cn("flex h-10 items-center gap-2 px-[14px] text-[14px]", btnOutline)}><Zap size={14} />{tested ? "Take the test again" : "Take the 5 question test"}</button>
              {tested && <span className="text-[13px] text-[#A3ABA7]">The test found: <b className="font-bold text-[#9ADBBE]">{levelName(tested)}</b></span>}
            </div>
          </>
        )}

        {step === 4 && testing && q5 && (
          <>
            <div className="flex gap-1.5" aria-hidden>
              {questions.map((x, i) => (
                <span key={x.id} className="h-[5px] flex-1 rounded-full transition-[background] duration-[.25s]" style={{ background: i <= qi ? "#9ADBBE" : "#2A2F2D" }} />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[18px] font-bold leading-[1.35]">{q5.prompt}</span>
              <div className="flex flex-col gap-2">
                {q5.options.map((o, i) => {
                  const on = answers[q5.id] === i;
                  return (
                    <div key={i} onClick={() => setAnswers((a) => ({ ...a, [q5.id]: i }))} className={cn(row, "min-h-[54px] px-[14px]", sel(on))}>
                      <span className={cn("flex h-6 min-w-[24px] items-center justify-center rounded-[6px] border tabular-nums text-[11px]", on ? "border-[#52C79A] bg-[#52C79A] text-[#052013]" : "border-[#2A2F2D] bg-[#0D0F0E] text-[#A3ABA7]")}>{"ABCD"[i]}</span>
                      <span className="flex-1 text-[15.5px] font-medium">{o}</span>
                      <Check size={18} className="text-[#52C79A]" style={stepIcon(on)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {fin && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-10 text-center">
            <div className="flex size-[72px] items-center justify-center rounded-[22px] bg-[#EDBF73] text-[32px] text-[#2A1800]"><Check size={32} /></div>
            <span className="text-[24px] font-bold tracking-[-.01em]">You are set</span>
            {level && <span className="rounded-full bg-[rgba(237,191,115,.15)] px-3 py-1 text-[12.5px] font-bold text-[#EDBF73]">Your level: {levelName(level)}</span>}
            <span className="max-w-[290px] text-[14.5px] leading-[1.55] text-[#A3ABA7]">First mission is ready: Order dinner for two. About 8 minutes.</span>
          </div>
        )}
      </div>

      {!fin && (
        <div className="flex w-full flex-none flex-col gap-2 self-center border-t border-[#2A2F2D] bg-[#0D0F0E] px-5 pb-7 pt-3 dk:max-w-[600px]">
          <button onClick={next} disabled={cant} className={cn("h-12 text-[15px]", btnPrimary, btnPress, btnShadow, cant && "cursor-not-allowed opacity-45")}>
            {testing ? (lastQ ? "See my level" : "Next question") : step === TOTAL ? "Start my first mission" : "Continue"}<ArrowRight size={15} />
          </button>
          <span className={cn("min-h-4 text-center text-[12.5px]", err ? "text-[#F26B6B]" : "text-[#A3ABA7]")}>{hint}</span>
        </div>
      )}
    </div>
  );
}

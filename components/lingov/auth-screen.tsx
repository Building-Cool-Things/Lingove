"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCheck, Pencil } from "lucide-react";

import { signIn, signUp } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { BrandMark, btnPress, btnPrimary, input } from "./ui";

const S_COL = ["#141b2b", "#ea7a4f", "#ffb38f", "#4cc283", "#4cc283"];
const field = `h-[46px] px-[14px] text-[15px] ${input}`;

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isSignup = mode === "signup";

  const sc = (pw.length >= 8 ? 1 : 0) + (/[A-Z]/.test(pw) && /[a-z]/.test(pw) ? 1 : 0) + (/\d/.test(pw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    const res = isSignup
      ? await signUp.email({ name: name.trim() || email.split("@")[0], email: email.trim(), password: pw })
      : await signIn.email({ email: email.trim(), password: pw });
    if (res.error) {
      setErr(res.error.message || "Something went wrong. Try again.");
      setBusy(false);
      return;
    }
    // Sign up → onboarding step 1; sign in → home (dashboard layout sends un-onboarded users to /onboarding).
    router.push(isSignup ? "/onboarding" : "/dashboard");
  }

  return (
    <div className="flex h-dvh bg-[#040608]">
      {/* Brand panel, ≥1100px */}
      <div
        className="hidden wd:flex min-w-0 flex-1 flex-col justify-center gap-8 overflow-y-auto overflow-x-hidden border-r border-[#121a29] p-10"
        style={{ background: "#040608", backgroundImage: "radial-gradient(80% 60% at 20% 10%,rgba(29,138,80,.14),transparent 70%),radial-gradient(60% 50% at 90% 100%,rgba(255,179,143,.06),transparent 70%)" }}
      >
        <BrandMark size={40} />
        <h2 className="m-0 max-w-[560px] text-[clamp(34px,3.6vw,52px)] font-semibold leading-[1.05] tracking-[-.035em] [text-wrap:balance]">Learn English by talking.</h2>
        <div className="flex max-w-[460px] flex-col gap-[10px]">
          <div className="max-w-[80%] self-start rounded-[4px_18px_18px_18px] border border-[#182033] bg-[#0f1624] px-[15px] py-[11px] text-[16px] leading-[1.4]">
            Good evening! Table for two?<span className="mt-[2px] block text-right text-[11px] text-[#94a3c0]">9:41</span>
          </div>
          <div className="max-w-[80%] self-end rounded-[18px_4px_18px_18px] bg-[#1d8a50] px-[15px] py-[11px] text-[16px] leading-[1.4] text-white">
            I am want a table near window
            <span className="mt-[2px] flex justify-end gap-[3px] text-[11px] text-[#d3f5e1]">9:41<CheckCheck size={13} /></span>
          </div>
          <span className="flex items-center gap-[6px] self-end rounded-full bg-[rgba(255,179,143,.14)] px-3 py-1 text-[12.5px] font-semibold text-[#ffb38f]"><Pencil size={12.5} />1 tip</span>
          <div className="max-w-[80%] self-start rounded-[4px_18px_18px_18px] border border-[#182033] bg-[#0f1624] px-[15px] py-[11px] text-[16px] leading-[1.4]">Of course. Near the window is free.</div>
        </div>
        <span className="max-w-[460px] text-[14px] leading-[1.55] text-[#94a3c0]">Short real-life chats with an AI. Gentle corrections. Progress you can see.</span>
      </div>

      <div className="flex min-h-0 flex-1 animate-[lgup_.25s_ease-out] flex-col items-center overflow-y-auto overflow-x-hidden px-6 pb-6 pt-5 wd:flex-[0_0_500px]">
        <form onSubmit={submit} className="my-auto flex w-full flex-col gap-[22px] dk:max-w-[400px]">
          <div className="mt-2"><BrandMark size={32} /></div>
          <div className="mt-[10px] flex flex-col gap-[10px]">
            <h1 className="m-0 text-[34px] font-semibold leading-[1.1] tracking-[-.03em]">{isSignup ? "Create your account" : "Learn English by talking."}</h1>
            <p className="m-0 text-[15.5px] leading-[1.55] text-[#94a3c0] [text-wrap:pretty]">
              {isSignup ? "Free to start. Missions, corrections and vocabulary in your own language." : "Short real-life chats with an AI. Gentle corrections. Progress you can see."}
            </p>
          </div>

          {/* Mobile chat preview */}
          <div className="flex flex-none flex-col gap-2 rounded-[20px] border border-[#182033] bg-[#070b11] p-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.03)] dk:hidden">
            <div className="max-w-[78%] self-start rounded-[4px_16px_16px_16px] border border-[#182033] bg-[#0f1624] px-3 py-2 text-[14.5px] leading-[1.4]">
              Good evening! Table for two?<span className="mt-[2px] block text-right text-[10.5px] text-[#94a3c0]">9:41</span>
            </div>
            <div className="max-w-[78%] self-end rounded-[16px_4px_16px_16px] bg-[#1d8a50] px-3 py-2 text-[14.5px] leading-[1.4] text-white">
              Yes please, near the window
              <span className="mt-[2px] flex justify-end gap-[3px] text-[10.5px] text-[#d3f5e1]">9:41<CheckCheck size={12} /></span>
            </div>
          </div>

          <div className="flex flex-none rounded-[10px] bg-[#0f1522] p-[3px]">
            {([["signin", "Sign in"], ["signup", "Create account"]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setMode(k); setErr(""); }}
                className={cn("h-9 flex-1 cursor-pointer rounded-[8px] border-0 text-[13.5px] font-medium transition-all duration-[.14s]", mode === k ? "bg-[#090d15] text-[#eaeef7]" : "bg-transparent text-[#94a3c0]")}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
            className="flex h-12 flex-none cursor-pointer items-center justify-center gap-[10px] rounded-[12px] border border-[#252f4a] bg-[#090d15] text-[15px] font-medium text-[#eaeef7] shadow-[0_1px_2px_rgba(0,0,0,.3)] hover:bg-[#0a0f1a] active:scale-[.98]"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-[#eaeef7] text-[12px] font-semibold text-[#040608]">G</span>Continue with Google
          </button>
          <div className="flex flex-none items-center gap-3 text-[12.5px] text-[#94a3c0]">
            <span className="h-px flex-1 bg-[#141b2b]" />or<span className="h-px flex-1 bg-[#141b2b]" />
          </div>

          <div className="flex flex-none flex-col gap-[14px]">
            {isSignup && (
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="lg-name" className="text-[13.5px] font-medium">Name</label>
                <input id="lg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ashfaq" autoComplete="name" className={field} />
              </div>
            )}
            <div className="flex flex-col gap-[7px]">
              <label htmlFor="lg-email" className="text-[13.5px] font-medium">Email</label>
              <input id="lg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={field} />
            </div>
            <div className="flex flex-col gap-[7px]">
              <div className="flex items-baseline justify-between">
                <label htmlFor="lg-pw" className="text-[13.5px] font-medium">Password</label>
                {/* dummy: no reset-password flow yet, see REPLACE.md */}
                {!isSignup && <a href="#" className="lg-a text-[12.5px]">Forgot password?</a>}
              </div>
              <input id="lg-pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" autoComplete={isSignup ? "new-password" : "current-password"} className={field} />
              {isSignup && (
                <div className="flex items-center gap-[10px]">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="h-1 flex-1 rounded-full transition-[background] duration-200" style={{ background: i < sc ? S_COL[sc] : "#141b2b" }} />
                    ))}
                  </div>
                  <span className="min-w-[44px] text-right text-[12px] font-medium text-[#94a3c0]">{pw ? ["Weak", "Weak", "Fair", "Good", "Strong"][sc] : ""}</span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={busy} className={cn("h-12 flex-none rounded-[12px] text-[15px]", btnPrimary, btnPress, busy && "cursor-not-allowed opacity-45")}>
            {isSignup ? "Create account" : "Sign in"}<ArrowRight size={15} />
          </button>
          {err && <p className="m-0 -mt-3 text-center text-[12.5px] text-[#ea7a4f]">{err}</p>}
          {/* dummy: Terms / Privacy pages do not exist yet, see REPLACE.md */}
          <p className="m-0 flex-none text-center text-[12.5px] leading-[1.5] text-[#94a3c0]">
            You must be 13 or older. By continuing you accept the <a href="#" className="lg-a">Terms</a> and <a href="#" className="lg-a">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}

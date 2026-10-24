"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCheck, Pencil } from "lucide-react";

import { signIn, signUp } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { BrandMark, btnOutline, btnPress, btnPrimary, input } from "./ui";

const field = `h-[46px] px-[14px] text-[15px] ${input}`;

export function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // One form for everyone: try to sign in, and if there is no such account, create it.
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    const em = email.trim();
    let error = (await signIn.email({ email: em, password: pw })).error;
    if (error) {
      error = (await signUp.email({ name: em.split("@")[0], email: em, password: pw })).error;
      // Email is taken, so the account exists and the password was simply wrong.
      if (error?.code?.startsWith("USER_ALREADY_EXISTS")) error = { ...error, message: "Wrong password. Try again." };
    }
    if (error) {
      setErr(error.message || "Something went wrong. Try again.");
      setBusy(false);
      return;
    }
    // "/" sends new users to onboarding and returning users to the dashboard.
    router.push("/");
  }

  return (
    <div className="flex h-dvh bg-[#0D0F0E]">
      {/* Brand panel, ≥1100px */}
      <div
        className="hidden wd:flex min-w-0 flex-1 flex-col justify-center gap-8 overflow-y-auto overflow-x-hidden border-r border-[#2A2F2D] p-10"
        style={{ background: "#0D0F0E" }}
      >
        <BrandMark size={40} />
        <h2 className="m-0 max-w-[560px] text-[clamp(34px,3.6vw,52px)] font-bold leading-[1.05] tracking-[-.01em] [text-wrap:balance]">Learn English by talking.</h2>
        <div className="flex max-w-[460px] flex-col gap-[10px]">
          <div className="max-w-[80%] self-start rounded-[4px_18px_18px_18px] border border-[#2A2F2D] bg-[#212524] px-[15px] py-[11px] text-[16px] leading-[1.4]">
            Good evening! Table for two?<span className="mt-[2px] block text-right text-[11px] text-[#A3ABA7]">9:41</span>
          </div>
          <div className="max-w-[80%] self-end rounded-[24px_8px_24px_24px] bg-[#52C79A] px-[15px] py-[11px] text-[16px] leading-[1.4] text-[#052013]">
            I am want a table near window
            <span className="mt-[2px] flex justify-end gap-[3px] text-[11px] text-[#6BD3AB]">9:41<CheckCheck size={13} /></span>
          </div>
          <span className="flex items-center gap-[6px] self-end rounded-full bg-[rgba(237,191,115,.14)] px-3 py-1 text-[12.5px] font-bold text-[#EDBF73]"><Pencil size={12.5} />1 tip</span>
          <div className="max-w-[80%] self-start rounded-[4px_18px_18px_18px] border border-[#2A2F2D] bg-[#212524] px-[15px] py-[11px] text-[16px] leading-[1.4]">Of course. Near the window is free.</div>
        </div>
        <span className="max-w-[460px] text-[14px] leading-[1.55] text-[#A3ABA7]">Short real-life chats with an AI. Gentle corrections. Progress you can see.</span>
      </div>

      <div className="flex min-h-0 flex-1 animate-[lgup_.25s_ease-out] flex-col items-center overflow-y-auto overflow-x-hidden px-6 pb-6 pt-5 wd:flex-[0_0_500px]">
        <form onSubmit={submit} className="my-auto flex w-full flex-col gap-[22px] dk:max-w-[400px]">
          <div className="mt-2"><BrandMark size={32} /></div>
          <div className="mt-[10px] flex flex-col gap-[10px]">
            <h1 className="m-0 text-[34px] font-bold leading-[1.1] tracking-[-.01em]">Learn English by talking.</h1>
            <p className="m-0 text-[15.5px] leading-[1.55] text-[#A3ABA7] [text-wrap:pretty]">
              Short real-life chats with an AI. Gentle corrections. Progress you can see.
            </p>
          </div>

          {/* Mobile chat preview */}
          <div className="flex flex-none flex-col gap-2 rounded-[22px] border border-[#2A2F2D] bg-[#171A19] p-[14px] dk:hidden">
            <div className="max-w-[78%] self-start rounded-[4px_16px_16px_16px] border border-[#2A2F2D] bg-[#212524] px-3 py-2 text-[14.5px] leading-[1.4]">
              Good evening! Table for two?<span className="mt-[2px] block text-right text-[10.5px] text-[#A3ABA7]">9:41</span>
            </div>
            <div className="max-w-[78%] self-end rounded-[24px_8px_24px_24px] bg-[#52C79A] px-3 py-2 text-[14.5px] leading-[1.4] text-[#052013]">
              Yes please, near the window
              <span className="mt-[2px] flex justify-end gap-[3px] text-[10.5px] text-[#6BD3AB]">9:41<CheckCheck size={12} /></span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
            className={cn("flex h-12 flex-none items-center justify-center gap-[10px] text-[15px]", btnOutline)}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-[#F3F6F4] text-[12px] font-bold text-[#0D0F0E]">G</span>Continue with Google
          </button>
          <div className="flex flex-none items-center gap-3 text-[12.5px] text-[#A3ABA7]">
            <span className="h-px flex-1 bg-[#2A2F2D]" />or<span className="h-px flex-1 bg-[#2A2F2D]" />
          </div>

          <div className="flex flex-none flex-col gap-[14px]">
            <div className="flex flex-col gap-[7px]">
              <label htmlFor="lg-email" className="text-[13.5px] font-medium">Email</label>
              <input id="lg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={field} />
            </div>
            <div className="flex flex-col gap-[7px]">
              <div className="flex items-baseline justify-between">
                <label htmlFor="lg-pw" className="text-[13.5px] font-medium">Password</label>
                {/* dummy: no reset-password flow yet, see REPLACE.md */}
                <a href="#" className="lg-a text-[12.5px]">Forgot password?</a>
              </div>
              <input id="lg-pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" autoComplete="current-password" className={field} />
            </div>
          </div>

          <button type="submit" disabled={busy} className={cn("h-12 flex-none text-[15px]", btnPrimary, btnPress, busy && "cursor-not-allowed opacity-45")}>
            Continue<ArrowRight size={15} />
          </button>
          <p className="m-0 -mt-3 flex-none text-center text-[12.5px] leading-[1.5] text-[#A3ABA7]">We will check if your account exists. If not, we will help you create one.</p>
          {err && <p className="m-0 -mt-3 text-center text-[12.5px] text-[#F26B6B]">{err}</p>}
          {/* dummy: Terms / Privacy pages do not exist yet, see REPLACE.md */}
          <p className="m-0 flex-none text-center text-[12.5px] leading-[1.5] text-[#A3ABA7]">
            You must be 13 or older. By continuing you accept the <a href="#" className="lg-a">Terms</a> and <a href="#" className="lg-a">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Flame } from "lucide-react";

import { SKILLS, TABS } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { useLingov } from "./store";
import { BrandMark } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { S, me, openReading, openWriting } = useLingov();
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));
  const onPractice = path === "/dashboard/practice";
  // Mobile: an open chat is full screen (prototype showTabs = !dk && !open).
  const hideTabs = path === "/dashboard/chats" && S.chat != null;

  return (
    <div className="flex h-dvh flex-col bg-[#040608] dk:flex-row">
      <aside className="hidden w-[240px] flex-none flex-col gap-6 border-r border-[#121a29] bg-[#06090e] px-[14px] py-6 dk:flex">
        <div className="px-2"><BrandMark size={32} /></div>
        <div className="flex flex-col gap-1">
          {TABS.map(([Icon, label, href]) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={cn("flex h-11 cursor-pointer items-center gap-3 rounded-[10px] border-0 px-3 text-left text-[14.5px] font-medium transition-[background] duration-150 hover:bg-[#090d15]", active(href) ? "bg-[#0e2417] text-[#eaeef7]" : "bg-transparent text-[#94a3c0]")}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <span className="px-3 pb-[6px] text-[11.5px] font-semibold tracking-[.04em] text-[#667494]">SKILLS</span>
          {SKILLS.map((k) => {
            const on = onPractice && S.pt === k.pt;
            return (
              <button
                key={k.title}
                onClick={k.pt === 3 ? openReading : openWriting}
                className={cn("flex h-11 cursor-pointer items-center gap-3 rounded-[10px] border-0 px-3 text-left text-[14.5px] font-medium hover:bg-[#090d15]", on ? "bg-[#0e2417] text-[#eaeef7]" : "bg-transparent text-[#94a3c0]")}
              >
                <k.icon size={18} />{k.title}
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex flex-col gap-[10px] rounded-[16px] border border-[#182033] bg-[#0a0e16] p-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
            <div className="flex items-baseline justify-between"><span className="text-[13px] font-semibold">Today</span><span className="font-mono text-[12px] text-[#94a3c0]">{me.today} / {me.goal} min</span></div>
            <div className="h-[5px] overflow-hidden rounded-full bg-[#131b2a]"><div className="h-full rounded-full bg-[#1d8a50]" style={{ width: Math.min(100, (me.today / me.goal) * 100) + "%" }} /></div>
            <span className="flex items-center gap-[6px] text-[12px] text-[#94a3c0]"><Flame size={12} className="text-[#ffb38f]" />{me.streak} day streak</span>
          </div>
          <div className="flex items-center gap-[10px] p-2">
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-[#ffb38f] text-[14px] font-semibold text-[#2a1206]">{me.initial}</span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[14px] font-semibold">{me.name}</span>
              <span className="truncate text-[12px] text-[#94a3c0]">Level {me.level} · {me.nativeName} to English</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1">{children}</main>

      <nav className={cn("h-[76px] flex-none border-t border-[#121a29] bg-[rgba(6,9,14,.94)] px-2 pb-[18px] pt-[6px] backdrop-blur-[16px] dk:hidden", hideTabs ? "hidden" : "flex")}>
        {TABS.map(([Icon, label, href]) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={cn("flex flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-0 bg-transparent text-[11px] font-medium", active(href) ? "text-[#eaeef7]" : "text-[#94a3c0]")}
          >
            <span className={cn("flex h-7 w-[52px] items-center justify-center rounded-full text-[18px] transition-[background] duration-150", active(href) ? "bg-[#0e2417]" : "bg-transparent")}><Icon size={18} /></span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Scroll column used by Home / Explore / Practice / Profile (prototype homePad / homeMax).
export const pageCol = "min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden w-full mx-auto px-5 pt-3 pb-5 dk:max-w-[1120px] dk:px-12 dk:pt-10 dk:pb-12 animate-[lgup_.25s_ease-out]";

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Flame, Layers, MessageCircle } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RECS, SKILLS, WEAK, levelName } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { pageCol } from "./app-shell";
import { useUpcoming } from "./practice";
import { useLingov } from "./store";
import { Pic, card, h2, levelPill, tile, track, btnOutline } from "./ui";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

export function Home() {
  const router = useRouter();
  const { me, set, chats, goChat, openReading, openWriting } = useLingov();
  const current = chats?.find((c) => !c.completed);
  const left = Math.max(0, me.goal - me.today);
  const up = useUpcoming();
  const toPractice = (pt: number) => () => set({ pt });

  return (
    <div className={cn(pageCol, "flex flex-col content-start gap-[22px] dk:grid dk:grid-cols-6 dk:gap-5")}>
      <div className="col-span-full flex flex-none items-center gap-3">
        <button onClick={() => router.push("/dashboard/profile")} aria-label="Profile" className="size-11 flex-none cursor-pointer rounded-full border-0 bg-[#EDBF73] text-[16px] font-bold text-[#2A1800]"><Pic image={me.image} initial={me.initial} /></button>
        <div className="flex flex-1 flex-col">
          <span suppressHydrationWarning className="text-[13px] text-[#A3ABA7]">{greeting()}</span>
          <span className="text-[19px] font-bold tracking-[-.01em]">Hi {me.name}</span>
        </div>
        <span className="flex h-[34px] items-center gap-[6px] rounded-full bg-[#212524] px-[11px] text-[14px] font-bold tabular-nums"><Flame size={14} className="text-[#EDBF73]" />{me.streak}</span>
        <span className="flex h-[34px] items-center gap-[6px] rounded-full bg-[#212524] px-[11px] text-[13px] font-bold text-[#52C79A]">Lv {me.level}</span>
      </div>

      <div className="order-1 flex flex-none items-center gap-4 rounded-[22px] border border-[#212524] bg-[#171A19] p-4 dk:col-span-3">
        <div className="relative size-[84px] flex-none">
          <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
            <circle cx="42" cy="42" r="35" fill="none" stroke="#2A2F2D" strokeWidth="8" />
            <circle cx="42" cy="42" r="35" fill="none" stroke="#52C79A" strokeWidth="8" strokeLinecap="round" strokeDasharray="220" strokeDashoffset={Math.round(220 * (1 - Math.min(1, me.today / me.goal)))} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[20px] font-bold leading-none">{me.today}</span><span className="text-[11px] text-[#A3ABA7]">of {me.goal} min</span></div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[15px] font-bold">Daily goal</span>
          <span className="text-[13px] leading-[1.4] text-[#A3ABA7]">{left ? `${left} more ${left === 1 ? "minute" : "minutes"} keeps your ${me.streak} day streak.` : `Daily goal done. Your ${me.streak} day streak is safe.`}</span>
          <div className="flex flex-col gap-[5px]">
            <div className={track}><div className="h-full rounded-full bg-[#52C79A]" style={{ width: Math.min(100, (me.xp / me.xpNext) * 100) + "%" }} /></div>
            <div className="flex justify-between text-[11.5px] text-[#A3ABA7]"><span>Level {me.level}</span><span className="tabular-nums">{me.xp} / {me.xpNext} XP</span></div>
          </div>
        </div>
      </div>

      <div className="order-2 flex flex-none flex-col gap-[10px] dk:col-span-3">
        <span className={h2}>Continue</span>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar size="xl"><AvatarFallback><MessageCircle size={20} /></AvatarFallback></Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15.5px] font-bold">{current ? current.title : "Start your first mission"}</span>
                <span className="truncate text-[13px] text-muted-foreground">{current ? current.lastText || current.incidentTitle : "Chat with characters in a real situation and learn from your mistakes."}</span>
              </div>
            </div>
            {current && (
              <div className="flex items-center gap-2.5">
                <Progress value={current.total ? (current.done / current.total) * 100 : 0} className="flex-1" />
                <span className="text-[12px] font-medium tabular-nums text-muted-foreground">{current.done}/{current.total} goals</span>
              </div>
            )}
            <Button size="xl" onClick={() => (current ? goChat(current.chatId) : router.push("/dashboard/explore"))}><MessageCircle />{current ? "Continue chat" : "Find a mission"}</Button>
          </CardContent>
        </Card>
      </div>

      {/* dummy: daily challenge has no scenario yet, see REPLACE.md */}
      <div className="order-4 flex flex-none items-center gap-3 rounded-[22px] bg-[#EDBF73] px-4 py-[14px] text-[#2A1800] dk:col-span-3 wd:col-span-2">
        <div className="flex flex-1 flex-col gap-[2px]">
          <span className="text-[11.5px] font-bold tracking-[.04em]">DAILY CHALLENGE</span>
          <span className="text-[15.5px] font-bold">Return a dish to the kitchen</span>
          <span className="text-[12.5px] font-bold">+40 bonus XP · 6 min</span>
        </div>
        <button aria-label="Start challenge" className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-[#2A1800] text-[18px] text-[#EDBF73]"><ArrowRight size={18} /></button>
      </div>

      <div className="order-3 col-span-full flex min-w-0 flex-none flex-col gap-[10px]">
        <div className="flex items-baseline justify-between"><span className={h2}>Recommended for you</span><Link href="/dashboard/explore" className="lg-a text-[13px]">See all</Link></div>
        <div className="-mx-5 flex gap-[10px] overflow-x-auto px-5 pb-1 dk:mx-0 dk:px-0">
          {RECS.map(([Icon, title, level, meta]) => (
            <div key={title} onClick={() => router.push("/dashboard/explore")} className={cn(card, "flex w-[158px] flex-none cursor-pointer flex-col gap-[10px] p-[14px] hover:bg-[#212524] hover:-translate-y-0.5 transition-[background-color,transform] duration-150 ease-out")}>
              <span className={cn(tile, "size-11 rounded-[16px] text-[19px] text-[#F3F6F4]")}><Icon size={19} /></span>
              <span className="min-h-9 text-[14.5px] font-bold leading-[1.25]">{title}</span>
              <div className="flex flex-wrap items-center gap-[6px]"><span className={levelPill}>{levelName(level)}</span><span className="text-[12px] text-[#A3ABA7]">{meta}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-3 col-span-full flex flex-none flex-col gap-[10px]">
        <span className={h2}>Reading and writing</span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[10px]">
          {SKILLS.map((k) => (
            <div key={k.title} onClick={k.pt === 3 ? openReading : openWriting} className={cn(card, "flex cursor-pointer items-center gap-[14px] p-4 hover:bg-[#212524] hover:-translate-y-0.5 transition-[background-color,transform] duration-150 ease-out active:scale-[.99]")}>
              <span className="flex size-12 flex-none items-center justify-center rounded-[14px] text-[21px]" style={{ background: k.bg, color: k.c }}><k.icon size={21} /></span>
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]"><span className="text-[15px] font-bold">{k.title}</span><span className="truncate text-[13px] text-[#A3ABA7]">{k.pt === 3 ? up.reading.sub : up.writing.sub}</span></div>
              <ChevronRight size={18} className="text-[#A3ABA7]" />
            </div>
          ))}
        </div>
      </div>

      <div className="order-5 flex flex-none flex-col gap-[10px] dk:col-span-3 wd:col-span-2">
        <div className="flex items-baseline justify-between"><span className={h2}>Your weak spots</span><Link href="/dashboard/practice" onClick={toPractice(1)} className="lg-a text-[13px]">Practice</Link></div>
        {/* dummy: weak spots, see REPLACE.md */}
        <div className={cn(card, "flex flex-col gap-[14px] p-[14px]")}>
          {WEAK.map((w) => (
            <div key={w.name} className="flex flex-col gap-[6px]">
              <div className="flex justify-between text-[13.5px] font-medium"><span>{w.name}</span><span className="tabular-nums text-[#A3ABA7]">{w.pct}%</span></div>
              <div className={track}><div className="h-full rounded-full bg-[#EDBF73]" style={{ width: w.pct + "%" }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(card, "order-6 flex flex-none items-center gap-3 self-start p-[14px] dk:col-span-full wd:col-span-2")}>
        <span className="flex size-11 flex-none items-center justify-center rounded-[16px] bg-[#212524] text-[20px] text-[#52C79A]"><Layers size={20} /></span>
        <div className="flex flex-1 flex-col"><span className="text-[15px] font-bold">12 words to review</span><span className="text-[12.5px] text-[#A3ABA7]">About 3 minutes</span></div>
        <Link href="/dashboard/practice" onClick={toPractice(0)} className={cn("flex h-9 items-center px-[14px] text-[13.5px]", btnOutline)}>Review</Link>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";

import { signOut } from "@/lib/auth-client";
import { BADGES, STAT_ICONS, WEEK } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { pageCol } from "./app-shell";
import { useLingov } from "./store";
import { Pic, card, h2 } from "./ui";

export function Profile() {
  const router = useRouter();
  const { me } = useLingov();

  const stats = [
    [STAT_ICONS.xp, "#EDBF73", "Total XP", me.xp.toLocaleString("en-US"), true],
    [STAT_ICONS.streak, "#EDBF73", "Streak", me.streak + (me.streak === 1 ? " day" : " days"), true],
    [STAT_ICONS.missions, "#52C79A", "Missions", String(me.missions), false],
    [STAT_ICONS.words, "#52C79A", "Words", String(me.words), false],
  ] as const;
  const settings = [
    ["Native language", me.nativeName],
    ["Level", me.levelName],
    ["Interests", me.interests + " selected"],
    ["Daily goal", me.goal + " min"],
    ["Correction style", me.corr === "end" ? "At the end" : "Instant"],
    ["Theme", "Dark"],
  ];

  async function logOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className={cn(pageCol, "flex flex-col content-start gap-5")}>
      <div className="flex flex-none items-center gap-4">
        <div className="flex size-[72px] flex-none items-center justify-center rounded-full bg-[#EDBF73] text-[28px] font-bold text-[#2A1800]"><Pic image={me.image} initial={me.initial} /></div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-[22px] font-bold tracking-[-.01em]">{me.name}</span>
            {/* "Explorer" title is dummy, see REPLACE.md */}
            <span className="text-[13.5px] text-[#A3ABA7]">Explorer · Level {me.level} · {me.nativeName} to English</span>
          </div>
          <div className="flex max-w-[360px] flex-col gap-[5px]">
            <div className="h-2 overflow-hidden rounded-full bg-[#2A2F2D]"><div className="h-full rounded-full bg-[#52C79A]" style={{ width: Math.min(100, (me.xp / me.xpNext) * 100) + "%" }} /></div>
            <div className="flex justify-between text-[11.5px] text-[#A3ABA7]"><span>Level {me.level + 1} at {me.xpNext} XP</span><span className="tabular-nums">{me.xp} XP</span></div>
          </div>
        </div>
      </div>

      <div className="grid flex-none grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[10px]">
        {stats.map(([Icon, ic, label, value, soft]) => (
          <div key={label} className={cn(soft ? "rounded-[16px] bg-[rgba(237,191,115,.15)]" : card, "flex flex-col gap-1 p-[14px]")}>
            <span className={cn("flex items-center gap-[6px]", soft ? "text-[11px] font-bold uppercase tracking-[.04em] text-[#EDBF73]" : "text-[12.5px] font-medium text-[#A3ABA7]")}><Icon size={12.5} style={{ color: ic }} />{label}</span>
            <span className="text-[24px] font-bold tracking-[-.01em] tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      {/* dummy: weekly minutes, see REPLACE.md */}
      <div className={cn(card, "flex flex-none flex-col gap-[14px] p-4")}>
        <div className="flex items-baseline justify-between"><span className={h2}>This week</span><span className="text-[12.5px] text-[#A3ABA7]">46 min total</span></div>
        <div className="flex h-24 items-end gap-2">
          {WEEK.map(([d, h], i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-[6px]">
              <span className="w-full rounded-[5px]" style={{ height: h + "%", background: i === 6 ? "#52C79A" : "#2A2F2D" }} />
              <span className="text-[11px] font-medium text-[#A3ABA7]">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-none flex-col gap-[10px]">
        <span className={h2}>Badges</span>
        {/* dummy: badges, see REPLACE.md */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-[10px]">
          {BADGES.map(([Icon, name, on]) => (
            <div key={name} className={cn(card, "flex flex-col items-center gap-2 px-2 py-3 text-center")} style={{ opacity: on ? 1 : 0.45 }}>
              <span className={cn("flex size-11 items-center justify-center rounded-full text-[20px]", "border-[1.5px] bg-[#212524]", on ? "border-[#52C79A] text-[#52C79A]" : "border-[#2A2F2D] text-[#A3ABA7]")}><Icon size={20} /></span>
              <span className="text-[12px] font-medium leading-[1.25]">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-none flex-col gap-[10px]">
        <span className={h2}>Settings</span>
        <div className={cn(card, "overflow-hidden")}>
          {/* dummy: settings rows are read-only, see REPLACE.md */}
          {settings.map(([label, value]) => (
            <div key={label} className="flex min-h-[52px] items-center gap-3 border-b border-[#2A2F2D] px-4">
              <span className="flex-1 text-[14.5px] font-medium">{label}</span>
              <span className="text-[13.5px] text-[#A3ABA7]">{value}</span>
              <ChevronRight size={14.5} className="text-[#A3ABA7]" />
            </div>
          ))}
          <button onClick={logOut} className="flex h-[52px] w-full cursor-pointer items-center gap-[10px] border-0 bg-transparent px-4 text-[14.5px] font-medium text-[#F26B6B] hover:bg-[#212524]"><LogOut size={14.5} />Log out</button>
        </div>
      </div>
    </div>
  );
}

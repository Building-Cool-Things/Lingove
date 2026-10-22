"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";

import { signOut } from "@/lib/auth-client";
import { BADGES, STAT_ICONS, WEEK } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { pageCol } from "./app-shell";
import { useLingov } from "./store";
import { card, h2 } from "./ui";

export function Profile() {
  const router = useRouter();
  const { me } = useLingov();

  const stats = [
    [STAT_ICONS.xp, "#ffb38f", "Total XP", me.xp.toLocaleString("en-US")],
    [STAT_ICONS.streak, "#ffb38f", "Streak", me.streak + (me.streak === 1 ? " day" : " days")],
    [STAT_ICONS.missions, "#7fe3a8", "Missions", String(me.missions)],
    [STAT_ICONS.words, "#7fe3a8", "Words", String(me.words)],
  ] as const;
  const settings = [
    ["Native language", me.nativeName],
    ["Level", me.levelCode + " " + me.levelName],
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
        <div className="flex size-[72px] flex-none items-center justify-center rounded-full bg-[#ffb38f] text-[28px] font-semibold text-[#2a1206]">{me.initial}</div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-[22px] font-semibold tracking-[-.02em]">{me.name}</span>
            {/* "Explorer" title is dummy, see REPLACE.md */}
            <span className="text-[13.5px] text-[#94a3c0]">Explorer · Level {me.level} · {me.nativeName} to English</span>
          </div>
          <div className="flex max-w-[360px] flex-col gap-[5px]">
            <div className="h-[5px] overflow-hidden rounded-full bg-[#131b2a]"><div className="h-full rounded-full bg-[#7fe3a8]" style={{ width: Math.min(100, (me.xp / me.xpNext) * 100) + "%" }} /></div>
            <div className="flex justify-between text-[11.5px] text-[#94a3c0]"><span>Level {me.level + 1} at {me.xpNext} XP</span><span className="tabular-nums">{me.xp} XP</span></div>
          </div>
        </div>
      </div>

      <div className="grid flex-none grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[10px]">
        {stats.map(([Icon, ic, label, value]) => (
          <div key={label} className={cn(card, "flex flex-col gap-1 p-[14px]")}>
            <span className="flex items-center gap-[6px] text-[12.5px] font-medium text-[#94a3c0]"><Icon size={12.5} style={{ color: ic }} />{label}</span>
            <span className="text-[24px] font-semibold tracking-[-.02em] tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      {/* dummy: weekly minutes, see REPLACE.md */}
      <div className={cn(card, "flex flex-none flex-col gap-[14px] p-4")}>
        <div className="flex items-baseline justify-between"><span className={h2}>This week</span><span className="text-[12.5px] text-[#94a3c0]">46 min total</span></div>
        <div className="flex h-24 items-end gap-2">
          {WEEK.map(([d, h], i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-[6px]">
              <span className="w-full rounded-[5px]" style={{ height: h + "%", background: i === 6 ? "#1d8a50" : "#1f3a63" }} />
              <span className="text-[11px] font-medium text-[#94a3c0]">{d}</span>
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
              <span className={cn("flex size-11 items-center justify-center rounded-full text-[20px]", on ? "bg-[#1d8a50] text-white" : "bg-[#0f1522] text-[#94a3c0]")}><Icon size={20} /></span>
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
            <div key={label} className="flex min-h-[52px] items-center gap-3 border-b border-[#0d1320] px-4">
              <span className="flex-1 text-[14.5px] font-medium">{label}</span>
              <span className="text-[13.5px] text-[#94a3c0]">{value}</span>
              <ChevronRight size={14.5} className="text-[#667494]" />
            </div>
          ))}
          <button onClick={logOut} className="flex h-[52px] w-full cursor-pointer items-center gap-[10px] border-0 bg-transparent px-4 text-[14.5px] font-medium text-[#ea7a4f] hover:bg-[#0f1522]"><LogOut size={14.5} />Log out</button>
        </div>
      </div>
    </div>
  );
}

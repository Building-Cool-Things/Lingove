"use client";

import { useEffect } from "react";
import { ArrowRight, Bookmark, MessageCircle, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { norm } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { pageCol } from "./app-shell";
import { useLingov } from "./store";

export function Explore() {
  const { S, set, scenarios, loadScenarios, startMission, goChat, starting, chatError } = useLingov();
  useEffect(() => { void loadScenarios(); }, [loadScenarios]);

  const q = norm(S.exq);
  const list = (scenarios ?? []).filter((s) => !q || norm(s.title + " " + s.sceneSetup).includes(q));
  const sc = scenarios?.find((s) => s.id === S.scen) ?? null;

  return (
    <>
      <div className={cn(pageCol, "flex flex-col content-start gap-5")}>
        <div className="flex flex-none flex-col gap-3">
          <span className="text-[30px] font-semibold leading-[1.1] tracking-[-.035em]">Explore</span>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={S.exq} onChange={(e) => set({ exq: e.target.value })} placeholder="Search stories" className="pl-10" />
          </div>
        </div>

        <div className="grid flex-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {list.map((s) => (
            <Card key={s.id} interactive onClick={() => set({ scen: s.id })}>
              <CardContent className="flex flex-1 flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Avatar size="lg"><AvatarFallback><MessageCircle size={19} /></AvatarFallback></Avatar>
                  <Button
                    variant="ghost"
                    size="icon-md"
                    aria-label="Save"
                    className={S.saved.includes(s.id) ? "text-primary" : "text-muted-foreground"}
                    onClick={(e) => { e.stopPropagation(); set((st) => ({ saved: st.saved.includes(s.id) ? st.saved.filter((x) => x !== s.id) : [...st.saved, s.id] })); }}
                  >
                    <Bookmark size={17} />
                  </Button>
                </div>
                <span className="text-[15px] font-semibold leading-tight">{s.title}</span>
                <span className="line-clamp-3 text-[13px] leading-[1.4] text-muted-foreground">{s.sceneSetup}</span>
                <div className="mt-auto flex items-center gap-2">
                  <Badge variant="secondary">{s.incidentCount} scenes</Badge>
                  {s.progressId && <span className="text-[12px] text-muted-foreground">Started</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {scenarios && !list.length && <span className="text-[14px] text-muted-foreground">{scenarios.length ? "No stories match. Try another word." : "No stories are published yet."}</span>}
        {!scenarios && <span className="text-[14px] text-muted-foreground">Loading stories…</span>}
      </div>

      <Sheet open={sc != null} onOpenChange={(o) => { if (!o) set({ scen: null }); }}>
        <SheetContent>
          {sc && (
            <>
              <div className="flex flex-none items-center gap-3.5">
                <Avatar size="2xl"><AvatarFallback><MessageCircle size={24} /></AvatarFallback></Avatar>
                <div className="flex flex-col gap-1">
                  <SheetTitle className="text-[20px] leading-tight tracking-[-.02em]">{sc.title}</SheetTitle>
                  <span className="text-[12.5px] text-muted-foreground">{sc.incidentCount} scenes · chat in your own words</span>
                </div>
              </div>
              <SheetDescription className="flex-none text-[14.5px] leading-normal text-[#c5cee0]">{sc.sceneSetup}</SheetDescription>
              <div className="flex flex-none flex-col gap-2">
                <span className="text-[11.5px] font-semibold tracking-[.04em] text-muted-foreground">FIRST SCENE GOALS</span>
                {sc.firstGoals.map((g) => <div key={g} className="flex items-center gap-2.5 text-[14px] font-semibold"><span className="size-5 flex-none rounded-full border-[1.5px] border-[#4f6085]" />{g}</div>)}
              </div>
              {chatError && <span className="text-[12.5px] text-destructive">{chatError}</span>}
              <Button
                size="2xl"
                disabled={starting === sc.id}
                onClick={() => { if (sc.progressId) { set({ scen: null }); goChat(sc.progressId); } else void startMission(sc.id).then((ok) => { if (ok) set({ scen: null }); }); }}
              >
                {starting === sc.id ? "Preparing your mission…" : sc.progressId ? "Continue mission" : "Start mission"}<ArrowRight />
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

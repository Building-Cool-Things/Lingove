"use client";

// Chats: list of missions, the conversation, the guide, end-of-scene feedback and a context panel.
// All data comes from useChatState (see chat-state.ts). All controls are shadcn components from
// components/ui, so the look is changed there and not in this file.
import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCheck, Languages, Lightbulb, MessageCircle, Pencil, Plus, Search, SendHorizontal, Target } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeedbackView, MessageView, MistakeView, ThreadView } from "@/lib/chat/types";

import { useLingov } from "./store";
import { caps } from "./ui";

const FILTERS = ["All", "In progress", "Completed"];

const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
// Today shows the time, older chats show the day.
const when = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? clock(iso) : d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
};

// What the tip sheet shows: the sentence split around the wrong words.
type Tip = { pre: string; wrong: string; right: string; post: string; why: string; whyNative?: string; label: string };
function toTip(text: string, m: MistakeView): Tip {
  const at = text.toLowerCase().indexOf(m.wrong.toLowerCase());
  return {
    pre: text.slice(0, at), wrong: text.slice(at, at + m.wrong.length), right: m.right, post: text.slice(at + m.wrong.length),
    why: m.why, whyNative: m.whyNative, label: m.topicTitles.join(" · ") || m.category.replace("_", " "),
  };
}

export function Chats() {
  const { S, set, me, chats, thread, activeId, waiting, chatError, openChat, closeChat, send, ask, nextMission, translate } = useLingov();
  const router = useRouter();
  const open = activeId != null;
  const q = S.cq.trim().toLowerCase();

  const [draft, setDraft] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [seenNote, setSeenNote] = useState("");
  const [question, setQuestion] = useState("");
  const [shown, setShown] = useState<string[]>([]); // message ids whose translation is visible
  const [sheet, setSheet] = useState<Tip | null>(null);

  const scRef = useRef<HTMLDivElement>(null);
  const lastH = useRef(0);
  useLayoutEffect(() => {
    const el = scRef.current;
    if (el && el.scrollHeight !== lastH.current) { lastH.current = el.scrollHeight; el.scrollTop = el.scrollHeight; }
  });

  const rows = (chats ?? []).filter((c) => (S.cf === "All" || (S.cf === "Completed") === c.completed) && (!q || (c.title + " " + c.incidentTitle).toLowerCase().includes(q)));
  const nextGoal = thread?.milestones.find((m) => !m.done);
  const doneCount = thread?.milestones.filter((m) => m.done).length ?? 0;
  const tipCount = thread?.messages.reduce((n, m) => n + m.mistakes.length, 0) ?? 0;
  const noteIsNew = !!thread?.guideNote && !guideOpen && thread.guideNote !== seenNote;

  const submit = () => {
    const text = draft.trim();
    if (!text || waiting) return;
    setDraft("");
    setGuideOpen(false);
    void send(text).then((ok) => { if (!ok) setDraft(text); });
  };
  const submitQuestion = () => {
    const text = question.trim();
    if (!text || waiting) return;
    void ask(text).then((ok) => { if (ok) setQuestion(""); });
  };
  const toggleGuide = () => { if (thread) setSeenNote(thread.guideNote); setGuideOpen((o) => !o); };
  const toggleTranslation = (m: MessageView) => {
    if (!m.translation) void translate(m.id);
    setShown((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]));
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      {/* LIST */}
      <div className={`${open ? "hidden dk:flex" : "flex"} min-h-0 min-w-0 flex-1 flex-col dk:flex-[0_0_340px] dk:border-r dk:border-border`}>
        <div className="flex flex-none flex-col gap-3 px-5 pb-2 pt-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[24px] font-semibold tracking-[-.02em]">Chats</span>
            <Button size="icon-md" onClick={() => router.push("/dashboard/explore")} aria-label="New mission"><Plus size={18} /></Button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input size="pill" value={S.cq} onChange={(e) => set({ cq: e.target.value })} placeholder="Search chats" className="pl-10" />
          </div>
          <Tabs value={S.cf} onValueChange={(v) => set({ cf: String(v) })}>
            <TabsList variant="pills">{FILTERS.map((l) => <TabsTrigger key={l} value={l}>{l}</TabsTrigger>)}</TabsList>
          </Tabs>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {rows.map((c) => (
            <div key={c.chatId} onClick={() => openChat(c.chatId)} className={`flex flex-none cursor-pointer items-center gap-3 px-5 py-2.5 transition-colors hover:bg-card ${activeId === c.chatId ? "dk:bg-card" : ""}`}>
              <Avatar size="xl"><AvatarFallback><MessageCircle size={21} /></AvatarFallback></Avatar>
              <div className="-mb-2.5 flex min-w-0 flex-1 flex-col gap-[3px] border-b border-border pb-2.5 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[15.5px] font-semibold">{c.title}</span>
                  <span className="flex-none text-[12px] text-muted-foreground">{when(c.lastAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] text-muted-foreground">{c.lastText || c.incidentTitle}</span>
                  {c.total > 0 && <Badge variant={c.completed ? "secondary" : "warm"} className="tabular-nums">{c.completed ? "Done" : c.done + "/" + c.total}</Badge>}
                </div>
              </div>
            </div>
          ))}
          {chats && !rows.length && (
            <div className="flex flex-col items-start gap-3 px-5 py-6">
              <span className="text-[14px] text-muted-foreground">{chats.length ? "No chats found." : "No missions yet. Pick a story in Explore and start chatting."}</span>
              {!chats.length && <Button size="xl" onClick={() => router.push("/dashboard/explore")}>Find a mission</Button>}
            </div>
          )}
        </div>
      </div>

      {/* CONVERSATION */}
      <div className={`${open ? "flex" : "hidden dk:flex"} relative min-h-0 min-w-0 flex-1 flex-col bg-background`} style={{ backgroundImage: "radial-gradient(#0a0f1a 1px,transparent 1px)", backgroundSize: "16px 16px" }}>
        {!open && <div className="m-auto text-[14px] text-muted-foreground">Choose a chat to continue your mission.</div>}
        {open && !thread && (
          <div className="flex flex-1 flex-col">
            <div className="p-3 dk:hidden"><Button variant="ghost" size="icon-md" onClick={closeChat} aria-label="Back"><ArrowLeft size={20} /></Button></div>
            <div className="m-auto px-6 text-center text-[14px] text-muted-foreground">{chatError || "Opening your chat…"}</div>
          </div>
        )}

        {thread && (
          <>
            <div className="flex flex-none flex-col gap-2 border-b border-border bg-background/90 px-3.5 pt-2 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <Button variant="ghost" size="icon-md" onClick={closeChat} aria-label="Back" className="-ml-1.5 dk:hidden"><ArrowLeft size={20} /></Button>
                <Avatar size="lg"><AvatarFallback><MessageCircle size={18} /></AvatarFallback></Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15.5px] font-semibold">{thread.scenarioTitle}</span>
                  <span className="min-h-[17px] truncate text-[12.5px] text-[#7fe3a8]">{waiting ? "typing…" : `${thread.incidentTitle} · ${thread.incidentNumber}/${thread.incidentCount}`}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 pb-2.5">
                <Target size={15} className="flex-none text-accent" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{nextGoal?.goal ?? "All goals done"}</span>
                <div className="flex w-24 flex-none gap-[3px]">
                  {thread.milestones.map((m) => <span key={m.id} className={`h-[5px] flex-1 rounded-full ${m.done ? "bg-[#7fe3a8]" : "bg-muted"}`} />)}
                </div>
                <span className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">{doneCount + "/" + thread.milestones.length}</span>
              </div>
            </div>

            <div ref={scRef} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden px-3.5 pb-2 pt-3.5">
              {thread.messages.map((m) => {
                const mine = m.senderType === "user", showTr = shown.includes(m.id), first = m.mistakes[0];
                return (
                  <div key={m.id} className={`flex animate-[lgup_.2s_ease-out] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                    {!mine && <span className="px-1 text-[12px] font-semibold text-muted-foreground">{m.senderName}</span>}
                    <div className={`max-w-[min(78%,460px)] px-3.25 pb-1.5 pt-2.25 text-[15.5px] leading-[1.4] shadow-[0_1px_1px_rgba(0,0,0,.25)] [text-wrap:pretty] ${mine ? "rounded-[16px_4px_16px_16px] bg-[linear-gradient(180deg,#22975a,#1a7f49)] text-white" : "rounded-[4px_16px_16px_16px] bg-muted text-foreground"}`}>
                      <span>{m.text}</span>
                      {showTr && <div className="mt-1.5 border-t border-white/15 pt-1.5 text-[14px] text-muted-foreground">{m.translation ?? "Translating…"}</div>}
                      <div className={`mt-0.5 flex items-center justify-end gap-1.5 text-[10.5px] ${mine ? "text-[#c9ecd9]" : "text-muted-foreground"}`}>
                        {!mine && <Button variant="link" size="xs" onClick={() => toggleTranslation(m)} aria-label="Translate" className="mr-auto h-auto p-0 text-[11.5px]"><Languages />{showTr ? "Hide" : "Translate"}</Button>}
                        {clock(m.at)}
                        {mine && <CheckCheck size={13} />}
                      </div>
                    </div>
                    {mine && first && me.corr === "instant" && (
                      <Button variant="warm" size="chip" onClick={() => setSheet(toTip(m.text, first))}><Pencil />{m.mistakes.length === 1 ? "1 tip" : m.mistakes.length + " tips"}</Button>
                    )}
                  </div>
                );
              })}
              {waiting && (
                <div className="flex gap-1 self-start rounded-[4px_16px_16px_16px] border border-border bg-muted px-3.5 py-3">
                  {[0, 0.15, 0.3].map((d) => <span key={d} className="size-[7px] rounded-full bg-muted-foreground" style={{ animation: `lgdot 1s ${d}s infinite` }} />)}
                </div>
              )}
              {thread.status === "completed" && thread.feedback && <FeedbackCard fb={thread.feedback} thread={thread} waiting={waiting} onNext={() => void nextMission()} onLeave={closeChat} onPractice={() => { set({ pt: 2 }); router.push("/dashboard/practice"); }} />}
            </div>

            {chatError && <div className="flex-none px-3.5 pb-1 text-[12.5px] text-destructive">{chatError}</div>}

            {guideOpen && thread.status === "in_progress" && (
              <Card size="sm" className="mx-3.5 mb-2 flex-none animate-[lgup_.2s_ease-out]">
                <CardContent className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[12.5px] font-semibold text-accent"><Lightbulb size={14} />{thread.guideName} · your guide</span>
                  <span className="text-[14px] leading-[1.45]">{thread.guideNote || "Say hello and see how the people react."}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      size="sm"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); submitQuestion(); } }}
                      placeholder={`Ask ${thread.guideName}…`}
                      maxLength={300}
                      className="flex-1"
                    />
                    <Button size="icon-round" onClick={submitQuestion} disabled={!question.trim() || waiting} aria-label="Ask the guide"><SendHorizontal size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {thread.status === "in_progress" && (
              <div className="flex flex-none items-center gap-2 bg-background px-3 pb-[26px] pt-2 dk:pb-3.5">
                <Button variant={guideOpen ? "warm" : "ghost"} size="icon-round" onClick={toggleGuide} aria-label="Guide" className="relative text-accent">
                  <Lightbulb size={19} />
                  {noteIsNew && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-accent" />}
                </Button>
                <Input
                  size="pill"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
                  placeholder="Type a message"
                  maxLength={500}
                  className="flex-1"
                />
                <Button size="icon-round" onClick={submit} disabled={!draft.trim() || waiting} aria-label="Send"><SendHorizontal size={18} /></Button>
              </div>
            )}
          </>
        )}

        <Sheet open={sheet != null} onOpenChange={(o) => { if (!o) setSheet(null); }}>
          <SheetContent>
            {sheet && (
              <>
                <div className="flex items-center gap-2">
                  <SheetTitle className="flex-1">Tip</SheetTitle>
                  <Badge variant="warm">{sheet.label}</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-[3px]">
                    <span className={caps}>YOU WROTE</span>
                    <span className="text-[16px] text-muted-foreground">{sheet.pre}<span className="text-foreground line-through decoration-accent">{sheet.wrong}</span>{sheet.post}</span>
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <span className={caps}>BETTER</span>
                    <span className="text-[16px] text-muted-foreground">{sheet.pre}<b className="text-[#7fe3a8]">{sheet.right}</b>{sheet.post}</span>
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <span className={caps}>WHY</span>
                    <span className="text-[14.5px] leading-normal">{sheet.why}</span>
                    {sheet.whyNative && <span className="text-[14px] leading-normal text-muted-foreground">{sheet.whyNative}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="xl" className="flex-1" onClick={() => setSheet(null)}>Got it</Button>
                  {/* dummy: see REPLACE.md */}
                  <Button size="xl" variant="outline" className="flex-1" onClick={() => setSheet(null)}>Save to practice</Button>
                </div>
                <Button variant="link" className="self-center" onClick={() => { setSheet(null); set({ pt: 2 }); router.push("/dashboard/practice"); }}>Practice now<ArrowRight /></Button>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* CONTEXT PANEL (≥1240px) */}
      <div className="hidden min-h-0 w-[300px] flex-none flex-col gap-6 overflow-y-auto border-l border-border bg-[#06090e] px-5 py-6 xw:flex">
        {thread ? (
          <>
            <div className="flex flex-col items-center gap-2.5 pt-2 text-center">
              <Avatar size="2xl"><AvatarFallback><MessageCircle size={28} /></AvatarFallback></Avatar>
              <div className="flex flex-col gap-0.5">
                <span className="text-[16px] font-semibold">{thread.incidentTitle}</span>
                <span className="text-[13px] text-muted-foreground">{thread.scenarioTitle}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className={caps}>MISSION GOALS</span>
                <span className="font-mono text-[12px] text-muted-foreground">{doneCount + "/" + thread.milestones.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {thread.milestones.map((m) => (
                  <div key={m.id} className={`flex items-start gap-2.5 text-[14px] leading-[1.4] ${m.done ? "text-muted-foreground" : "text-foreground"}`}>
                    <span className={`mt-px flex size-5 flex-none items-center justify-center rounded-full border-[1.5px] border-solid text-white ${m.done ? "border-primary bg-primary" : "border-[#2a3550]"}`}>{m.done && <Check size={12} />}</span>
                    {m.goal}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <span className={caps}>IN THIS SCENE</span>
              <div className="flex flex-col gap-2">
                {thread.characters.map((c) => (
                  <div key={c.id} className="flex flex-col text-[14px]"><span className="font-semibold">{c.name}</span><span className="text-[12.5px] text-muted-foreground">{c.role}</span></div>
                ))}
              </div>
            </div>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 text-[13px] font-semibold"><Pencil size={13} className="text-accent" />{(tipCount || "No") + (tipCount === 1 ? " tip" : " tips") + " in this chat"}</span>
                <span className="text-[13px] leading-normal text-muted-foreground">{me.corr === "instant" ? "Tap a tip under your message to see the correction and why." : "Your tips will be in the summary at the end of the scene."}</span>
              </CardContent>
            </Card>
          </>
        ) : <span className="text-[13px] text-muted-foreground">Your mission goals show here.</span>}
      </div>
    </div>
  );
}

// Shown at the end of a scene: the numbers we counted plus the teacher's short summary.
function FeedbackCard({ fb, thread, waiting, onNext, onLeave, onPractice }: { fb: FeedbackView; thread: ThreadView; waiting: boolean; onNext: () => void; onLeave: () => void; onPractice: () => void }) {
  return (
    <Card className="my-3 flex-none border-primary/30">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11.5px] font-semibold tracking-[.04em] text-[#7fe3a8]">{fb.allGoalsDone ? "SCENE COMPLETE" : "SCENE ENDED"}</span>
          <span className="text-[14.5px] leading-normal">{fb.summary}</span>
          <span className="text-[12.5px] text-muted-foreground">{fb.messages} messages · {fb.mistakes === 0 ? "no mistakes" : fb.mistakes + (fb.mistakes === 1 ? " mistake" : " mistakes")}</span>
        </div>
        {fb.topics.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className={caps}>GRAMMAR TO REVIEW</span>
            <div className="flex flex-wrap gap-1.5">{fb.topics.map((t) => <Badge key={t.slug} variant="outline">{t.title} · {t.count}</Badge>)}</div>
          </div>
        )}
        {fb.examples.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className={caps}>YOUR CORRECTIONS</span>
            {fb.examples.map((e, i) => <span key={i} className="text-[14px] leading-[1.4]"><span className="text-muted-foreground line-through decoration-accent">{e.wrong}</span> → <b className="text-[#7fe3a8]">{e.right}</b></span>)}
          </div>
        )}
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-[13.5px] text-muted-foreground">{thread.guideName}: {thread.hasNext ? "Ready for the next scene, or shall we continue tomorrow?" : "That was the last scene of this story. Well done!"}</span>
          <div className="flex gap-2">
            {thread.hasNext && <Button size="xl" className="flex-1" onClick={onNext} disabled={waiting}>{waiting ? "Preparing…" : "Next scene"}<ArrowRight /></Button>}
            <Button size="xl" variant="outline" className="flex-1" onClick={onLeave}>{thread.hasNext ? "Tomorrow" : "Back to chats"}</Button>
          </div>
          {fb.topics.length > 0 && <Button variant="link" className="self-center" onClick={onPractice}>Practise these topics<ArrowRight /></Button>}
        </div>
      </CardContent>
    </Card>
  );
}

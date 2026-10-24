"use client";

// Chats: list of missions, the conversation, the guide, end-of-scene feedback and a context panel.
// All data comes from useChatState (see chat-state.ts). All controls are shadcn components from
// components/ui, so the look is changed there and not in this file.
import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCheck, Languages, Lightbulb, ListChecks, MessageCircle, Pencil, Plus, Search, SendHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChallengeView, FeedbackView, MessageView, MistakeView, ThreadView } from "@/lib/chat/types";

import { useLingov } from "./store";
import { caps, Confetti } from "./ui";

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
  const [sheet, setSheet] = useState<Tip[] | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false); // popup with every challenge and its goals

  const scRef = useRef<HTMLDivElement>(null);
  const lastH = useRef(0);
  useLayoutEffect(() => {
    const el = scRef.current;
    if (el && el.scrollHeight !== lastH.current) { lastH.current = el.scrollHeight; el.scrollTop = el.scrollHeight; }
  });

  const rows = (chats ?? []).filter((c) => (S.cf === "All" || (S.cf === "Completed") === c.completed) && (!q || (c.title + " " + c.incidentTitle).toLowerCase().includes(q)));
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
            <span className="text-[24px] font-bold tracking-[-.01em]">Chats</span>
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
                  <span className="truncate text-[15.5px] font-bold">{c.title}</span>
                  <span className="flex-none text-[12px] text-muted-foreground">{when(c.lastAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] text-muted-foreground">{c.lastText || c.incidentTitle}</span>
                </div>
              </div>
            </div>
          ))}
          {chats && !rows.length && (
            <div className="flex flex-col items-start gap-3 px-5 py-6">
              <span className="text-[14px] text-muted-foreground">{chats.length ? "No chats found." : "No missions yet. Pick a situation in Explore and start chatting."}</span>
              {!chats.length && <Button size="xl" onClick={() => router.push("/dashboard/explore")}>Find a mission</Button>}
            </div>
          )}
        </div>
      </div>

      {/* CONVERSATION */}
      <div className={`${open ? "flex" : "hidden dk:flex"} relative min-h-0 min-w-0 flex-1 flex-col bg-background`}>
        {!open && <div className="m-auto text-[14px] text-muted-foreground">Choose a chat to continue your mission.</div>}
        {open && !thread && (
          <div className="flex flex-1 flex-col">
            <div className="p-3 dk:hidden"><Button variant="ghost" size="icon-md" onClick={closeChat} aria-label="Back"><ArrowLeft size={20} /></Button></div>
            <div className="m-auto px-6 text-center text-[14px] text-muted-foreground">{chatError || "Opening your chat…"}</div>
          </div>
        )}

        {thread && (
          <>
            <div className="flex flex-none flex-col gap-2 border-b border-border bg-background px-3.5 py-2">
              <div className="flex items-center gap-2.5">
                <Button variant="ghost" size="icon-md" onClick={closeChat} aria-label="Back" className="-ml-1.5 dk:hidden"><ArrowLeft size={20} /></Button>
                <Avatar size="lg"><AvatarFallback><MessageCircle size={18} /></AvatarFallback></Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15.5px] font-bold">{thread.scenarioTitle}</span>
                  <span className="min-h-[17px] truncate text-[12.5px] text-[#52C79A]">{waiting ? "typing…" : `${thread.incidentTitle} · ${thread.incidentNumber}/${thread.incidentCount}`}</span>
                </div>
                <Button variant="soft" size="chip" onClick={() => setGoalsOpen(true)} aria-label="All challenges and goals"><ListChecks size={14} />Goals</Button>
              </div>
            </div>

            <div ref={scRef} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden px-3.5 pb-2 pt-3.5">
              {thread.messages.map((m) => {
                if (m.senderType === "system") return (
                  <div key={m.id} className="my-3 flex flex-col items-center gap-1 text-center">
                    <span className="flex w-full items-center gap-3 text-[11.5px] font-bold uppercase tracking-wide text-[#52C79A]">
                      <span className="h-px flex-1 bg-border" />Challenge complete<span className="h-px flex-1 bg-border" />
                    </span>
                    <span className="text-[13px] font-bold">{m.senderName}</span>
                    <span className="max-w-[min(85%,420px)] text-[13px] leading-[1.4] text-muted-foreground">{m.text}</span>
                  </div>
                );
                const mine = m.senderType === "user", showTr = shown.includes(m.id), first = m.mistakes[0];
                return (
                  <div key={m.id} className={`flex animate-[lgup_.2s_ease-out] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                    {!mine && <span className="px-1 text-[12px] font-bold text-muted-foreground">{m.senderName}</span>}
                    <div className={`max-w-[min(78%,460px)] px-3.25 pb-1.5 pt-2.25 text-[15.5px] leading-[1.4] [text-wrap:pretty] ${mine ? "rounded-[24px_8px_24px_24px] bg-[#52C79A] text-[#052013]" : "rounded-[8px_24px_24px_24px] border border-border bg-card text-foreground"}`}>
                      <span>{m.text}</span>
                      {showTr && <div className="mt-1.5 border-t border-current/20 pt-1.5 text-[14px] text-muted-foreground">{m.translation ?? "Translating…"}</div>}
                      <div className={`mt-0.5 flex items-center justify-end gap-1.5 text-[10.5px] ${mine ? "text-[#052013]/70" : "text-muted-foreground"}`}>
                        {!mine && <Button variant="ghost" size="xs" onClick={() => toggleTranslation(m)} aria-label="Translate" className="mr-auto h-auto p-0 text-[11.5px]"><Languages />{showTr ? "Hide" : "Translate"}</Button>}
                        {clock(m.at)}
                        {mine && <CheckCheck size={13} />}
                      </div>
                    </div>
                    {mine && first && me.corr === "instant" && (
                      <Button variant="warm" size="chip" onClick={() => setSheet(m.mistakes.map((x) => toTip(m.text, x)))}><Pencil />{m.mistakes.length === 1 ? "1 tip" : m.mistakes.length + " tips"}</Button>
                    )}
                  </div>
                );
              })}
              {waiting && (
                <div className="flex gap-1 self-start rounded-[8px_24px_24px_24px] border border-border bg-card px-3.5 py-3">
                  {[0, 0.15, 0.3].map((d) => <span key={d} className="size-[7px] rounded-full bg-muted-foreground" style={{ animation: `lgdot 1s ${d}s infinite` }} />)}
                </div>
              )}
              {thread.status === "completed" && thread.feedback && <FeedbackCard fb={thread.feedback} thread={thread} waiting={waiting} onNext={() => void nextMission()} onLeave={closeChat} onPractice={() => { set({ pt: 2 }); router.push("/dashboard/practice"); }} />}
            </div>

            {chatError && <div className="flex-none px-3.5 pb-1 text-[12.5px] text-destructive">{chatError}</div>}

            {guideOpen && thread.status === "in_progress" && (
              <Card size="sm" className="mx-3.5 mb-2 flex-none animate-[lgup_.2s_ease-out]">
                <CardContent className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[12.5px] font-bold text-accent"><Lightbulb size={14} />{thread.guideName} · your guide</span>
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

        <Sheet open={goalsOpen} onOpenChange={setGoalsOpen}>
          <SheetContent>
            <SheetTitle>Challenges and goals</SheetTitle>
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">{thread && <ChallengeList challenges={thread.challenges} />}</div>
            <Button size="xl" onClick={() => setGoalsOpen(false)}>Close</Button>
          </SheetContent>
        </Sheet>

        <Sheet open={sheet != null} onOpenChange={(o) => { if (!o) setSheet(null); }}>
          <SheetContent>
            {sheet && (
              <>
                <SheetTitle>{sheet.length === 1 ? "Tip" : "Tips"}</SheetTitle>
                <div className="flex min-h-0 flex-col gap-5 overflow-y-auto">
                  {sheet.map((t, i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <Badge variant="warm" className="self-start">{t.label}</Badge>
                      <div className="flex flex-col gap-[3px]">
                        <span className={caps}>YOU WROTE</span>
                        <span className="text-[16px] text-muted-foreground">{t.pre}<span className="text-foreground line-through decoration-destructive">{t.wrong}</span>{t.post}</span>
                      </div>
                      <div className="flex flex-col gap-[3px]">
                        <span className={caps}>BETTER</span>
                        <span className="text-[16px] text-muted-foreground">{t.pre}<b className="text-[#52C79A]">{t.right}</b>{t.post}</span>
                      </div>
                      <div className="flex flex-col gap-[3px]">
                        <span className={caps}>WHY</span>
                        <span className="text-[14.5px] leading-normal">{t.why}</span>
                        {t.whyNative && <span className="text-[14px] leading-normal text-muted-foreground">{t.whyNative}</span>}
                      </div>
                    </div>
                  ))}
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
      <div className="hidden min-h-0 w-[300px] flex-none flex-col gap-6 overflow-y-auto border-l border-border bg-[#171A19] px-5 py-6 xw:flex">
        {thread ? (
          <>
            <div className="flex flex-col gap-3">
              <span className={caps}>CURRENT CHALLENGE</span>
              <span className="text-[13px] leading-normal text-muted-foreground">Finish all the goals below in the chat to complete this challenge.</span>
              <Card size="sm">
                <CardContent><ChallengeList challenges={thread.challenges.filter((c) => c.status === "current")} /></CardContent>
              </Card>
              <Button variant="outline" onClick={() => setGoalsOpen(true)}><ListChecks />View all challenges and goals</Button>
            </div>
          </>
        ) : <span className="text-[13px] text-muted-foreground">Your challenges and goals show here.</span>}
      </div>
    </div>
  );
}

// Every challenge of the story, each with its goals. Shared by the side panel and the popup.
function ChallengeList({ challenges }: { challenges: ChallengeView[] }) {
  return (
    <div className="flex flex-col gap-4">
      {challenges.map((c, i) => {
        return (
          <div key={c.id} className={`flex flex-col gap-2.5 ${c.status === "upcoming" ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-2">
              <span className={`flex size-6 flex-none items-center justify-center rounded-full text-[11.5px] font-bold ${c.status === "done" ? "bg-primary text-[#052013]" : c.status === "current" ? "border-[1.5px] border-primary text-primary" : "border-[1.5px] border-[#2A2F2D] text-muted-foreground"}`}>{c.status === "done" ? <Check size={13} /> : i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{c.title}</span>
              {c.status === "current" && <Badge variant="secondary">Now</Badge>}
            </div>
            <div className="flex flex-col gap-2 pl-8">
              {c.goals.map((g) => (
                <div key={g.id} className={`flex items-start gap-2.5 text-[13.5px] leading-[1.4] ${g.done ? "text-muted-foreground" : "text-foreground"}`}>
                  <span className={`mt-px flex size-[18px] flex-none items-center justify-center rounded-full border-[1.5px] border-solid text-[#052013] ${g.done ? "border-primary bg-primary" : "border-[#2A2F2D]"}`}>{g.done && <Check size={11} />}</span>
                  {g.goal}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Shown at the end of a scene: the numbers we counted plus the teacher's short summary.
function FeedbackCard({ fb, thread, waiting, onNext, onLeave, onPractice }: { fb: FeedbackView; thread: ThreadView; waiting: boolean; onNext: () => void; onLeave: () => void; onPractice: () => void }) {
  return (
    <Card className="relative my-3 flex-none overflow-visible border-primary/30">
      {fb.allGoalsDone && <Confetti />}
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11.5px] font-bold tracking-[.04em] text-[#52C79A]">{fb.allGoalsDone ? "CHALLENGE COMPLETE" : "CHALLENGE ENDED"}</span>
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
            {fb.examples.map((e, i) => <span key={i} className="text-[14px] leading-[1.4]"><span className="text-muted-foreground line-through decoration-destructive">{e.wrong}</span> → <b className="text-[#52C79A]">{e.right}</b></span>)}
          </div>
        )}
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-[13.5px] text-muted-foreground">{thread.guideName}: {thread.hasNext ? "Ready for the next challenge, or shall we continue tomorrow?" : "That was the last challenge of this situation. Well done!"}</span>
          <div className="flex gap-2">
            {thread.hasNext && <Button size="xl" className="flex-1" onClick={onNext} disabled={waiting}>{waiting ? "Preparing…" : "Next challenge"}<ArrowRight /></Button>}
            <Button size="xl" variant="outline" className="flex-1" onClick={onLeave}>{thread.hasNext ? "Tomorrow" : "Back to chats"}</Button>
          </div>
          {fb.topics.length > 0 && <Button variant="link" className="self-center" onClick={onPractice}>Practise these topics<ArrowRight /></Button>}
        </div>
      </CardContent>
    </Card>
  );
}

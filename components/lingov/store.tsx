"use client";

// One state object for the signed-in app, like the prototype's `Component.state`.
// Lives in app/dashboard/layout.tsx so it survives tab navigation.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { generateReadingTask, submitReadingSession, type ReadingTask, type ReadingView } from "@/app/actions/reading";
import { generateWritingQuestion, submitWritingSession, type WritingQuestion, type WritingView } from "@/app/actions/writing";
import { CONV0, HINTS, LANGS, LEVELS, REPLIES, REPLY_FALLBACK, type Msg, type Tip } from "@/lib/lingov/data";
import type { LingovProfile } from "@/lib/lingov-data";
import { SAMPLE_TASK, demoAnswers, gradeLocal, questionsOf } from "@/lib/lingov/reading";
import { WS0, WS_DRAFT, WS_FIXED, analyse, analyseAI, splitText } from "@/lib/lingov/writing";
import type { Difficulty } from "@/lib/skill-config";

export type State = {
  // chats
  chat: number | null; convs: Record<number, Msg[]>; draft: string; typing: boolean; tr: string[]; sheet: Tip | null;
  hintOpen: boolean; cq: string; cf: string; started: number[]; rec: boolean; recS: number; play: { id: string; p: number } | null;
  // explore
  exq: string; exi: string; saved: number[]; scen: number | null;
  // practice
  pt: number; fcI: number; fcFlip: boolean; exI: number; exSel: number | null; exChecked: boolean;
  // reading session (answers are the backend values: "A".."D" or "True" / "False" / "Not Given")
  rdTask: ReadingTask | null; rdLoad: boolean; rdErr: string; rdT0: number; rdDemo: boolean; rdRes: { view: ReadingView; xp: number } | null;
  rdAns: Record<number, string>; rdSub: boolean; rdChecking: boolean; rdOpen: number | null; rdFocus: number | null; rdW: string | null; rdSaved: string[];
  // writing session
  wsQ: WritingQuestion | null; wsLoad: boolean; wsErr: string; wsDemo: boolean; wsRes: { view: WritingView; xp: number } | null;
  wsText: string; wsDone: boolean; wsChecking: boolean; wsSel: string | null; wsCat: string; wsStart: number | null; wsView: "orig" | "imp";
};

const INITIAL: State = {
  chat: null, convs: CONV0, draft: "", typing: false, tr: [], sheet: null, hintOpen: false, cq: "", cf: "All", started: [], rec: false, recS: 0, play: null,
  exq: "", exi: "All", saved: [], scen: null,
  pt: 0, fcI: 0, fcFlip: false, exI: 0, exSel: null, exChecked: false,
  rdTask: null, rdLoad: false, rdErr: "", rdT0: 0, rdDemo: false, rdRes: null,
  rdAns: {}, rdSub: false, rdChecking: false, rdOpen: null, rdFocus: null, rdW: null, rdSaved: [],
  wsQ: null, wsLoad: false, wsErr: "", wsDemo: false, wsRes: null,
  wsText: "", wsDone: false, wsChecking: false, wsSel: null, wsCat: "All", wsStart: null, wsView: "orig",
};

type Patch = Partial<State> | ((s: State) => Partial<State> | null);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STORE_KEY = "lingov.sessions";

// Prototype writing prompt, used by the ?demo= links.
const SAMPLE_Q: WritingQuestion = {
  title: "Is a four-day work week a good idea?", topic: "Work", description: "", type: "ESSAY", promptType: "TEXT", difficulty: "MEDIUM",
  prompt: "Many companies are now trying a four-day work week. Do you think it is a good idea? Give your opinion, explain your reasons and include an example from your own life.",
  minWords: 100, recommendedWords: 120, maxWords: 150, tips: [], level: "B1", targetWords: "100-150 words",
};

// Prototype `?demo=` states for the two sessions.
const DEMO_ANS = demoAnswers({ 0: 1, 1: 2, 2: 2, 3: 0, 4: 0 });
const demoRes = () => { const view = gradeLocal(SAMPLE_TASK, DEMO_ANS, 372); return { view, xp: view.correctCount * 10 }; };
const RD_DEMO: Partial<State> = { rdTask: SAMPLE_TASK, rdDemo: true, rdLoad: false, rdErr: "", rdT0: Date.now() };
const WS_DEMO: Partial<State> = { wsQ: SAMPLE_Q, wsDemo: true, wsLoad: false, wsErr: "", wsRes: null };
const DEMOS: Record<string, () => Partial<State>> = {
  "read-start": () => RD_DEMO, "read-word": () => ({ ...RD_DEMO, rdAns: demoAnswers({ 0: 1, 1: 2 }), rdW: "productivity", rdFocus: 1 }),
  "read-ready": () => ({ ...RD_DEMO, rdAns: DEMO_ANS }), "read-checking": () => ({ ...RD_DEMO, rdAns: DEMO_ANS, rdChecking: true }),
  "read-results": () => ({ ...RD_DEMO, rdAns: DEMO_ANS, rdSub: true, rdRes: demoRes() }), "read-review": () => ({ ...RD_DEMO, rdAns: DEMO_ANS, rdSub: true, rdRes: demoRes(), rdOpen: 4, rdFocus: 3 }),
  "write-empty": () => WS_DEMO, "write-draft": () => ({ ...WS_DEMO, wsText: WS_DRAFT }), "write-ready": () => ({ ...WS_DEMO, wsText: WS0 }),
  "write-checking": () => ({ ...WS_DEMO, wsText: WS0, wsChecking: true }), "write-results": () => ({ ...WS_DEMO, wsText: WS0, wsDone: true }),
  "write-selected": () => ({ ...WS_DEMO, wsText: WS0, wsDone: true, wsSel: "1-0" }), "write-improved": () => ({ ...WS_DEMO, wsText: WS0, wsDone: true, wsView: "imp" }),
  "write-fixed": () => ({ ...WS_DEMO, wsText: WS_FIXED, wsDone: true, wsStart: 3.4 }),
};

export type Me = {
  name: string; initial: string; level: number; xp: number; xpNext: number; streak: number; nativeName: string;
  goal: number; today: number; levelCode: string; levelName: string; interests: number; corr: "instant" | "end"; missions: number; words: number;
  readDiff: Difficulty; writeDiff: Difficulty;
};

function makeMe(user: { name?: string | null; email: string }, p: LingovProfile): Me {
  const name = user.name?.trim() || user.email.split("@")[0];
  const lv = LEVELS.find((l) => l[0] === p.currentLevel);
  return {
    name, initial: name[0].toUpperCase(), level: p.level, xp: p.totalXP, xpNext: p.xpForNextLevel, streak: p.currentStreak,
    nativeName: LANGS.find((l) => l[0] === p.nativeLanguage)?.[2] || p.nativeLanguage || "Hindi",
    // ponytail: minutes practised today are not tracked yet, dummy 8 like the prototype (REPLACE.md).
    goal: p.dailyTimeSpend || 10, today: 8,
    levelCode: lv?.[0] ?? "A2", levelName: lv?.[1] ?? "Elementary", interests: p.interests.length,
    corr: p.correctionStyle === "end" ? "end" : "instant", missions: p.incidentsCompleted, words: p.totalVocabLearned,
    readDiff: p.readingDifficulty, writeDiff: p.writingDifficulty,
  };
}

type Ctx = ReturnType<typeof useLingovState>;
const LingovCtx = createContext<Ctx | null>(null);

function useLingovState(user: { name?: string | null; email: string }, profile: LingovProfile) {
  const router = useRouter();
  const [S, setS] = useState<State>(INITIAL);
  const [ready, setReady] = useState(false);
  const sRef = useRef(S);
  useEffect(() => { sRef.current = S; });

  const set = useCallback((p: Patch) => setS((prev) => {
    const d = typeof p === "function" ? p(prev) : p;
    return d ? { ...prev, ...d } : prev;
  }), []);

  // Unfinished reading / writing sessions survive a reload ("Saved as you type").
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      // Browser storage can only be read after hydration, so this sync has to live in an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) set(saved);
    } catch { /* storage unavailable */ }
    setReady(true);
  }, [set]);
  const { rdTask, rdAns, rdT0, rdDemo, rdSub, wsQ, wsText, wsDemo, wsDone } = S;
  useEffect(() => {
    if (!ready) return;
    const data = {
      ...(rdDemo || rdSub ? {} : { rdTask, rdAns, rdT0 }),
      ...(wsDemo || wsDone ? {} : { wsQ, wsText }),
    };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
  }, [ready, rdTask, rdAns, rdT0, rdDemo, rdSub, wsQ, wsText, wsDemo, wsDone]);

  const timers = useRef<{ ri?: number; pi?: number; rt?: number; vn: number; rdBusy?: boolean; wsBusy?: boolean }>({ vn: 0 });
  useEffect(() => () => {
    const t = timers.current;
    clearInterval(t.ri); clearInterval(t.pi); clearTimeout(t.rt);
  }, []);

  // ── chats ──
  // Desktop shows chat 0 when none is picked; on mobile the composer only exists once a chat is open.
  const push = useCallback((text: string, extra?: Partial<Msg>) => {
    const s0 = sRef.current, i = s0.chat ?? 0;
    if (!text || s0.typing) return;
    const mine = s0.convs[i].filter((m) => !m.ai).length;
    set((s) => ({ convs: { ...s.convs, [i]: [...s.convs[i], { id: "u" + Date.now(), text, time: "9:4" + Math.min(9, 2 + mine), ...extra }] }, draft: "", typing: true, hintOpen: false }));
    clearTimeout(timers.current.rt);
    timers.current.rt = window.setTimeout(() => {
      const pool = REPLIES[i], r = pool[Math.min(pool.length - 1, Math.max(0, mine - (i === 0 ? 1 : 0)))] || REPLY_FALLBACK;
      set((s) => ({ convs: { ...s.convs, [i]: [...s.convs[i], { id: "r" + Date.now(), ai: 1, text: r[0], hi: r[1], time: "9:4" + Math.min(9, 3 + mine) }] }, typing: false }));
    }, 1300);
  }, [set]);

  const cancelRec = useCallback(() => { clearInterval(timers.current.ri); set({ rec: false, recS: 0 }); }, [set]);
  const startRec = useCallback(() => {
    if (sRef.current.typing) return;
    clearInterval(timers.current.ri);
    set({ rec: true, recS: 0, hintOpen: false });
    timers.current.ri = window.setInterval(() => set((s) => (s.recS >= 59 ? { recS: 60 } : { recS: s.recS + 1 })), 1000);
  }, [set]);
  const sendVoice = useCallback(() => {
    const secs = Math.max(2, sRef.current.recS);
    clearInterval(timers.current.ri);
    set({ rec: false, recS: 0 });
    timers.current.vn += 1;
    push(HINTS[timers.current.vn % 3], { voice: secs });
  }, [push, set]);
  const togglePlay = useCallback((id: string) => {
    clearInterval(timers.current.pi);
    const s0 = sRef.current;
    if (s0.play?.id === id) return set({ play: null });
    const m = Object.values(s0.convs).flat().find((x) => x.id === id);
    const dur = m?.voice ?? 3;
    set({ play: { id, p: 0 } });
    timers.current.pi = window.setInterval(() => set((s) => {
      if (!s.play) return null;
      const p = s.play.p + 0.1;
      if (p >= dur) { clearInterval(timers.current.pi); return { play: null }; }
      return { play: { id: s.play.id, p } };
    }), 100);
  }, [set]);
  const openChat = useCallback((i: number) => { cancelRec(); set({ chat: i, hintOpen: false, sheet: null, play: null }); }, [cancelRec, set]);
  const closeChat = useCallback(() => { cancelRec(); set({ chat: null, sheet: null, hintOpen: false, play: null }); }, [cancelRec, set]);
  const goChat = useCallback((i: number, startPersona = false) => {
    set((s) => ({ chat: i, hintOpen: false, sheet: null, ...(startPersona && !s.started.includes(i) ? { started: [...s.started, i] } : {}) }));
    router.push("/dashboard/chats");
  }, [router, set]);

  // ── reading session (app/actions/reading.ts) ──
  const loadReading = useCallback(async () => {
    if (timers.current.rdBusy) return;
    timers.current.rdBusy = true;
    set({ rdLoad: true, rdErr: "" });
    try {
      const task = await generateReadingTask({ objectiveOnly: true });
      set({ rdTask: task, rdDemo: false, rdAns: {}, rdT0: Date.now(), rdSub: false, rdRes: null, rdOpen: null, rdFocus: null, rdW: null, rdLoad: false });
    } catch {
      set({ rdLoad: false, rdErr: "We could not prepare a passage. Please try again." });
    } finally {
      timers.current.rdBusy = false;
    }
  }, [set]);
  const openReading = useCallback(() => {
    // A finished (or demo) passage is replaced by a new one; an unfinished one is resumed.
    set((s) => ({ rdAns: {}, rdSub: false, rdChecking: false, rdOpen: null, rdFocus: null, rdW: null, rdRes: null, rdErr: "", rdT0: Date.now(), ...(s.rdSub || s.rdDemo ? { rdTask: null, rdDemo: false } : {}) }));
    router.push("/dashboard/practice/reading");
  }, [router, set]);
  const submitReading = useCallback(async () => {
    const s0 = sRef.current, task = s0.rdTask;
    if (!task || s0.rdChecking) return;
    const qs = questionsOf(task);
    if (qs.some((_, i) => s0.rdAns[i] == null)) return;
    set({ rdChecking: true, rdW: null, rdErr: "" });
    try {
      let res: { view: ReadingView; xp: number };
      if (s0.rdDemo) {
        await wait(1600);
        const view = gradeLocal(task, s0.rdAns, 372);
        res = { view, xp: view.correctCount * 10 };
      } else {
        const answers = task.questions.map((q, i) => ({ questionIndex: q.index ?? i, answer: s0.rdAns[i] }));
        const secs = Math.max(1, Math.round((Date.now() - s0.rdT0) / 1000));
        [res] = await Promise.all([submitReadingSession(task, answers, secs), wait(1600)]);
      }
      set({ rdChecking: false, rdSub: true, rdFocus: null, rdRes: res, rdOpen: res.view.results.findIndex((r) => !r.isCorrect) });
      if (!s0.rdDemo) router.refresh(); // XP and streak in the shell
    } catch {
      set({ rdChecking: false, rdErr: "We could not submit your answers. Please try again." });
    }
  }, [router, set]);

  // ── writing session (app/actions/writing.ts) ──
  const loadWriting = useCallback(async () => {
    if (timers.current.wsBusy) return;
    timers.current.wsBusy = true;
    set({ wsLoad: true, wsErr: "" });
    try {
      const q = await generateWritingQuestion();
      set({ wsQ: q, wsDemo: false, wsText: "", wsRes: null, wsDone: false, wsStart: null, wsLoad: false });
    } catch {
      set({ wsLoad: false, wsErr: "We could not prepare a writing prompt. Please try again." });
    } finally {
      timers.current.wsBusy = false;
    }
  }, [set]);
  const openWriting = useCallback(() => {
    set((s) => ({ wsDone: false, wsSel: null, wsCat: "All", wsErr: "", ...(s.wsDone || s.wsDemo ? { wsQ: null, wsDemo: false, wsText: "", wsRes: null, wsStart: null, wsView: "orig" as const } : {}) }));
    router.push("/dashboard/practice/writing");
  }, [router, set]);
  const checkWriting = useCallback(async () => {
    const s0 = sRef.current, q = s0.wsQ, text = s0.wsText;
    if (!q || s0.wsChecking) return;
    const { words } = splitText(text);
    if (words < q.minWords) return;
    set({ wsChecking: true, wsSel: null, wsCat: "All", wsView: "orig", wsErr: "" });
    try {
      if (s0.wsDemo) {
        const sc = analyse(text).score;
        set((s) => ({ wsStart: s.wsStart == null ? sc : s.wsStart }));
        await wait(1700);
        set({ wsChecking: false, wsDone: true });
        return;
      }
      const [res] = await Promise.all([submitWritingSession(q, text, words), wait(1700)]);
      const sc = analyseAI(text, res.view, q.minWords).score;
      set((s) => ({ wsChecking: false, wsDone: true, wsRes: res, wsStart: s.wsStart == null ? sc : s.wsStart }));
      router.refresh(); // XP and streak in the shell
    } catch {
      set({ wsChecking: false, wsErr: "We could not check your writing. Please try again." });
    }
  }, [router, set]);

  const applyDemo = useCallback((q?: string) => { if (q && DEMOS[q]) set({ ...DEMOS[q]() }); }, [set]);

  const me = useMemo(() => makeMe(user, profile), [user, profile]);

  return {
    S, set, me, ready, push, startRec, cancelRec, sendVoice, togglePlay, openChat, closeChat, goChat,
    loadReading, openReading, submitReading, loadWriting, openWriting, checkWriting, applyDemo,
  };
}

export function LingovProvider({ user, profile, children }: { user: { name?: string | null; email: string }; profile: LingovProfile; children: React.ReactNode }) {
  const value = useLingovState(user, profile);
  return <LingovCtx.Provider value={value}>{children}</LingovCtx.Provider>;
}

export function useLingov() {
  const v = useContext(LingovCtx);
  if (!v) throw new Error("useLingov must be used inside <LingovProvider>");
  return v;
}

"use client";

// Chat state: what the server sent us (chat list, scenarios, the open conversation) and the actions that talk to it.
// Screen-only things (draft text, which sheet is open) stay inside the screens.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { askGuide, getThread, listChats, listScenarios, nextIncident, sendMessage, startScenario, translateMessage } from "@/app/actions/chat";
import type { ChatSummary, MessageView, ScenarioCard, ThreadView } from "@/lib/chat/types";

const errorText = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");

export function useChatState() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioCard[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadView | null>(null);
  const [waiting, setWaiting] = useState(false); // the AI is answering
  const [starting, setStarting] = useState<string | null>(null); // scenario id being prepared
  const [error, setError] = useState("");
  const busy = useRef(false); // blocks double sends

  const loadChats = useCallback(async () => {
    try { setChats(await listChats()); } catch { /* the list stays as it was */ }
  }, []);
  const loadScenarios = useCallback(async () => {
    try { setScenarios(await listScenarios()); } catch { setScenarios([]); }
  }, []);

  // Runs one server call that returns the whole conversation. Everything below goes through here.
  const run = useCallback(async (task: () => Promise<ThreadView>, before?: () => void): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    setWaiting(true);
    setError("");
    before?.();
    try {
      setThread(await task());
      void loadChats();
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    } finally {
      busy.current = false;
      setWaiting(false);
    }
  }, [loadChats]);

  const openChat = useCallback((chatId: string) => {
    setActiveId(chatId);
    setThread(null);
    setError("");
    getThread(chatId).then(setThread, (e) => setError(errorText(e)));
  }, []);
  const closeChat = useCallback(() => { setActiveId(null); setThread(null); setError(""); }, []);
  const goChat = useCallback((chatId: string) => { openChat(chatId); router.push("/dashboard/chats"); }, [openChat, router]);

  const startMission = useCallback(async (scenarioId: string) => {
    setStarting(scenarioId);
    setError("");
    try {
      const chatId = await startScenario(scenarioId);
      void loadChats();
      void loadScenarios();
      goChat(chatId);
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    } finally {
      setStarting(null);
    }
  }, [goChat, loadChats, loadScenarios]);

  // The learner's message appears at once; the characters' answer replaces the thread when it arrives.
  // Returns false when it failed, so the screen can give the text back to the learner.
  const send = useCallback((text: string) => {
    if (!thread) return Promise.resolve(false);
    const mine: MessageView = { id: "pending", senderType: "user", senderId: "me", senderName: "You", text, at: new Date().toISOString(), mistakes: [] };
    const restore = thread;
    return run(
      () => sendMessage(thread.chatId, text),
      () => setThread({ ...thread, messages: [...thread.messages, mine] }),
    ).then((ok) => { if (!ok) setThread(restore); return ok; });
  }, [thread, run]);

  const ask = useCallback((question: string) => (thread ? run(() => askGuide(thread.chatId, question)) : Promise.resolve(false)), [thread, run]);
  const nextMission = useCallback(() => (thread ? run(() => nextIncident(thread.chatId)) : Promise.resolve(false)), [thread, run]);

  // Translations are saved on the server, so each message is translated once.
  const translate = useCallback(async (messageId: string) => {
    try {
      const translation = await translateMessage(messageId);
      setThread((t) => (t ? { ...t, messages: t.messages.map((m) => (m.id === messageId ? { ...m, translation } : m)) } : t));
    } catch (e) { setError(errorText(e)); }
  }, []);

  useEffect(() => { listChats().then(setChats, () => {}); }, []); // first load of the chat list

  return { chats, scenarios, activeId, thread, waiting, starting, chatError: error, loadChats, loadScenarios, openChat, closeChat, goChat, startMission, send, ask, nextMission, translate };
}

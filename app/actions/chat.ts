"use server";

// Server actions behind the Chats screen. Reads top to bottom:
// list -> start (copy a scenario into My Chats) -> open -> send messages -> scene ends -> next scene.
// The AI calls live in lib/chat/engine.ts; this file only does login, database and bookkeeping.
//
// Data (models/learning-through-scenario):
//   Chat              one row of the user's chat list
//   ScenarioProgress  where the user is in a scenario
//   IncidentProgress  goals and XP of one scene
//   Conversation      the messages of one scene
import { headers } from "next/headers";
import { isValidObjectId, type Types } from "mongoose";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { checkMessage, guideAnswer, storyTurn, translateText, type StoryTurn, type Topic } from "@/lib/chat/engine";
import type { StoryContext } from "@/lib/chat/prompts";
import type { ChallengeView, ChatSummary, FeedbackView, MessageView, Mistake, ScenarioCard, ThreadView } from "@/lib/chat/types";
import grammarTopics from "@/grammar-topics.json";
import {
  Chat, Conversation, Guide, IncidentProgress, Scenario, ScenarioProgress,
  type IChat, type IConversation, type IGuide, type IIncidentProgress, type IScenario, type IScenarioProgress,
} from "@/models/learning-through-scenario";
import { UserProfile } from "@/models/user-profile";
import type { Level } from "@/models/_shared";

const MAX_MESSAGES = 30; // a scene ends after this many learner messages, even if a goal is still open
const HISTORY_LENGTH = 8; // recent messages sent to the AI

type Incident = IScenario["incidents"][number];
type User = Awaited<ReturnType<typeof requireUser>>;
type StoredMessage = IConversation["messages"][number];
type NewMessage = {
  speaker: "user" | "character" | "guide";
  characterId?: string;
  text: string;
  evaluation?: { errors: ReturnType<typeof toError>[] };
};

// ── Small helpers ────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await connectDB();
  const profile = await UserProfile.findOne({ authUserId: session.user.id }).lean();
  return {
    userId: session.user.id,
    level: (profile?.currentLevel ?? "A2") as Level,
    nativeLanguage: profile?.nativeLanguage || "English",
  };
}

// Grammar topics never change at runtime, so they come from the same JSON the seed loads. No database read.
// Anything else about a topic (lesson, explanation) is still fetched from the database by slug when needed.
const TOPICS: Topic[] = grammarTopics.map(({ slug, title }) => ({ slug, title }));
const TOPIC_TITLES = new Map(TOPICS.map((t) => [t.slug, t.title]));

// The scene's goals in the order the learner should reach them (sorted copy, the stored array is not changed).
const milestonesOf = (incident: Incident) => [...incident.milestones].sort((a, b) => a.order - b.order);
// Display name of a character in this scene from their id. Falls back to "Guide" (the guide is not in characterParticipants).
const nameOf = (incident: Incident, characterId?: string | null) =>
  incident.characterParticipants.find((c) => c.id === characterId)?.name ?? "Guide";

// A mistake found by the AI, in the shape Conversation stores it. `code` holds the grammar topic slug.
const toError = (m: Mistake) => ({
  category: m.category,
  code: m.topicSlugs[0],
  original: m.wrong,
  correction: m.right,
  explanation: m.why,
  explanationNative: m.whyNative,
});

// One AI turn as messages: the character replies, then the guide's note.
const turnMessages = (turn: StoryTurn, guideId: string): NewMessage[] => [
  ...turn.replies.map((r) => ({ speaker: "character" as const, characterId: r.characterId, text: r.text })),
  ...(turn.guide ? [{ speaker: "guide" as const, characterId: guideId, text: turn.guide }] : []),
];

// What the chat list shows under the title: the last thing a character said.
function lastLine(incident: Incident, turn: StoryTurn) {
  const last = turn.replies.at(-1)!;
  return `${nameOf(incident, last.characterId)}: ${last.text}`;
}

// Everything the AI needs to know about the scene, built from what is stored.
function storyContext(level: string, scenario: IScenario, incident: Incident, guide: IGuide, messages: StoredMessage[], done: string[]): StoryContext {
  const spoken = messages.filter((m) => m.speaker !== "guide");
  return {
    scenario: { title: scenario.title, sceneSetup: scenario.sceneSetup.join(" ") },
    incident: {
      title: incident.title,
      setup: incident.scenarioSetup.join(" "),
      worldFacts: incident.worldFacts,
      userRole: [incident.userRole?.name, incident.userRole?.description].filter(Boolean).join(". "),
      milestones: milestonesOf(incident).map(({ id, goal }) => ({ id, goal })),
    },
    characters: incident.characterParticipants.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      persona: c.persona,
      secret: c.secrets.join(" ") || null,
    })),
    guide: { name: guide.name, persona: incident.guidePersona },
    level,
    done,
    history: spoken.slice(-HISTORY_LENGTH).map((m) => ({ name: m.speaker === "user" ? "Learner" : nameOf(incident, m.characterId), text: m.text })),
    userMessageCount: messages.filter((m) => m.speaker === "user").length,
  };
}

// Loads everything about the scene a chat is currently on. Also checks the chat belongs to the user.
async function loadChat(chatId: string, userId: string) {
  if (!isValidObjectId(chatId)) throw new Error("Chat not found.");
  const chat = await Chat.findOne({ _id: chatId, userId }).lean<IChat>();
  if (!chat) throw new Error("Chat not found.");
  if (chat.type !== "scenario" || !chat.scenarioId) throw new Error("This chat cannot be opened yet.");

  const scenario = await Scenario.findById(chat.scenarioId).lean<IScenario>();
  const progress = await ScenarioProgress.findOne({ userId, scenarioId: chat.scenarioId }).lean<IScenarioProgress>();
  const incident = scenario?.incidents.find((i) => i.id === progress?.currentIncidentId);
  if (!scenario || !progress || !incident) throw new Error("Chat not found.");

  const incidentProgress = await IncidentProgress.findOne({ userId, scenarioId: scenario._id, incidentId: incident.id }).lean<IIncidentProgress>();
  const [conversation, guide] = await Promise.all([
    incidentProgress?.conversationId && Conversation.findById(incidentProgress.conversationId).lean<IConversation>(),
    Guide.findById(incident.guideId).lean<IGuide>(),
  ]);
  if (!incidentProgress || !conversation || !guide) throw new Error("Chat not found.");
  return { chat, scenario, progress, incident, incidentProgress, conversation, guide };
}

// Starts a scene: the AI writes the opening, then the conversation and the scene progress are created.
// Returns the line the chat list should show.
async function beginIncident(user: User, scenario: IScenario, incident: Incident) {
  const guide = await Guide.findById(incident.guideId).lean<IGuide>();
  if (!guide) throw new Error("Guide not found.");

  // Ask the AI first, so a failed call leaves nothing half-created.
  const turn = await storyTurn(storyContext(user.level, scenario, incident, guide, [], []), null);
  const conversation = await Conversation.create({
    userId: user.userId,
    scenarioId: scenario._id,
    incidentId: incident.id,
    messages: turnMessages(turn, String(guide._id)),
  });
  await IncidentProgress.create({
    userId: user.userId,
    scenarioId: scenario._id,
    incidentId: incident.id,
    status: "in_progress",
    currentMilestoneId: milestonesOf(incident)[0]?.id,
    conversationId: conversation._id,
    startedAt: new Date(),
  });
  return lastLine(incident, turn);
}

const touchChat = (chatId: Types.ObjectId, lastMessage: string) =>
  Chat.updateOne({ _id: chatId }, { lastMessage, lastMessageAt: new Date() });

// ── Views sent to the browser (never include secrets) ────────────────────────

function toMessageView(m: StoredMessage, incident: Incident): MessageView {
  return {
    id: String(m._id),
    senderType: m.speaker,
    senderId: m.characterId ?? "me",
    senderName: m.speaker === "user" ? "You" : nameOf(incident, m.characterId),
    text: m.text,
    at: m.createdAt.toISOString(),
    mistakes: (m.evaluation?.errors ?? []).map((e) => ({
      wrong: e.original ?? "",
      right: e.correction ?? "",
      why: e.explanation ?? "",
      whyNative: e.explanationNative ?? undefined,
      topicSlugs: e.code ? [e.code] : [],
      category: e.category as Mistake["category"],
      topicTitles: e.code ? [TOPIC_TITLES.get(e.code) ?? e.code] : [],
    })),
  };
}

// End-of-scene summary. Plain counting, no AI: which grammar topics came up most.
function buildFeedback(messages: StoredMessage[], allGoalsDone: boolean, endNote?: string | null): FeedbackView {
  const mine = messages.filter((m) => m.speaker === "user");
  const errors = mine.flatMap((m) => m.evaluation?.errors ?? []);

  const counts = new Map<string, number>();
  for (const e of errors) if (e.code) counts.set(e.code, (counts.get(e.code) ?? 0) + 1);

  return {
    summary: endNote || (allGoalsDone ? "You reached every goal in this scene. Well done!" : "The scene ended before every goal was reached. Try the next one!"),
    messages: mine.length,
    mistakes: errors.length,
    topics: [...counts].sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, title: TOPIC_TITLES.get(slug) ?? slug, count })),
    examples: errors.slice(0, 3).map((e) => ({ wrong: e.original ?? "", right: e.correction ?? "", why: e.explanation ?? "" })),
    allGoalsDone,
  };
}

async function buildThread(chatId: string, userId: string): Promise<ThreadView> {
  const { scenario, incident, incidentProgress: ip, conversation, guide } = await loadChat(chatId, userId);
  const index = scenario.incidents.findIndex((i) => i.id === incident.id);
  const completed = ip.status === "completed";
  const lastGuideMessage = conversation.messages.findLast((m) => m.speaker === "guide");

  // Earlier scenes stay in the chat: their messages, then a "system" divider that says the scene ended.
  const before = scenario.incidents.slice(0, index);
  const allProgress = await IncidentProgress.find({ userId, scenarioId: scenario._id }).lean<IIncidentProgress[]>();
  const pastProgress = allProgress.filter((p) => before.some((i) => i.id === p.incidentId));
  const pastConversations = await Conversation.find({ _id: { $in: pastProgress.map((p) => p.conversationId) } }).lean<IConversation[]>();
  const history = before.flatMap((inc, n): MessageView[] => {
    const p = pastProgress.find((x) => x.incidentId === inc.id);
    const c = pastConversations.find((x) => String(x._id) === String(p?.conversationId));
    if (!p || !c) return [];
    const fb = buildFeedback(c.messages, p.completedMilestoneIds.length === inc.milestones.length, p.endNote);
    const end: MessageView = {
      id: `end-${inc.id}`,
      senderType: "system",
      senderId: "system",
      senderName: `Scene ${n + 1} · ${inc.title}`,
      text: `${fb.summary} ${fb.messages} messages, ${fb.mistakes === 0 ? "no mistakes" : `${fb.mistakes} mistake${fb.mistakes === 1 ? "" : "s"}`}.`,
      at: (p.completedAt ?? c.messages.at(-1)?.createdAt ?? new Date()).toISOString(),
      mistakes: [],
    };
    return [...c.messages.filter((m) => m.speaker !== "guide").map((m) => toMessageView(m, inc)), end];
  });

  const challenges: ChallengeView[] = scenario.incidents.map((inc) => {
    const p = inc.id === incident.id ? ip : allProgress.find((x) => x.incidentId === inc.id);
    const done = p?.completedMilestoneIds ?? [];
    return {
      id: inc.id,
      title: inc.title,
      status: p?.status === "completed" ? "done" : inc.id === incident.id ? "current" : "upcoming",
      goals: milestonesOf(inc).map((m) => ({ id: m.id, goal: m.goal, done: done.includes(m.id) })),
    };
  });

  return {
    chatId,
    scenarioTitle: scenario.title,
    incidentTitle: incident.title,
    incidentNumber: index + 1,
    incidentCount: scenario.incidents.length,
    status: completed ? "completed" : "in_progress",
    milestones: milestonesOf(incident).map((m) => ({ id: m.id, goal: m.goal, done: ip.completedMilestoneIds.includes(m.id) })),
    challenges,
    characters: incident.characterParticipants.map(({ id, name, role }) => ({ id, name, role })),
    guideName: guide.name,
    guideNote: lastGuideMessage?.text ?? "",
    messages: [...history, ...conversation.messages.filter((m) => m.speaker !== "guide").map((m) => toMessageView(m, incident))],
    feedback: completed ? buildFeedback(conversation.messages, ip.completedMilestoneIds.length === incident.milestones.length, ip.endNote) : null,
    hasNext: index < scenario.incidents.length - 1,
  };
}

// ── Lists ────────────────────────────────────────────────────────────────────

// Explore: every published scenario, with the chat the user already made from it (if any).
export async function listScenarios(): Promise<ScenarioCard[]> {
  const { userId } = await requireUser();
  const [scenarios, myChats] = await Promise.all([
    Scenario.find({ isPublished: true }).sort({ createdAt: 1 }).lean<IScenario[]>(),
    Chat.find({ userId, scenarioId: { $exists: true } }, "scenarioId").lean<IChat[]>(),
  ]);
  const chatByScenario = new Map(myChats.map((c) => [String(c.scenarioId), String(c._id)]));

  return scenarios.map((s) => {
    const first = s.incidents.find((i) => i.id === s.startingIncident) ?? s.incidents[0];
    return {
      id: String(s._id),
      title: s.title,
      sceneSetup: s.sceneSetup.join(" "),
      incidentCount: s.incidents.length,
      firstGoals: first ? milestonesOf(first).map((m) => m.goal) : [],
      chatId: chatByScenario.get(String(s._id)) ?? null,
    };
  });
}

// Chats screen: every chat of the user, scenario based or not, newest first.
export async function listChats(): Promise<ChatSummary[]> {
  const { userId } = await requireUser();
  const chats = await Chat.find({ userId }).sort({ lastMessageAt: -1 }).lean<IChat[]>();
  const scenarioIds = chats.flatMap((c) => (c.scenarioId ? [c.scenarioId] : []));
  const [scenarios, progresses, incidentProgresses] = await Promise.all([
    Scenario.find({ _id: { $in: scenarioIds } }).lean<IScenario[]>(),
    ScenarioProgress.find({ userId, scenarioId: { $in: scenarioIds } }).lean<IScenarioProgress[]>(),
    IncidentProgress.find({ userId, scenarioId: { $in: scenarioIds } }).lean<IIncidentProgress[]>(),
  ]);

  return chats.map((chat) => {
    const same = (id: Types.ObjectId) => String(id) === String(chat.scenarioId);
    const scenario = scenarios.find((s) => same(s._id));
    const progress = progresses.find((p) => same(p.scenarioId));
    const incident = scenario?.incidents.find((i) => i.id === progress?.currentIncidentId);
    const ip = incidentProgresses.find((p) => same(p.scenarioId) && p.incidentId === incident?.id);
    return {
      chatId: String(chat._id),
      title: chat.title,
      incidentTitle: incident?.title ?? "",
      lastText: chat.lastMessage,
      lastAt: chat.lastMessageAt.toISOString(),
      done: ip?.completedMilestoneIds.length ?? 0,
      total: incident?.milestones.length ?? 0,
      completed: progress?.status === "completed",
    };
  });
}

export async function getThread(chatId: string): Promise<ThreadView> {
  const { userId } = await requireUser();
  return buildThread(chatId, userId);
}

// ── Copy a scenario into My Chats ────────────────────────────────────────────

export async function startScenario(scenarioId: string): Promise<string> {
  const user = await requireUser();
  if (!isValidObjectId(scenarioId)) throw new Error("Scenario not found.");
  const scenario = await Scenario.findOne({ _id: scenarioId, isPublished: true }).lean<IScenario>();
  if (!scenario) throw new Error("Scenario not found.");

  const existing = await Chat.findOne({ userId: user.userId, scenarioId }, "_id").lean();
  if (existing) return String(existing._id);

  const incident = scenario.incidents.find((i) => i.id === scenario.startingIncident) ?? scenario.incidents[0];
  if (!incident) throw new Error("This scenario has no scenes yet.");

  const lastMessage = await beginIncident(user, scenario, incident);
  const now = new Date();
  await ScenarioProgress.create({
    userId: user.userId,
    scenarioId: scenario._id,
    status: "in_progress",
    currentIncidentId: incident.id,
    startedAt: now,
    lastActivityAt: now,
  });
  const chat = await Chat.create({ userId: user.userId, type: "scenario", title: scenario.title, scenarioId: scenario._id, lastMessage, lastMessageAt: now });
  return String(chat._id);
}

// ── Send a message ───────────────────────────────────────────────────────────

export async function sendMessage(chatId: string, rawText: string): Promise<ThreadView> {
  // clean the input first
  const text = rawText.trim().slice(0, 500);

  if (!text) throw new Error("Write a message first.");

  const user = await requireUser();
  
  const { chat, scenario, progress, incident, incidentProgress: ip, conversation, guide } = await loadChat(chatId, user.userId);
  if (ip.status === "completed") throw new Error("This scene is finished.");

  const ctx = storyContext(user.level, scenario, incident, guide, conversation.messages, ip.completedMilestoneIds);

  // The story and the language check do not depend on each other, so they run at the same time.
  // A failed check must never block the conversation. A failed story call does, and nothing is saved.
  const [turn, check] = await Promise.all([
    storyTurn(ctx, text),
    checkMessage(text, user.level, user.nativeLanguage, TOPICS)
      .catch(() => ({ mistakes: [] as Mistake[] })),
  ]);

  const userMessage: NewMessage = { speaker: "user", text, evaluation: { errors: check.mistakes.map(toError) } };
  await Conversation.updateOne({ _id: conversation._id }, { $push: { messages: { $each: [userMessage, ...turnMessages(turn, String(guide._id))] } } });

  // Goals the learner just reached give their XP.
  const reached = milestonesOf(incident).filter((m) => turn.milestonesDone.includes(m.id));
  const xp = reached.reduce((sum, m) => sum + (m.xp ?? 0), 0);
  const doneIds = [...new Set([...ip.completedMilestoneIds, ...reached.map((m) => m.id)])];
  await IncidentProgress.updateOne(
    { _id: ip._id },
    {
      $addToSet: { completedMilestoneIds: { $each: reached.map((m) => m.id) } },
      $inc: { turnCount: 1, xpEarned: xp },
      $set: { currentMilestoneId: milestonesOf(incident).find((m) => !doneIds.includes(m.id))?.id },
    },
  );
  await ScenarioProgress.updateOne({ _id: progress._id }, { $inc: { totalXp: xp }, $set: { lastActivityAt: new Date() } });
  await touchChat(chat._id, lastLine(incident, turn));

  if (doneIds.length === incident.milestones.length || ip.turnCount + 1 >= MAX_MESSAGES) {
    // The guide closes the scene in their own words. If the AI fails, the plain summary is used instead.
    const allDone = doneIds.length === incident.milestones.length;
    const mistakes = [...conversation.messages, userMessage].reduce((n, m) => n + (m.evaluation?.errors.length ?? 0), 0);
    const endCtx: StoryContext = {
      ...ctx,
      done: doneIds,
      history: [...ctx.history, { name: "Learner", text }, ...turn.replies.map((r) => ({ name: nameOf(incident, r.characterId), text: r.text }))].slice(-HISTORY_LENGTH),
    };
    const endNote = await guideAnswer(endCtx, `The scene just ended (${allDone ? "I reached every goal" : "time ran out before every goal was reached"}). I made ${mistakes} mistake${mistakes === 1 ? "" : "s"} in total. In 2 short sentences, tell me what I did well and one thing to improve next time.`).catch(() => "");
    await completeIncident(user.userId, scenario, progress, incident, ip.xpEarned + xp, endNote);
  }
  return buildThread(chatId, user.userId);
}

// ── End of a scene: close it, move the scenario on, give XP ──────────────────

async function completeIncident(userId: string, scenario: IScenario, progress: IScenarioProgress, incident: Incident, xpEarned: number, endNote: string) {
  const now = new Date();
  const isLast = scenario.incidents.at(-1)?.id === incident.id;

  await IncidentProgress.updateOne({ userId, scenarioId: scenario._id, incidentId: incident.id }, { status: "completed", completedAt: now, endNote });
  await Conversation.updateOne({ userId, scenarioId: scenario._id, incidentId: incident.id }, { status: "completed" });
  await ScenarioProgress.updateOne(
    { _id: progress._id },
    {
      $addToSet: { completedIncidentIds: incident.id },
      ...(isLast ? { $set: { status: "completed", completedAt: now } } : {}),
    },
  );
  await awardXp(userId, xpEarned);
}

// Same streak rule as the reading and writing sessions: same day keeps it, next day adds one, a gap resets it.
async function awardXp(userId: string, xp: number) {
  const profile = await UserProfile.findOne({ authUserId: userId }).lean();
  const now = new Date();
  let streak = 1;
  if (profile?.lastActivityAt) {
    const last = new Date(profile.lastActivityAt);
    last.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const days = Math.round((today.getTime() - last.getTime()) / 86_400_000);
    if (days === 0) streak = profile.currentStreak ?? 1;
    else if (days === 1) streak = (profile.currentStreak ?? 0) + 1;
  }
  await UserProfile.updateOne(
    { authUserId: userId },
    {
      $inc: { totalXP: xp, weeklyXp: xp, incidentsCompleted: 1 },
      $set: {
        lastActivityAt: now,
        currentStreak: streak,
        longestStreak: Math.max(streak, profile?.longestStreak ?? 0),
      },
    },
  );
}

// ── Next scene ───────────────────────────────────────────────────────────────

export async function nextIncident(chatId: string): Promise<ThreadView> {
  const user = await requireUser();
  const { chat, scenario, progress, incident, incidentProgress: ip } = await loadChat(chatId, user.userId);
  const next = scenario.incidents[scenario.incidents.findIndex((i) => i.id === incident.id) + 1];
  if (ip.status !== "completed" || !next) throw new Error("There is no next scene yet.");

  const lastMessage = await beginIncident(user, scenario, next);
  await ScenarioProgress.updateOne({ _id: progress._id }, { currentIncidentId: next.id });
  await touchChat(chat._id, lastMessage);
  return buildThread(chatId, user.userId);
}

// ── Ask the guide / translate ────────────────────────────────────────────────

export async function askGuide(chatId: string, rawQuestion: string): Promise<ThreadView> {
  const question = rawQuestion.trim().slice(0, 300);
  if (!question) throw new Error("Ask something first.");
  const user = await requireUser();
  const { scenario, incident, incidentProgress: ip, conversation, guide } = await loadChat(chatId, user.userId);

  const ctx = storyContext(user.level, scenario, incident, guide, conversation.messages, ip.completedMilestoneIds);
  const answer = await guideAnswer(ctx, question);
  if (!answer) throw new Error("The guide could not answer. Try again.");

  // The answer becomes the guide's latest note. The question itself is not saved.
  const note: NewMessage = { speaker: "guide", characterId: String(guide._id), text: answer };
  await Conversation.updateOne({ _id: conversation._id }, { $push: { messages: note } });
  return buildThread(chatId, user.userId);
}

// Translations are not saved: the screen keeps them until the chat is closed.
export async function translateMessage(messageId: string): Promise<string> {
  const user = await requireUser();
  if (!isValidObjectId(messageId)) throw new Error("Message not found.");
  const found = await Conversation.findOne({ userId: user.userId, "messages._id": messageId }, { "messages.$": 1 }).lean<IConversation>();
  const text = found?.messages[0]?.text;
  if (!text) throw new Error("Message not found.");
  return translateText(text, user.nativeLanguage);
}

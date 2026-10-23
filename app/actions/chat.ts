"use server";

// Server actions behind the Chats screen. Reads top to bottom as the life of a mission:
// list -> start -> open -> send messages -> scene ends (feedback) -> next scene.
// The AI calls live in lib/chat/engine.ts; this file only does login, database and bookkeeping.
import { headers } from "next/headers";
import { isValidObjectId, type Types } from "mongoose";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  checkMessage,
  guideAnswer,
  storyTurn,
  translateText,
  writeFeedback,
  type StoryTurn,
  type Topic,
} from "@/lib/chat/engine";
import type { StoryContext } from "@/lib/chat/prompts";
import type {
  ChatSummary,
  FeedbackView,
  MessageView,
  Mistake,
  Mood,
  ScenarioCard,
  ThreadView,
  WordInfo,
} from "@/lib/chat/types";
import { UserProfile } from "@/models/user-profile";
import { addUserWord } from "@/lib/vocab-store";
import { GrammarTopic } from "@/models/grammar-topic";
import { Guide } from "@/models/guide";
import { Message } from "@/models/message";
import { Scenario, type IScenario } from "@/models/scenario";
import {
  UserScenarioProgress,
  type IUserScenarioProgress,
} from "@/models/user-scenario-progress";
import { UserVocab } from "@/models/user-vocab";
import type { Level } from "@/models/_shared";

const MAX_MESSAGES = 30; // a scene ends after this many learner messages, even if a goal is still open
const HISTORY_LENGTH = 8; // recent messages sent to the AI
const XP_ALL_GOALS = 50;
const XP_PARTIAL = 20;

type Incident = IScenario["incidents"][number];

// ── Small helpers ────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await connectDB();
  const profile = await UserProfile.findOne({
    authUserId: session.user.id,
  }).lean();
  const nativeLanguage = profile?.nativeLanguage || "English";
  return {
    userId: session.user.id,
    level: (profile?.currentLevel ?? "A2") as Level,
    nativeLanguage,
  };
}

// Grammar topics change rarely, so they are kept in memory for a few minutes instead of read on every message.
let topicCache: { at: number; topics: Topic[] } | null = null;
async function getTopics(): Promise<Topic[]> {
  if (!topicCache || Date.now() - topicCache.at > 10 * 60_000) {
    const topics = await GrammarTopic.find({}, "slug title")
      .sort({ level: 1 })
      .lean<Topic[]>();
    topicCache = {
      at: Date.now(),
      topics: topics.map(({ slug, title }) => ({ slug, title })),
    };
  }
  return topicCache.topics;
}

async function loadOwned(progressId: string, userId: string) {
  if (!isValidObjectId(progressId)) throw new Error("Chat not found.");
  const progress = await UserScenarioProgress.findOne({
    _id: progressId,
    userId,
  }).lean<IUserScenarioProgress>();
  const scenario =
    progress &&
    (await Scenario.findById(progress.scenarioId).lean<IScenario>());
  if (!progress || !scenario) throw new Error("Chat not found.");
  return { progress, scenario };
}

const currentIncident = (p: IUserScenarioProgress, s: IScenario) => {
  const incident = s.incidents.find((i) => i.id === p.currentIncidentId);
  if (!incident) throw new Error("Scene not found.");
  return incident;
};
const moodsOf = (p: Pick<IUserScenarioProgress, "hiddenState">) =>
  ((p.hiddenState as { moods?: Record<string, Mood> } | null)?.moods ??
    {}) as Record<string, Mood>;

const nameOf = (s: IScenario, id: string) =>
  s.characters.find((c) => c.id === id)?.name ?? "Guide";

// Everything the AI needs to know about the scene, built from what is stored.
async function storyContext(
  p: {
    cefrLevel: string;
    memorySummary: string;
    hiddenState: unknown;
    incidentCount: number;
    done: string[];
    progressId?: Types.ObjectId;
  },
  s: IScenario,
  incident: Incident,
  guideName: string,
): Promise<StoryContext> {
  const recent = p.progressId
    ? await Message.find({
        progressId: p.progressId,
        incidentId: incident.id,
        channel: "group",
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(HISTORY_LENGTH)
        .lean()
    : [];
  return {
    scenario: { title: s.title, sceneSetup: s.sceneSetup },
    incident: {
      title: incident.title,
      scenario: incident.scenario,
      userRole: incident.userRole,
      milestones: incident.milestones,
    },
    characters: s.characters
      .filter((c) => incident.characterParticipants.includes(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        persona: c.persona,
        secret: c.secret ?? null,
      })),
    openingFrom: incident.openingFrom,
    guideName,
    level: p.cefrLevel,
    memory: p.memorySummary,
    moods: moodsOf({ hiddenState: p.hiddenState } as IUserScenarioProgress),
    done: p.done,
    history: recent
      .reverse()
      .map((m) => ({
        name: m.senderType === "user" ? "Learner" : nameOf(s, m.senderId),
        text: m.text,
      })),
    userMessageCount: p.incidentCount,
  };
}

async function guideOf(incident: Incident) {
  const guide = await Guide.findById(incident.userGuideId).lean();
  if (!guide) throw new Error("Guide not found.");
  return { id: String(guide._id), name: guide.name };
}

// Saves one AI turn: character replies, the guide's note, new moods and new words.
async function saveTurn(
  progressId: Types.ObjectId,
  scenarioId: Types.ObjectId,
  incident: Incident,
  guide: { id: string; name: string },
  turn: StoryTurn,
  user: { userId: string; level: string },
) {
  const base = { progressId, incidentId: incident.id };
  await Message.insertMany([
    ...turn.replies.map((r) => ({
      ...base,
      channel: "group",
      senderType: "character",
      senderId: r.characterId,
      text: r.text,
    })),
    ...(turn.guide
      ? [
          {
            ...base,
            channel: "guide",
            senderType: "guide",
            senderId: guide.id,
            text: turn.guide,
          },
        ]
      : []),
  ]);
  await saveWords(user, turn.vocab, "incident", scenarioId, incident.id);
}

async function saveWords(
  user: { userId: string; level: string },
  words: WordInfo[],
  source: "incident" | "mistake",
  scenarioId: Types.ObjectId,
  incidentId: string,
) {
  for (const w of words)
    await addUserWord(user.userId, user.level, w, source, {
      scenarioId,
      incidentId,
    });
}

// ── Views sent to the browser (never include secrets or hidden state) ────────

function toMessageView(
  titles: Map<string, string>,
  m: {
    _id: Types.ObjectId;
    senderType: string;
    senderId: string;
    text: string;
    createdAt: Date;
    mistakes?: {
      wrong: string;
      right: string;
      why: string;
      whyNative?: string | null;
      topicSlugs: string[];
      category: string;
    }[];
    translation?: string | null;
  },
  s: IScenario,
): MessageView {
  return {
    id: String(m._id),
    senderType: m.senderType as MessageView["senderType"],
    senderId: m.senderId,
    senderName: m.senderType === "user" ? "You" : nameOf(s, m.senderId),
    text: m.text,
    at: m.createdAt.toISOString(),
    mistakes: (m.mistakes ?? []).map(
      ({ wrong, right, why, whyNative, topicSlugs, category }) => ({
        wrong,
        right,
        why,
        whyNative: whyNative ?? undefined,
        topicSlugs,
        category: category as Mistake["category"],
        topicTitles: topicSlugs.map((slug) => titles.get(slug) ?? slug),
      }),
    ),
    translation: m.translation ?? undefined,
  };
}

async function buildThread(
  progressId: string,
  userId: string,
): Promise<ThreadView> {
  const { progress, scenario } = await loadOwned(progressId, userId);
  const incident = currentIncident(progress, scenario);
  const ip = progress.incidents.find((i) => i.incidentId === incident.id);
  const where = { progressId: progress._id, incidentId: incident.id };
  const [guide, topics, messages, note] = await Promise.all([
    guideOf(incident),
    getTopics(),
    Message.find({ ...where, channel: "group" })
      .sort({ createdAt: 1, _id: 1 })
      .lean(),
    Message.findOne({ ...where, channel: "guide", senderType: "guide" })
      .sort({ createdAt: -1, _id: -1 })
      .lean(),
  ]);
  const index = scenario.incidents.findIndex((i) => i.id === incident.id);
  const titles = new Map(topics.map((t) => [t.slug, t.title]));

  return {
    progressId: String(progress._id),
    scenarioTitle: scenario.title,
    incidentTitle: incident.title,
    incidentNumber: index + 1,
    incidentCount: scenario.incidents.length,
    status: ip?.status ?? "in_progress",
    milestones: incident.milestones.map((m) => ({
      id: m.id,
      goal: m.goal,
      done: ip?.milestonesDone.includes(m.id) ?? false,
    })),
    characters: scenario.characters
      .filter((c) => incident.characterParticipants.includes(c.id))
      .map(({ id, name, role }) => ({ id, name, role })),
    guideName: guide.name,
    guideNote: note?.text ?? "",
    messages: messages.map((m) => toMessageView(titles, m, scenario)),
    feedback: (ip?.feedback as FeedbackView | null) ?? null,
    hasNext: index < scenario.incidents.length - 1,
  };
}

// ── Lists ────────────────────────────────────────────────────────────────────

export async function listScenarios(): Promise<ScenarioCard[]> {
  const { userId } = await requireUser();
  const [scenarios, mine] = await Promise.all([
    Scenario.find({ published: true })
      .sort({ createdAt: 1 })
      .lean<IScenario[]>(),
    UserScenarioProgress.find({ userId }, "scenarioId").lean<
      { _id: Types.ObjectId; scenarioId: Types.ObjectId }[]
    >(),
  ]);
  console.log("Scenarios:", scenarios, "Mine:", mine);

  const started = new Map(
    mine.map((p) => [String(p.scenarioId), String(p._id)]),
  );
  console.log("started:", started);
  return scenarios.map((s) => ({
    id: String(s._id),
    title: s.title,
    sceneSetup: s.sceneSetup,
    incidentCount: s.incidents.length,
    firstGoals:
      s.incidents
        .find((i) => i.id === s.startIncident)
        ?.milestones.map((m) => m.goal) ?? [],
    progressId: started.get(String(s._id)) ?? null,
  }));
}


export async function listChats(): Promise<ChatSummary[]> {
  const { userId } = await requireUser();
  const progresses = await UserScenarioProgress.find({ userId })
    .sort({ updatedAt: -1 })
    .lean<IUserScenarioProgress[]>();
  const scenarios = await Scenario.find({
    _id: { $in: progresses.map((p) => p.scenarioId) },
  }).lean<IScenario[]>();

  return Promise.all(
    progresses.map(async (p) => {
      const s = scenarios.find((x) => String(x._id) === String(p.scenarioId));
      const incident = s?.incidents.find((i) => i.id === p.currentIncidentId);
      const ip = p.incidents.find((i) => i.incidentId === p.currentIncidentId);
      const last = await Message.findOne({
        progressId: p._id,
        incidentId: p.currentIncidentId,
        channel: "group",
      })
        .sort({ createdAt: -1, _id: -1 })
        .lean();
      return {
        progressId: String(p._id),
        scenarioTitle: s?.title ?? "Mission",
        incidentTitle: incident?.title ?? "",
        lastText: last
          ? `${last.senderType === "user" ? "You" : nameOf(s!, last.senderId)}: ${last.text}`
          : "",
        lastAt: (last?.createdAt ?? p.updatedAt).toISOString(),
        done: ip?.milestonesDone.length ?? 0,
        total: incident?.milestones.length ?? 0,
        completed:
          ip?.status === "completed" &&
          s?.incidents.at(-1)?.id === p.currentIncidentId,
      };
    }),
  );
}

export async function getThread(progressId: string): Promise<ThreadView> {
  const { userId } = await requireUser();
  return buildThread(progressId, userId);
}

// ── Start a scenario ─────────────────────────────────────────────────────────

export async function startScenario(scenarioId: string): Promise<string> {
  const user = await requireUser();
  if (!isValidObjectId(scenarioId)) throw new Error("Scenario not found.");
  const scenario = await Scenario.findOne({
    _id: scenarioId,
    published: true,
  }).lean<IScenario>();
  if (!scenario) throw new Error("Scenario not found.");

  const existing = await UserScenarioProgress.findOne(
    { userId: user.userId, scenarioId },
    "_id",
  ).lean();
  if (existing) return String(existing._id);

  const incident = scenario.incidents.find(
    (i) => i.id === scenario.startIncident,
  )!;
  const guide = await guideOf(incident);
  // Ask the AI first, so a failed call leaves nothing half-created.
  const ctx = await storyContext(
    {
      cefrLevel: user.level,
      memorySummary: "",
      hiddenState: {},
      incidentCount: 0,
      done: [],
    },
    scenario,
    incident,
    guide.name,
  );
  const turn = await storyTurn(ctx, null);

  const progress = await UserScenarioProgress.create({
    userId: user.userId,
    scenarioId: scenario._id,
    currentIncidentId: incident.id,
    incidents: [{ incidentId: incident.id }],
    cefrLevel: user.level,
    hiddenState: { moods: turn.moods },
  });
  await saveTurn(progress._id, scenario._id, incident, guide, turn, user);
  return String(progress._id);
}

// ── Send a message ───────────────────────────────────────────────────────────

export async function sendMessage(
  progressId: string,
  rawText: string,
): Promise<ThreadView> {
  const text = rawText.trim().slice(0, 500);
  if (!text) throw new Error("Write a message first.");
  const user = await requireUser();
  const { progress, scenario } = await loadOwned(progressId, user.userId);
  const incident = currentIncident(progress, scenario);
  const ip = progress.incidents.find((i) => i.incidentId === incident.id)!;
  if (ip.status === "completed") throw new Error("This scene is finished.");

  const guide = await guideOf(incident);
  const ctx = await storyContext(
    {
      cefrLevel: progress.cefrLevel,
      memorySummary: progress.memorySummary,
      hiddenState: progress.hiddenState,
      incidentCount: ip.userMessageCount,
      done: ip.milestonesDone,
      progressId: progress._id,
    },
    scenario,
    incident,
    guide.name,
  );

  // The story and the language check do not depend on each other, so they run at the same time.
  // A failed check must never block the conversation. A failed story call does, and nothing is saved.
  const [turn, check] = await Promise.all([
    storyTurn(ctx, text),
    getTopics()
      .then((topics) =>
        checkMessage(text, progress.cefrLevel, user.nativeLanguage, topics),
      )
      .catch(() => ({ mistakes: [] as Mistake[], words: [] as WordInfo[] })),
  ]);

  await Message.create({
    progressId: progress._id,
    incidentId: incident.id,
    channel: "group",
    senderType: "user",
    senderId: user.userId,
    text,
    mistakes: check.mistakes,
  });
  await saveTurn(progress._id, scenario._id, incident, guide, turn, user);
  await saveWords(user, check.words, "mistake", scenario._id, incident.id);

  const moodUpdates = Object.fromEntries(
    Object.entries(turn.moods).map(([id, m]) => [`hiddenState.moods.${id}`, m]),
  );
  await UserScenarioProgress.updateOne(
    { _id: progress._id, "incidents.incidentId": incident.id },
    {
      $addToSet: {
        "incidents.$.milestonesDone": { $each: turn.milestonesDone },
      },
      $inc: {
        "incidents.$.userMessageCount": 1,
        "incidents.$.mistakeCount": check.mistakes.length,
      },
      $set: moodUpdates,
    },
  );

  const done = new Set([...ip.milestonesDone, ...turn.milestonesDone]);
  if (
    done.size === incident.milestones.length ||
    ip.userMessageCount + 1 >= MAX_MESSAGES
  ) {
    await completeIncident(
      progress,
      scenario,
      incident,
      user,
      done.size === incident.milestones.length,
    );
  }
  return buildThread(progressId, user.userId);
}

// ── End of a scene: count, write feedback, give XP ───────────────────────────

async function completeIncident(
  progress: IUserScenarioProgress,
  scenario: IScenario,
  incident: Incident,
  user: { userId: string; level: string; nativeLanguage: string },
  allGoalsDone: boolean,
) {
  const [mine, topics, saved, fresh] = await Promise.all([
    Message.find({
      progressId: progress._id,
      incidentId: incident.id,
      channel: "group",
      senderType: "user",
    }).lean(),
    getTopics(),
    UserVocab.find(
      {
        userId: user.userId,
        scenarioId: scenario._id,
        incidentId: incident.id,
      } as never,
      "word",
    ).lean(),
    UserScenarioProgress.findById(progress._id).lean<IUserScenarioProgress>(),
  ]);
  const doneIds =
    fresh?.incidents.find((i) => i.incidentId === incident.id)
      ?.milestonesDone ?? [];
  const mistakes = mine.flatMap((m) => m.mistakes);

  // Plain counting, no AI: which grammar topics came up most.
  const counts = new Map<string, number>();
  for (const m of mistakes)
    for (const slug of m.topicSlugs)
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
  const topTopics = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug, count]) => ({
      slug,
      title: topics.find((t) => t.slug === slug)?.title ?? slug,
      count,
    }));
  const examples = mistakes
    .slice(0, 3)
    .map(({ wrong, right, why }) => ({ wrong, right, why }));

  // One AI call turns those numbers into a kind summary.
  const fb = await writeFeedback({
    scenarioTitle: scenario.title,
    incidentTitle: incident.title,
    level: progress.cefrLevel,
    nativeLanguage: user.nativeLanguage,
    messages: mine.length,
    mistakes: mistakes.length,
    topics: topTopics,
    examples,
    goals: incident.milestones.map((m) => ({
      goal: m.goal,
      done: doneIds.includes(m.id),
    })),
  });

  const feedback: FeedbackView = {
    summary: fb.summary,
    wins: fb.wins,
    focus: fb.focus,
    messages: mine.length,
    mistakes: mistakes.length,
    topics: topTopics,
    examples,
    words: saved.map((w) => w.word).slice(0, 8),
    allGoalsDone,
  };
  await UserScenarioProgress.updateOne(
    { _id: progress._id, "incidents.incidentId": incident.id },
    {
      $set: {
        "incidents.$.status": "completed",
        "incidents.$.feedback": feedback,
        memorySummary: `${progress.memorySummary} ${fb.memory}`
          .trim()
          .slice(-600),
      },
    },
  );
  await awardXp(user.userId, allGoalsDone ? XP_ALL_GOALS : XP_PARTIAL);
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

export async function nextIncident(progressId: string): Promise<ThreadView> {
  const user = await requireUser();
  const { progress, scenario } = await loadOwned(progressId, user.userId);
  const index = scenario.incidents.findIndex(
    (i) => i.id === progress.currentIncidentId,
  );
  const ip = progress.incidents.find(
    (i) => i.incidentId === progress.currentIncidentId,
  );
  const incident = scenario.incidents[index + 1];
  if (ip?.status !== "completed" || !incident)
    throw new Error("There is no next scene yet.");

  const guide = await guideOf(incident);
  const ctx = await storyContext(
    {
      cefrLevel: progress.cefrLevel,
      memorySummary: progress.memorySummary,
      hiddenState: progress.hiddenState,
      incidentCount: 0,
      done: [],
    },
    scenario,
    incident,
    guide.name,
  );
  const turn = await storyTurn(ctx, null);

  await UserScenarioProgress.updateOne(
    { _id: progress._id },
    {
      $set: {
        currentIncidentId: incident.id,
        ...Object.fromEntries(
          Object.entries(turn.moods).map(([id, m]) => [
            `hiddenState.moods.${id}`,
            m,
          ]),
        ),
      },
      $push: { incidents: { incidentId: incident.id } },
    },
  );
  await saveTurn(progress._id, scenario._id, incident, guide, turn, user);
  return buildThread(progressId, user.userId);
}

// ── Ask the guide / translate ────────────────────────────────────────────────

export async function askGuide(
  progressId: string,
  rawQuestion: string,
): Promise<ThreadView> {
  const question = rawQuestion.trim().slice(0, 300);
  if (!question) throw new Error("Ask something first.");
  const user = await requireUser();
  const { progress, scenario } = await loadOwned(progressId, user.userId);
  const incident = currentIncident(progress, scenario);
  const ip = progress.incidents.find((i) => i.incidentId === incident.id)!;
  const guide = await guideOf(incident);

  const ctx = await storyContext(
    {
      cefrLevel: progress.cefrLevel,
      memorySummary: progress.memorySummary,
      hiddenState: progress.hiddenState,
      incidentCount: ip.userMessageCount,
      done: ip.milestonesDone,
      progressId: progress._id,
    },
    scenario,
    incident,
    guide.name,
  );
  const answer = await guideAnswer(ctx, question);
  if (!answer) throw new Error("The guide could not answer. Try again.");

  const base = {
    progressId: progress._id,
    incidentId: incident.id,
    channel: "guide",
  };
  await Message.insertMany([
    { ...base, senderType: "user", senderId: user.userId, text: question },
    { ...base, senderType: "guide", senderId: guide.id, text: answer },
  ]);
  return buildThread(progressId, user.userId);
}

export async function translateMessage(messageId: string): Promise<string> {
  const user = await requireUser();
  if (!isValidObjectId(messageId)) throw new Error("Message not found.");
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message not found.");
  await loadOwned(String(message.progressId), user.userId); // makes sure the message belongs to this user
  if (message.translation) return message.translation;

  message.translation = await translateText(message.text, user.nativeLanguage);
  await message.save();
  return message.translation;
}

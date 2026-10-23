// The AI calls behind the chat. No database here: everything comes in as arguments and goes out as plain data,
// so each step is easy to read and to test. Whatever the AI returns is checked before we trust it.
import { ai } from "@/lib/ai";

import {
  checkSystem, feedbackSystem, feedbackUser, guideSystem, guideUser, storySystem, storyUser,
  type FeedbackInput, type StoryContext,
} from "./prompts";
import { MISTAKE_CATEGORIES, type Mistake, type MistakeCategory, type Mood, type WordInfo } from "./types";

export type StoryTurn = {
  replies: { characterId: string; text: string }[];
  milestonesDone: string[];
  moods: Record<string, Mood>;
  guide: string;
  vocab: WordInfo[];
};

// The language check can use a cheaper model than the story (AI_CHECK_MODEL). Same endpoint and key.
const checker = process.env.AI_CHECK_MODEL ? ai.with({ model: process.env.AI_CHECK_MODEL }) : ai;

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function cleanWords(v: unknown): WordInfo[] {
  const words: WordInfo[] = [];
  for (const w of list(v) as Record<string, unknown>[]) {
    const word = str(w?.word, 40).toLowerCase();
    const meaning = str(w?.meaning, 160);
    const example = str(w?.example, 200);
    if (/^[a-z][a-z' -]*$/.test(word) && meaning && example) words.push({ word, partOfSpeech: str(w.partOfSpeech, 20).toLowerCase() || "noun", meaning, example });
  }
  return words.slice(0, 2);
}

// ── 1. The story: characters answer, goals are ticked, moods move, the guide speaks ──

export async function storyTurn(c: StoryContext, userText: string | null): Promise<StoryTurn> {
  const raw = await ai.json<Record<string, unknown>>(storyUser(c, userText), { system: storySystem(c), temperature: 0.8, maxTokens: 1200 });
  const known = new Set(c.characters.map((p) => p.id));
  const openIds = new Set(c.incident.milestones.map((m) => m.id).filter((id) => !c.done.includes(id)));

  const replies = (list(raw.replies) as Record<string, unknown>[])
    .map((r) => ({ characterId: str(r?.characterId, 40), text: str(r?.text, 600) }))
    .filter((r) => known.has(r.characterId) && r.text)
    .slice(0, 3);
  if (!replies.length) throw new Error("The AI returned no usable reply.");

  const moods: Record<string, Mood> = {};
  for (const [id, m] of Object.entries((raw.moods ?? {}) as Record<string, Record<string, unknown>>)) {
    const trust = Number(m?.trust);
    if (known.has(id) && str(m?.mood, 30) && Number.isFinite(trust)) moods[id] = { mood: str(m.mood, 30), trust: Math.max(0, Math.min(10, Math.round(trust))) };
  }

  return {
    replies,
    milestonesDone: userText === null ? [] : [...new Set(list(raw.milestonesDone).map((id) => str(id, 20)))].filter((id) => openIds.has(id)),
    moods,
    guide: str(raw.guide, 500),
    vocab: cleanWords(raw.vocab),
  };
}

// ── 2. The language check: mistakes tagged with grammar topics, plus words worth saving ──

export type Topic = { slug: string; title: string };

// Very short messages ("ok", "yes sir") are not worth a call.
export const needsCheck = (text: string) => text.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length >= 3;

export async function checkMessage(text: string, level: string, nativeLanguage: string, topics: Topic[]): Promise<{ mistakes: Mistake[]; words: WordInfo[] }> {
  if (!needsCheck(text)) return { mistakes: [], words: [] };
  const raw = await checker.json<Record<string, unknown>>(text, { system: checkSystem(level, nativeLanguage, topics), temperature: 0.1, maxTokens: 800 });
  const slugs = new Set(topics.map((t) => t.slug));
  const lower = text.toLowerCase();

  const mistakes: Mistake[] = [];
  for (const m of list(raw.mistakes) as Record<string, unknown>[]) {
    const wrong = str(m?.wrong, 200);
    const right = str(m?.right, 200);
    const why = str(m?.why, 300);
    // "wrong" must really be in the message, otherwise the tip would point at nothing.
    if (!wrong || !right || !why || wrong === right || !lower.includes(wrong.toLowerCase())) continue;

    const topicSlugs = [...new Set(list(m.topicSlugs).map((s) => str(s, 60)))].filter((s) => slugs.has(s)).slice(0, 3);
    const given = str(m.category, 20) as MistakeCategory;
    const category: MistakeCategory = topicSlugs.length ? "grammar" : MISTAKE_CATEGORIES.includes(given) && given !== "grammar" ? given : "other";
    mistakes.push({ wrong, right, why, whyNative: str(m.whyNative, 300) || undefined, topicSlugs, category });
  }
  return { mistakes: mistakes.slice(0, 3), words: cleanWords(raw.words) };
}

// ── 3. The guide answers a question the learner asked ──

export async function guideAnswer(c: StoryContext, question: string): Promise<string> {
  const text = await ai(guideUser(c, question), { system: guideSystem(c), temperature: 0.5, maxTokens: 400 });
  return str(text, 600);
}

// ── 4. End of scene: warm summary written from numbers we already counted ──

export type Feedback = { summary: string; wins: string[]; focus: string[]; memory: string };

export async function writeFeedback(f: FeedbackInput): Promise<Feedback> {
  try {
    const raw = await ai.json<Record<string, unknown>>(feedbackUser(f), { system: feedbackSystem(), temperature: 0.5, maxTokens: 700 });
    return {
      summary: str(raw.summary, 600),
      wins: list(raw.wins).map((w) => str(w, 200)).filter(Boolean).slice(0, 3),
      focus: list(raw.focus).map((w) => str(w, 200)).filter(Boolean).slice(0, 3),
      memory: str(raw.memory, 300),
    };
  } catch {
    // The numbers are already saved, so a failed summary must not block finishing the scene.
    return { summary: "Well done for finishing this scene.", wins: [], focus: [], memory: `${f.scenarioTitle}: ${f.incidentTitle} was completed.` };
  }
}

// ── 5. Translate one message into the learner's language (only when they tap Translate) ──

export async function translateText(text: string, language: string): Promise<string> {
  return str(await ai(text, { system: `Translate the user's message into ${language}. Reply with the translation only.`, temperature: 0.1, maxTokens: 500 }), 800);
}

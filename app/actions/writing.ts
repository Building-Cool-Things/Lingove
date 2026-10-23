"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { chat, parseJson } from "@/lib/ai";
import { UserProfile, type UserProfileDocument } from "@/models/user-profile";
import { LEVEL_LABELS, WORD_LIMITS, WRITING_XP } from "@/lib/skill-config";
import { WritingModel, type Writing, type WritingCorrection } from "@/models/writing";
import { VocabularyModel } from "@/models/vocab";

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export type WritingQuestion = {
  // Writing model fields
  title: string;
  topic: string;
  description: string;
  prompt: string;
  type:
    | "ESSAY"
    | "EMAIL"
    | "LETTER"
    | "MEMO"
    | "REVIEW"
    | "REPORT"
    | "STORY"
    | "SUMMARY";
  promptType: "TEXT" | "CHART" | "TABLE" | "MAP" | "PROCESS" | "IMAGE";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  minWords: number;
  recommendedWords: number;
  maxWords: number;
  // UI display fields
  tips: string[];
  level: string;
  targetWords: string;
};

function resolveWritingDifficulty(profile: {
  writingDifficulty: "EASY" | "MEDIUM" | "HARD";
  writingLastActivityAt: Date | null;
  writingRecentScores: number[];
  writingTotalSubmissions: number;
}): "EASY" | "MEDIUM" | "HARD" {
  const {
    writingDifficulty,
    writingLastActivityAt,
    writingRecentScores,
    writingTotalSubmissions,
  } = profile;

  if (writingTotalSubmissions === 0) return "EASY";

  if (writingLastActivityAt) {
    const daysSinceLast =
      (Date.now() - new Date(writingLastActivityAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysSinceLast > 14) return "EASY";
    if (daysSinceLast > 7 && writingDifficulty === "HARD") return "MEDIUM";
  }

  if (writingRecentScores.length < 3) return writingDifficulty;

  const last3 = writingRecentScores.slice(-3);
  const avg = last3.reduce((a, b) => a + b, 0) / 3;

  if (avg >= 7.0) {
    if (writingDifficulty === "EASY") return "MEDIUM";
    if (writingDifficulty === "MEDIUM") return "HARD";
    if (writingDifficulty === "HARD") return "HARD";
  }

  if (avg <= 4.5) {
    if (writingDifficulty === "HARD") return "MEDIUM";
    if (writingDifficulty === "MEDIUM") return "EASY";
    if (writingDifficulty === "EASY") return "EASY";
  }

  return writingDifficulty;
}

const FALLBACK_TOPICS = [
  "environment",
  "technology",
  "education",
  "health",
  "society",
  "economy",
  "culture",
  "travel",
  "work",
  "media",
  "crime",
  "family",
  "food",
  "sport",
  "politics",
];

function resolveTopic(recentTopics: string[], interests: string[]): string {
  const last3 = recentTopics.slice(-3);

  // use interests as topic pool if available, else fallback
  const pool = interests.length > 0 ? interests : FALLBACK_TOPICS;
  const available = pool.filter((t) => !last3.includes(t));

  // if all interests were recently used, reset and use all
  const final = available.length > 0 ? available : pool;
  return final[Math.floor(Math.random() * final.length)];
}


const DIFFICULTY_GUIDE = {
  EASY: `
- Simple everyday vocabulary
- One clear opinion or description
- Short sentences are fine
- Basic structure: intro, 1-2 points, conclusion`,
  MEDIUM: `
- Mix of simple and advanced vocabulary
- Structured argument with reasons and examples
- At least 2 perspectives considered
- Clear paragraphing expected`,
  HARD: `
- Advanced and varied vocabulary
- Nuanced argument with multiple perspectives
- Critical thinking and strong coherence required
- Complex sentence structures expected`,
};

export async function generateWritingQuestion(): Promise<WritingQuestion> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const profile = await UserProfile.findOne({ authUserId: user.id }).lean();

  const interests = profile?.interests ?? [];
  const recentTopics = profile?.writingRecentTopics ?? [];

  const difficulty = resolveWritingDifficulty(
    profile ?? {
      writingDifficulty: "EASY",
      writingLastActivityAt: null,
      writingRecentScores: [],
      writingTotalSubmissions: 0,
    },
  );

  const topic = resolveTopic(recentTopics, interests);
  const words = WORD_LIMITS[difficulty];
  const level = LEVEL_LABELS[difficulty];

  const reply = await chat(
    [
      {
        role: "system",
        content: `You are a strict IELTS writing examiner and English language expert. Your job is to generate authentic IELTS-style writing tasks tailored to the learner's profile. The topic should be unique and relevant to the learner and thought provoking. Return ONLY valid JSON — no markdown, no explanation, no extra text outside the JSON object.`,
      },
      {
        role: "user",
        content: `Generate one IELTS-style writing task for a learner with this profile:
- Name: ${user.name}
- Interests: ${interests.join(", ") || "none"}
- Topic for this task: ${topic}
- Difficulty: ${difficulty}
- Target word count: ${words.range}

Difficulty requirements for ${difficulty}:
${DIFFICULTY_GUIDE[difficulty]}

Task requirements:
- Directly connected to the topic and the learner's interests where possible
- Opinion or discussion style (not yes/no)
- Thought-provoking but appropriate for the difficulty level
- Self-contained — learner must understand the task without extra context

Return ONLY this JSON (all fields required):
{
  "title": "Short descriptive title (5 words max)",
  "description": "One sentence describing what the learner must do",
  "prompt": "Full IELTS-style task text exactly as shown to the learner",
  "type": one of "ESSAY" | "EMAIL" | "LETTER" | "MEMO" | "REVIEW" | "REPORT" | "STORY" | "SUMMARY",
  "promptType": one of "TEXT" | "CHART" | "TABLE" | "MAP" | "PROCESS" | "IMAGE",
  "minWords": minimum word count appropriate for this writing type (integer, within ${words.min}–${words.max}),
  "recommendedWords": ideal target word count (integer, within ${words.min}–${words.max}),
  "maxWords": maximum word count (integer, within ${words.min}–${words.max}),
  "tips": [
    "Actionable tip 1 (8 words max)",
    "Actionable tip 2 (8 words max)",
    "Actionable tip 3 (8 words max)"
  ]
}`,
      },
    ],
    { temperature: 0.8, maxTokens: 600 },
  );

  const parsed = parseJson(reply) as Omit<WritingQuestion, "topic" | "difficulty" | "level" | "targetWords">;

  await UserProfile.findOneAndUpdate(
    { authUserId: user.id },
    {
      $push: {
        writingRecentTopics: {
          $each: [topic],
          $slice: -10,
        },
      },
    },
  );

  return {
    title: parsed.title,
    topic,
    description: parsed.description,
    prompt: parsed.prompt,
    type: parsed.type,
    promptType: parsed.promptType,
    difficulty,
    minWords: parsed.minWords ?? words.min,
    recommendedWords: parsed.recommendedWords ?? words.recommended,
    maxWords: parsed.maxWords ?? words.max,
    tips: parsed.tips ?? [],
    level,
    targetWords: words.range,
  };
}

// ── Submit a writing draft ────────────────────────────────────────────────────
const saveDrafts = async (
  userId: string,
  question: WritingQuestion,
  draft: string,
  wordCount: number,
) => {
  await connectDB();
  const submission = await WritingModel.create({
    userId: userId,
    answer: draft,
    wordCount,
    ...question,
  });
  return (submission._id as { toString(): string }).toString();
};
type AnalysisResult = {
  sentenceAnalysis: {
    index: number;
    original: string;
    hasError: boolean;
    errorType: string | null;
    errorExplanation: string | null;
    correctedSentence: string | null;
    improvementTip: string | null;
  }[];
  grammarSummary: {
    totalSentences: number;
    errorCount: number;
    mostCommonError: string | null;
  } | null;
  vocabEvaluation: { word: string; usedCorrectly: boolean; suggestion: string | null }[];
  strongWords: string[];
  missedWords: string[];
  idealAnswer: string | null;
  generalFeedback: string | null;
  improvementPlan: string[];
  vocabulary: Record<string, unknown>[];
  corrections?: WritingCorrection[];
};

const getAnalysis = async (
  question: WritingQuestion,
  draft: string,
  wordCount: number,
): Promise<AnalysisResult | null> => {
  const reply = await chat(
    [
      {
        role: "system",
        content: `You are a strict IELTS writing examiner and English language expert. Evaluate the learner's writing honestly and return ONLY valid JSON — no markdown fences, no explanation, no extra text before or after the JSON object. IMPORTANT: every string value must be on one line — use \\n for line breaks, escape any double-quote characters inside string values as \\", and never include raw newlines or unescaped quotes inside a JSON string.`,
      },
      {
        role: "user",
        content: `Evaluate this learner's essay against the given writing task.

TASK:
Type: ${question.type}
Difficulty: ${question.difficulty}
Prompt: ${question.prompt}
Expected words: ${question.minWords}–${question.recommendedWords}
user's word count: ${wordCount}

LEARNER'S ESSAY:
${draft}

Return ONLY this JSON:
{
  "sentenceAnalysis": [
    {
      "index": 0,
      "original": "original sentence",
      "hasError": true,
      "errorType": "grammar | spelling | punctuation | clarity | structure | null",
      "errorExplanation": "what is wrong and why",
      "correctedSentence": "corrected version or null",
      "improvementTip": "how to avoid this next time or null"
    }
  ],
  "grammarSummary": {
    "totalSentences": 10,
    "errorCount": 3,
    "mostCommonError": "subject-verb agreement"
  },
  "vocabEvaluation": [
    {
      "word": "word the learner used",
      "usedCorrectly": true,
      "suggestion": "better alternative or null"
    }
  ],
  "strongWords": ["word1", "word2"],
  "missedWords": ["word1", "word2"],
  "idealAnswer": "A full model essay written by an expert examiner for this exact task",
  "generalFeedback": "2-3 sentence honest overall comment on the essay",
  "improvementPlan": [
    "Specific thing to improve next time 1",
    "Specific thing to improve next time 2",
    "Specific thing to improve next time 3"
  ],
  "corrections": [
    {
      "sentence": 0,
      "type": "grammar | spelling | punctuation | clarity | structure",
      "rule": "short rule name, e.g. subject-verb agreement, articles, capital letters, linking words",
      "find": "the exact wrong words copied character-for-character from the learner's essay (as short as possible)",
      "replace": "the corrected words that replace \\"find\\"",
      "why": "one short sentence explaining the rule"
    }
  ],
  "vocabulary": [
    {
      "word": "example",
      "level": "A1 | A2 | B1 | B2 | C1 | C2",
      "difficulty": "EASY | MEDIUM | HARD",
      "partOfSpeech": "NOUN | VERB | ADJECTIVE | ADVERB | PRONOUN | PREPOSITION | CONJUNCTION | INTERJECTION",
      "meaning": "definition of the word",
      "pronunciation": "/ɪɡˈzɑːmpəl/",
      "examples": ["This is an example sentence."],
      "synonyms": ["instance", "illustration"],
      "antonyms": ["counterexample"],
      "collocations": ["make an example of", "for example"],
      "phrasalForms": ["set an example", "take for example"],
      "tags": ["academic", "formal"]
    }
  ]
}`,
      },
    ],
    { temperature: 0.8 },
  );

  return parseJson(reply) as AnalysisResult;
};


export async function submitWriting(
  question: WritingQuestion,
  draft: string,
  wordCount: number,
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const [id, analysis, profile] = await Promise.all([
    saveDrafts(user.id, question, draft, wordCount),
    getAnalysis(question, draft, wordCount),
    UserProfile.findOne({ authUserId: user.id }).lean<UserProfileDocument>(),
  ]);

  if (analysis) {
    await WritingModel.findByIdAndUpdate(id, {
      sentenceAnalysis: analysis.sentenceAnalysis,
      grammarSummary: analysis.grammarSummary,
      vocabEvaluation: analysis.vocabEvaluation,
      strongWords: analysis.strongWords,
      missedWords: analysis.missedWords,
      idealAnswer: analysis.idealAnswer,
      generalFeedback: analysis.generalFeedback,
      improvementPlan: analysis.improvementPlan,
      corrections: (analysis.corrections ?? []).filter((c) => c?.find && draft.includes(c.find)),
      analysisStatus: "COMPLETED",
    });
    if (analysis.vocabulary?.length) {
      await VocabularyModel.bulkWrite(
        analysis.vocabulary.map((v) => ({
          updateOne: {
            filter: { word: (v as { word: string }).word },
            update: { $setOnInsert: v },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    // Derive a 1–10 score from grammar error rate
    const errorCount    = analysis.grammarSummary?.errorCount    ?? 0;
    const totalSentences = analysis.grammarSummary?.totalSentences ?? 1;
    const score = Math.max(1, Math.min(10,
      Math.round((1 - errorCount / Math.max(1, totalSentences)) * 10),
    ));

    const xpGained = WRITING_XP[question.difficulty];

    // Streak: same calendar day → keep, yesterday → extend, older → reset
    const now = new Date();
    let newStreak = 1;
    if (profile?.lastActivityAt) {
      const lastDay = new Date(profile.lastActivityAt);
      lastDay.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) newStreak = profile.currentStreak ?? 1;
      else if (diffDays === 1) newStreak = (profile.currentStreak ?? 0) + 1;
      // else stays 1 (streak broken)
    }
    const newLongest = Math.max(newStreak, profile?.longestStreak ?? 0);

    // Re-evaluate difficulty with the new score included
    const updatedScores = [...(profile?.writingRecentScores ?? []), score].slice(-10);
    const newDifficulty = resolveWritingDifficulty({
      writingDifficulty: question.difficulty,
      writingLastActivityAt: now,
      writingRecentScores: updatedScores,
      writingTotalSubmissions: (profile?.writingTotalSubmissions ?? 0) + 1,
    });

    await UserProfile.findOneAndUpdate(
      { authUserId: user.id },
      {
        $inc: {
          writingTotalSubmissions: 1,
          totalXP: xpGained,
        },
        $push: {
          writingRecentScores: { $each: [score], $slice: -10 },
        },
        $set: {
          writingLastActivityAt: now,
          lastActivityAt: now,
          currentStreak: newStreak,
          longestStreak: newLongest,
          writingDifficulty: newDifficulty,
        },
      },
    );
  }

  return id;
}

// ── Serialisable type returned to client/server components ───────────────────

export type WritingView = {
  id: string;
  title: string;
  topic: string;
  prompt: string;
  type: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  answer: string;
  wordCount: number;
  analysisStatus: "PENDING" | "COMPLETED";
  sentenceAnalysis: {
    index: number;
    original: string;
    hasError: boolean;
    errorType: string | null;
    errorExplanation: string | null;
    correctedSentence: string | null;
    improvementTip: string | null;
  }[];
  grammarSummary: {
    totalSentences: number;
    errorCount: number;
    mostCommonError: string | null;
  } | null;
  vocabEvaluation: { word: string; usedCorrectly: boolean; suggestion: string | null }[];
  strongWords: string[];
  missedWords: string[];
  idealAnswer: string | null;
  generalFeedback: string | null;
  improvementPlan: string[];
  corrections: WritingCorrection[];
  createdAt: string;
};

function serializeWriting(doc: Writing): WritingView {
  return {
    id: String(doc._id),
    title: doc.title ?? "",
    topic: doc.topic ?? "",
    prompt: doc.prompt ?? "",
    type: doc.type ?? "",
    difficulty: doc.difficulty,
    answer: doc.answer ?? "",
    wordCount: doc.wordCount ?? 0,
    analysisStatus: doc.analysisStatus,
    sentenceAnalysis: doc.sentenceAnalysis ?? [],
    grammarSummary: doc.grammarSummary ?? null,
    vocabEvaluation: doc.vocabEvaluation ?? [],
    strongWords: doc.strongWords ?? [],
    missedWords: doc.missedWords ?? [],
    idealAnswer: doc.idealAnswer ?? null,
    generalFeedback: doc.generalFeedback ?? null,
    improvementPlan: doc.improvementPlan ?? [],
    corrections: (doc.corrections ?? []).map((c) => ({ sentence: c.sentence, type: c.type, rule: c.rule, find: c.find, replace: c.replace, why: c.why })),
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function getSubmission(id: string): Promise<WritingView | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await connectDB();
  const doc = await WritingModel.findById(id).lean<Writing>();
  if (!doc) return null;
  return serializeWriting(doc);
}

export async function getOrGenerateAnalysis(id: string): Promise<WritingView | null> {
  return getSubmission(id);
}

// Lingov writing session: save and analyse, then return the analysis and the XP earned.
export async function submitWritingSession(
  question: WritingQuestion,
  draft: string,
  wordCount: number,
): Promise<{ view: WritingView; xp: number }> {
  const id = await submitWriting(question, draft, wordCount);
  const view = await getSubmission(id);
  if (!view || view.analysisStatus !== "COMPLETED") throw new Error("We could not check your writing. Please try again.");
  return { view, xp: WRITING_XP[question.difficulty] };
}

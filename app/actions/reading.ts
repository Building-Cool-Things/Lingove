"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { chat, parseJson } from "@/lib/ai";
import { UserProfile, type UserProfileDocument } from "@/models/user-profile";
import { LEVEL_LABELS, READING_XP, SESSION_QUESTIONS } from "@/lib/skill-config";
import { ReadingModel, type Reading } from "@/models/reading";

// ── JSON repair helper ────────────────────────────────────────────────────────
async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReadingTaskQuestion = {
  index: number;
  text: string;
  type: "MCQ" | "TRUE_FALSE_NG" | "SHORT_ANSWER";
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  // Lingov session extras: 0-based paragraph holding the answer, skill tested.
  paragraph?: number;
  skill?: "details" | "tfng" | "vocab";
};

export type GlossaryWord = { word: string; ipa: string; meaning: string; native: string; partOfSpeech: string };

export type ReadingTask = {
  title: string;
  topic: string;
  passageType: "ARTICLE" | "ACADEMIC" | "STORY" | "OPINION" | "NEWS";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  passage: string;
  passageWordCount: number;
  questions: ReadingTaskQuestion[];
  tips: string[];
  level: string;
  glossary?: GlossaryWord[];
};

// ── Difficulty resolution ─────────────────────────────────────────────────────

function resolveReadingDifficulty(profile: {
  readingDifficulty: "EASY" | "MEDIUM" | "HARD";
  readingLastActivityAt: Date | null;
  readingRecentScores: number[];
  readingTotalSubmissions: number;
}): "EASY" | "MEDIUM" | "HARD" {
  const {
    readingDifficulty,
    readingLastActivityAt,
    readingRecentScores,
    readingTotalSubmissions,
  } = profile;

  if (readingTotalSubmissions === 0) return "EASY";

  if (readingLastActivityAt) {
    const daysSinceLast =
      (Date.now() - new Date(readingLastActivityAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceLast > 14) return "EASY";
    if (daysSinceLast > 7 && readingDifficulty === "HARD") return "MEDIUM";
  }

  if (readingRecentScores.length < 3) return readingDifficulty;

  const last3 = readingRecentScores.slice(-3);
  const avg = last3.reduce((a, b) => a + b, 0) / 3;

  if (avg >= 7.5) {
    if (readingDifficulty === "EASY") return "MEDIUM";
    if (readingDifficulty === "MEDIUM") return "HARD";
  }
  if (avg <= 4.5) {
    if (readingDifficulty === "HARD") return "MEDIUM";
    if (readingDifficulty === "MEDIUM") return "EASY";
  }

  return readingDifficulty;
}

// ── Topic resolution ──────────────────────────────────────────────────────────

const FALLBACK_TOPICS = [
  "environment", "technology", "education", "health", "society",
  "economy", "culture", "travel", "work", "media", "science",
  "food", "sport", "history", "art",
];

function resolveTopic(recentTopics: string[], interests: string[]): string {
  const last3 = recentTopics.slice(-3);
  const pool = interests.length > 0 ? interests : FALLBACK_TOPICS;
  const available = pool.filter((t) => !last3.includes(t));
  const final = available.length > 0 ? available : pool;
  return final[Math.floor(Math.random() * final.length)];
}

// ── Difficulty config ─────────────────────────────────────────────────────────

const PASSAGE_CONFIG = {
  EASY:   { wordRange: "200–280", questionCount: 5,  questionTypes: "MCQ and TRUE_FALSE_NG only" },
  MEDIUM: { wordRange: "320–400", questionCount: 8,  questionTypes: "mix of MCQ, TRUE_FALSE_NG, and 1 SHORT_ANSWER" },
  HARD:   { wordRange: "500–650", questionCount: 12,  questionTypes: "mix of MCQ, TRUE_FALSE_NG, and SHORT_ANSWER" },
};


const DIFFICULTY_GUIDE = {
  EASY: `
- Familiar everyday topics
- Simple sentence structures and common vocabulary
- Questions test explicit information (directly stated in passage)
- MCQ options are clearly different`,
  MEDIUM: `
- Semi-academic or news-style topics
- Mix of simple and complex vocabulary
- Questions test both explicit and implicit information
- Some inference required`,
  HARD: `
- Academic or analytical topics
- Advanced vocabulary and complex structures
- Questions test inference, attitude, and purpose
- Short answers require understanding of argument or writer's view`,
};

// ── Generate reading task ─────────────────────────────────────────────────────

// objectiveOnly: Lingov session format, exactly 5 MCQ / TRUE_FALSE_NG questions.
export async function generateReadingTask(opts: { objectiveOnly?: boolean } = {}): Promise<ReadingTask> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const profile = await UserProfile.findOne({ authUserId: user.id }).lean();

  const interests = profile?.interests ?? [];
  const recentTopics = profile?.readingRecentTopics ?? [];

  const difficulty = resolveReadingDifficulty(
    profile ?? {
      readingDifficulty: "EASY",
      readingLastActivityAt: null,
      readingRecentScores: [],
      readingTotalSubmissions: 0,
    }
  );

  const topic = resolveTopic(recentTopics, interests);
  const config = opts.objectiveOnly
    ? { ...PASSAGE_CONFIG[difficulty], questionCount: SESSION_QUESTIONS, questionTypes: "MCQ and TRUE_FALSE_NG only" }
    : PASSAGE_CONFIG[difficulty];
  const native = profile?.nativeLanguage || "Hindi";
  const level = LEVEL_LABELS[difficulty];

  const reply = await chat(
    [
      {
        role: "system",
        content: `You are an IELTS reading examiner creating authentic reading comprehension tasks. Return ONLY valid JSON — no markdown, no explanation, no text outside the JSON object. Every string value must be on one line (use \\n for line breaks inside strings). Escape any double-quotes inside string values as \\". 
        The main motive of generating the passage and questions should be - 
        Reading comprehension – understand the passage.
Information retrieval – find relevant details quickly.
Vocabulary in context – infer word meanings.
Critical thinking – make inferences and identify the author's intent.
Attention to detail – distinguish facts from assumptions.
        `,
      },
      {
        role: "user",
        content: `Generate one IELTS-style reading task for a learner with this profile:
- Name: ${user.name}
- Interests: ${interests.join(", ") || "general"}
- Topic: ${topic}
- Difficulty: ${difficulty} (${level})
- Passage length: ${config.wordRange} words
- Number of questions: ${config.questionCount}
- Question types to use: ${config.questionTypes}

Difficulty requirements for ${difficulty}:
${DIFFICULTY_GUIDE[difficulty]}

For MCQ questions:
- Provide exactly 4 options labelled A, B, C, D as strings like "A. The option text"
- correctAnswer must be exactly "A", "B", "C", or "D"

For TRUE_FALSE_NG questions:
- options should be null
- correctAnswer must be exactly "True", "False", or "Not Given"
- "True" = passage explicitly supports the statement
- "False" = passage contradicts the statement
- "Not Given" = passage neither confirms nor denies

For SHORT_ANSWER questions:
- options should be null
- correctAnswer is a model answer (1–2 sentences)

The glossary lists 4-6 harder words from the passage.

Return ONLY this JSON:
{
  "title": "Short descriptive title (5 words max)",
  "passageType": one of "ARTICLE" | "ACADEMIC" | "STORY" | "OPINION" | "NEWS",
  "passage": "The full reading passage text. Use \\n\\n between paragraphs.",
  "questions": [
    {
      "index": 0,
      "text": "The question text",
      "type": "MCQ" | "TRUE_FALSE_NG" | "SHORT_ANSWER",
      "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"] or null,
      "correctAnswer": "A" or "True" or "model answer text",
      "explanation": "Why this is the correct answer, with reference to the passage",
      "paragraph": 0-based index of the paragraph that contains the answer,
      "skill": "details" (find a stated fact) | "tfng" (true / false / not given) | "vocab" (word meaning in context)
    }
  ],
  "glossary": [
    { "word": "one single word copied exactly as it appears in the passage", "ipa": "/IPA/", "meaning": "Simple English definition in one short sentence.", "native": "translation into ${native}", "partOfSpeech": "NOUN" | "VERB" | "ADJECTIVE" | "ADVERB" }
  ],
  "tips": [
    "Skim the passage first before answering",
    "Look for keywords from the question in the passage",
    "For T/F/NG, only mark True if the passage explicitly states it"
  ]
}`,
      },
    ],
    { temperature: 0.8, maxTokens: 2000 }
  );

  const parsed = parseJson(reply) as {
    title: string;
    passageType: "ARTICLE" | "ACADEMIC" | "STORY" | "OPINION" | "NEWS";
    passage: string;
    questions: ReadingTaskQuestion[];
    tips: string[];
    glossary?: GlossaryWord[];
  };

  await UserProfile.findOneAndUpdate(
    { authUserId: user.id },
    {
      $push: {
        readingRecentTopics: { $each: [topic], $slice: -10 },
      },
    }
  );

  const wordCount = parsed.passage.trim().split(/\s+/).length;

  return {
    title: parsed.title,
    topic,
    passageType: parsed.passageType,
    difficulty,
    passage: parsed.passage,
    passageWordCount: wordCount,
    questions: parsed.questions,
    tips: parsed.tips ?? [],
    level,
    // Only single words that really occur in the passage can be underlined.
    glossary: (parsed.glossary ?? []).filter(
      (g) => g?.word && /^[\p{L}'-]+$/u.test(g.word) && new RegExp(`\\b${g.word}\\b`, "i").test(parsed.passage),
    ),
  };
}

// ── Submit answers ────────────────────────────────────────────────────────────

export type UserAnswer = { questionIndex: number; answer: string };

type GradingResult = {
  results: {
    questionIndex: number;
    isCorrect: boolean;
    feedback: string;
  }[];
  generalFeedback: string;
  improvementPlan: string[];
  newVocabulary: { word: string; meaning: string; level: string }[];
};

async function gradeAnswers(
  task: ReadingTask,
  userAnswers: UserAnswer[]
): Promise<GradingResult> {
  const answerMap = new Map(userAnswers.map((a) => [a.questionIndex, a.answer]));

  // Auto-grade MCQ and T/F/NG; flag SHORT_ANSWER for AI
  const autoResults = task.questions.map((q) => {
    const userAnswer = answerMap.get(q.index) ?? "";
    if (q.type === "SHORT_ANSWER") return null;
    const isCorrect =
      userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    return { questionIndex: q.index, isCorrect, userAnswer };
  });

  const shortAnswerQuestions = task.questions.filter(
    (q) => q.type === "SHORT_ANSWER"
  );

  let aiGrading: { questionIndex: number; isCorrect: boolean; feedback: string }[] = [];
  let generalFeedback = "";
  let improvementPlan: string[] = [];
  let newVocabulary: { word: string; meaning: string; level: string }[] = [];

  const shortAnswerBlock =
    shortAnswerQuestions.length > 0
      ? shortAnswerQuestions
          .map((q) => {
            const ua = answerMap.get(q.index) ?? "(no answer)";
            return `Q${q.index + 1}: "${q.text}"\nModel answer: "${q.correctAnswer}"\nUser's answer: "${ua}"`;
          })
          .join("\n\n")
      : null;

  const reply = await chat(
    [
      {
        role: "system",
        content: `You are an IELTS reading examiner evaluating a learner's answers. Return ONLY valid JSON — no markdown, no text outside the JSON. Every string must be on one line.`,
      },
      {
        role: "user",
        content: `Passage topic: ${task.topic}
Difficulty: ${task.difficulty}

${shortAnswerBlock ? `Grade these SHORT_ANSWER questions:
${shortAnswerBlock}

` : ""}Provide overall reading feedback and vocabulary.

Return ONLY this JSON:
{
  "shortAnswerResults": [
    { "questionIndex": 0, "isCorrect": true, "feedback": "Brief reason" }
  ],
  "generalFeedback": "2-3 sentences on overall reading comprehension skills shown",
  "improvementPlan": [
    "Specific improvement tip 1",
    "Specific improvement tip 2",
    "Specific improvement tip 3"
  ],
  "newVocabulary": [
    { "word": "example", "meaning": "definition", "level": "B2" }
  ]
}

Note: newVocabulary should contain 4-6 interesting or challenging words from the passage that learners should know.`,
      },
    ],
    { temperature: 0.5, maxTokens: 800 }
  );

  try {
    const parsed = parseJson(reply) as {
      shortAnswerResults: { questionIndex: number; isCorrect: boolean; feedback: string }[];
      generalFeedback: string;
      improvementPlan: string[];
      newVocabulary: { word: string; meaning: string; level: string }[];
    };
    aiGrading = parsed.shortAnswerResults ?? [];
    generalFeedback = parsed.generalFeedback ?? "";
    improvementPlan = parsed.improvementPlan ?? [];
    newVocabulary = parsed.newVocabulary ?? [];
  } catch {
    generalFeedback = "Keep practising to improve your reading comprehension.";
    improvementPlan = ["Read more passages on varied topics.", "Focus on skimming for main ideas.", "Practise identifying explicit vs implicit information."];
  }

  const aiGradingMap = new Map(aiGrading.map((r) => [r.questionIndex, r]));

  const results = task.questions.map((q) => {
    const userAnswer = answerMap.get(q.index) ?? "";
    if (q.type === "SHORT_ANSWER") {
      const ai = aiGradingMap.get(q.index);
      return {
        questionIndex: q.index,
        userAnswer,
        isCorrect: ai?.isCorrect ?? false,
        feedback: ai?.feedback ?? "See model answer for reference.",
      };
    }
    const auto = autoResults[q.index];
    const isCorrect = auto?.isCorrect ?? false;
    return {
      questionIndex: q.index,
      userAnswer,
      isCorrect,
      feedback: isCorrect
        ? "Correct!"
        : `The correct answer is: ${q.correctAnswer}. ${q.explanation}`,
    };
  });

  return { results, generalFeedback, improvementPlan, newVocabulary };
}


export async function submitReading(
  task: ReadingTask,
  userAnswers: UserAnswer[],
  timeTaken: number
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await connectDB();

  const doc = await ReadingModel.create({
    authUserId: user.id,
    title: task.title,
    topic: task.topic,
    passageType: task.passageType,
    difficulty: task.difficulty,
    passage: task.passage,
    passageWordCount: task.passageWordCount,
    questions: task.questions,
    userAnswers,
    totalQuestions: task.questions.length,
    timeTaken,
    analysisStatus: "PENDING",
  });

  const id = (doc._id as { toString(): string }).toString();

  const [grading, profile] = await Promise.all([
    gradeAnswers(task, userAnswers),
    UserProfile.findOne({ authUserId: user.id }).lean<UserProfileDocument>(),
  ]);

  const correctCount = grading.results.filter((r) => r.isCorrect).length;
  const score = Math.max(
    1,
    Math.min(10, Math.round((correctCount / Math.max(1, task.questions.length)) * 10))
  );

  await ReadingModel.findByIdAndUpdate(id, {
    results: grading.results,
    correctCount,
    score,
    generalFeedback: grading.generalFeedback,
    improvementPlan: grading.improvementPlan,
    newVocabulary: grading.newVocabulary,
    analysisStatus: "COMPLETED",
  });

  const xpGained = READING_XP[task.difficulty];

  const now = new Date();
  let newStreak = 1;
  if (profile?.lastActivityAt) {
    const lastDay = new Date(profile.lastActivityAt);
    lastDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) newStreak = profile.currentStreak ?? 1;
    else if (diffDays === 1) newStreak = (profile.currentStreak ?? 0) + 1;
  }
  const newLongest = Math.max(newStreak, profile?.longestStreak ?? 0);

  const updatedScores = [...(profile?.readingRecentScores ?? []), score].slice(-10);
  const newDifficulty = resolveReadingDifficulty({
    readingDifficulty: task.difficulty,
    readingLastActivityAt: now,
    readingRecentScores: updatedScores,
    readingTotalSubmissions: (profile?.readingTotalSubmissions ?? 0) + 1,
  });

  await UserProfile.findOneAndUpdate(
    { authUserId: user.id },
    {
      $inc: { readingTotalSubmissions: 1, totalXP: xpGained },
      $push: { readingRecentScores: { $each: [score], $slice: -10 } },
      $set: {
        readingLastActivityAt: now,
        lastActivityAt: now,
        currentStreak: newStreak,
        longestStreak: newLongest,
        readingDifficulty: newDifficulty,
      },
    }
  );

  return id;
}

// ── Read back a submission ────────────────────────────────────────────────────

export type ReadingView = {
  id: string;
  title: string;
  topic: string;
  passageType: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  passage: string;
  passageWordCount: number;
  questions: ReadingTaskQuestion[];
  userAnswers: UserAnswer[];
  results: {
    questionIndex: number;
    userAnswer: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  correctCount: number;
  totalQuestions: number;
  score: number;
  timeTaken: number;
  generalFeedback: string | null;
  improvementPlan: string[];
  newVocabulary: { word: string; meaning: string; level: string }[];
  analysisStatus: "PENDING" | "COMPLETED";
  createdAt: string;
};

function serializeReading(doc: Reading): ReadingView {
  return {
    id: String(doc._id),
    title: doc.title ?? "",
    topic: doc.topic ?? "",
    passageType: doc.passageType ?? "",
    difficulty: doc.difficulty,
    passage: doc.passage ?? "",
    passageWordCount: doc.passageWordCount ?? 0,
    questions: (doc.questions ?? []) as ReadingTaskQuestion[],
    userAnswers: doc.userAnswers ?? [],
    results: doc.results ?? [],
    correctCount: doc.correctCount ?? 0,
    totalQuestions: doc.totalQuestions ?? 0,
    score: doc.score ?? 0,
    timeTaken: doc.timeTaken ?? 0,
    generalFeedback: doc.generalFeedback ?? null,
    improvementPlan: doc.improvementPlan ?? [],
    newVocabulary: doc.newVocabulary ?? [],
    analysisStatus: doc.analysisStatus,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function getReadingSubmission(id: string): Promise<ReadingView | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await connectDB();
  const doc = await ReadingModel.findById(id).lean<Reading>();
  if (!doc) return null;
  return serializeReading(doc);
}

// Lingov reading session: save and grade, then return the graded view and the XP earned.
export async function submitReadingSession(
  task: ReadingTask,
  userAnswers: UserAnswer[],
  timeTaken: number
): Promise<{ view: ReadingView; xp: number }> {
  const id = await submitReading(task, userAnswers, timeTaken);
  const view = await getReadingSubmission(id);
  if (!view) throw new Error("Reading submission not found");
  return { view, xp: READING_XP[task.difficulty] };
}

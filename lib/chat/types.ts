// Shapes shared by the chat engine (server) and the chat screens (browser). No server-only imports here.

export const MISTAKE_CATEGORIES = ["grammar", "spelling", "word_choice", "punctuation", "register", "other"] as const;
export type MistakeCategory = (typeof MISTAKE_CATEGORIES)[number];

export type Mistake = {
  wrong: string;
  right: string;
  why: string;
  whyNative?: string;
  topicSlugs: string[];
  category: MistakeCategory;
};

export type WordInfo = { word: string; partOfSpeech: string; meaning: string; example: string };
export type Mood = { mood: string; trust: number }; // trust 0 to 10

// ── What the browser sees ────────────────────────────────────────────────────

// A mistake with its grammar topic names filled in, ready to show.
export type MistakeView = Mistake & { topicTitles: string[] };

export type MessageView = {
  id: string;
  senderType: "user" | "character" | "guide" | "system";
  senderId: string;
  senderName: string;
  text: string;
  at: string; // ISO time
  mistakes: MistakeView[];
  translation?: string;
};

export type FeedbackView = {
  summary: string;
  wins: string[];
  focus: string[];
  messages: number;
  mistakes: number;
  topics: { slug: string; title: string; count: number }[];
  examples: { wrong: string; right: string; why: string }[];
  words: string[];
  allGoalsDone: boolean;
};

export type ThreadView = {
  progressId: string;
  scenarioTitle: string;
  incidentTitle: string;
  incidentNumber: number;
  incidentCount: number;
  status: "in_progress" | "completed";
  milestones: { id: string; goal: string; done: boolean }[];
  characters: { id: string; name: string; role: string }[];
  guideName: string;
  guideNote: string; // latest thing the guide said
  messages: MessageView[]; // group chat only
  feedback: FeedbackView | null;
  hasNext: boolean; // another incident follows this one
};

export type ChatSummary = {
  progressId: string;
  scenarioTitle: string;
  incidentTitle: string;
  lastText: string;
  lastAt: string;
  done: number;
  total: number;
  completed: boolean; // the whole scenario is finished
};

export type ScenarioCard = {
  id: string;
  title: string;
  sceneSetup: string;
  incidentCount: number;
  firstGoals: string[];
  progressId: string | null; // set when the user already started it
};

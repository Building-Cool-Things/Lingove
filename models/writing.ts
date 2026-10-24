import mongoose, { Schema, Document } from "mongoose";

interface ISentenceAnalysis {
  index: number;
  original: string;
  hasError: boolean;
  errorType:
    | "grammar"
    | "spelling"
    | "punctuation"
    | "clarity"
    | "structure"
    | null;
  errorExplanation: string | null;
  correctedSentence: string | null;
  improvementTip: string | null;
}

interface IVocabEvaluation {
  word: string;
  usedCorrectly: boolean;
  suggestion: string | null; // better word or correct usage
}

interface IGrammarSummary {
  totalSentences: number;
  errorCount: number;
  mostCommonError: string | null;
}

// Word-level fix: `find` is copied from the learner's text, `replace` corrects it.
export interface WritingCorrection {
  sentence: number;
  type: "grammar" | "spelling" | "punctuation" | "clarity" | "structure" | string;
  rule: string;
  find: string;
  replace: string;
  why: string;
}

const CorrectionSchema = new Schema<WritingCorrection>(
  {
    sentence: { type: Number, default: 0 },
    type: { type: String, default: "grammar" },
    rule: { type: String, default: "" },
    find: { type: String, required: true },
    replace: { type: String, default: "" },
    why: { type: String, default: "" },
  },
  { _id: false },
);

const SentenceAnalysisSchema = new Schema<ISentenceAnalysis>(
  {
    index: { type: Number, required: true },
    original: { type: String, required: true },
    hasError: { type: Boolean, required: true },
    errorType: { type: String, default: null },
    errorExplanation: { type: String, default: null },
    correctedSentence: { type: String, default: null },
    improvementTip: { type: String, default: null },
  },
  { _id: false },
);

const VocabEvaluationSchema = new Schema<IVocabEvaluation>(
  {
    word: { type: String, required: true },
    usedCorrectly: { type: Boolean, required: true },
    suggestion: { type: String, default: null },
  },
  { _id: false },
);

const GrammarSummarySchema = new Schema<IGrammarSummary>(
  {
    totalSentences: { type: Number, required: true },
    errorCount: { type: Number, required: true },
    mostCommonError: { type: String, default: null },
  },
  { _id: false },
);

export interface Writing extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  description?: string;
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
  maxWords?: number;

  wordCount: number;
  timeTaken: number;
  sentenceAnalysis: ISentenceAnalysis[];
  grammarSummary: IGrammarSummary;

  vocabEvaluation: IVocabEvaluation[];
  strongWords: string[]; // words user used well
  missedWords: string[]; // better words they could have used
  idealAnswer: string;
  answer:string;
  generalFeedback: string;
  improvementPlan: string[];
  corrections: WritingCorrection[];
  analysisStatus: "PENDING" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
}

const WritingSchema = new Schema<Writing>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "ESSAY",
        "CHART",
        "EMAIL",
        "LETTER",
        "MEMO",
        "REVIEW",
        "REPORT",
        "STORY",
        "SUMMARY",
      ],
      required: true,
    },
    promptType: {
      type: String,
      enum: ["TEXT", "CHART", "TABLE", "MAP", "PROCESS", "IMAGE"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      required: true,
    },

    minWords: {
      type: Number,
      required: true,
    },
    recommendedWords: {
      type: Number,
      required: true,
    },
    maxWords: {
      type: Number,
    },

    answer:           { type: String },

    wordCount:        { type: Number},
    timeTaken:        { type: Number, default: 0 },
    sentenceAnalysis: { type: [SentenceAnalysisSchema], default: [] },
    grammarSummary:   { type: GrammarSummarySchema },
    vocabEvaluation:  { type: [VocabEvaluationSchema], default: [] },
    strongWords:      { type: [String], default: [] },
    missedWords:      { type: [String], default: [] },
    idealAnswer:      { type: String },
    generalFeedback:  { type: String },
    improvementPlan:  { type: [String], default: [] },
    corrections:      { type: [CorrectionSchema], default: [] },
    analysisStatus:   { type: String, enum: ["PENDING", "COMPLETED"], default: "PENDING" },
  },
  {
    timestamps: true,
  },
);

export const WritingModel =
  (mongoose.models.Writing as mongoose.Model<Writing>) ??
  mongoose.model<Writing>("Writing", WritingSchema);

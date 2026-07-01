import mongoose, { Schema, Document } from "mongoose";

export interface IReadingQuestion {
  index: number;
  text: string;
  type: "MCQ" | "TRUE_FALSE_NG" | "SHORT_ANSWER";
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

export interface IQuestionResult {
  questionIndex: number;
  userAnswer: string;
  isCorrect: boolean;
  feedback: string;
}

export interface INewVocab {
  word: string;
  meaning: string;
  level: string;
}

const ReadingQuestionSchema = new Schema<IReadingQuestion>(
  {
    index: { type: Number, required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["MCQ", "TRUE_FALSE_NG", "SHORT_ANSWER"],
      required: true,
    },
    options: { type: [String], default: null },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const QuestionResultSchema = new Schema<IQuestionResult>(
  {
    questionIndex: { type: Number, required: true },
    userAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    feedback: { type: String, required: true },
  },
  { _id: false }
);

const NewVocabSchema = new Schema<INewVocab>(
  {
    word: { type: String, required: true },
    meaning: { type: String, required: true },
    level: { type: String, required: true },
  },
  { _id: false }
);

export interface Reading extends Document {
  authUserId: string;
  title: string;
  topic: string;
  passageType: "ARTICLE" | "ACADEMIC" | "STORY" | "OPINION" | "NEWS";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  passage: string;
  passageWordCount: number;
  questions: IReadingQuestion[];

  userAnswers: { questionIndex: number; answer: string }[];
  results: IQuestionResult[];
  correctCount: number;
  totalQuestions: number;
  score: number;
  timeTaken: number;
  generalFeedback: string | null;
  improvementPlan: string[];
  newVocabulary: INewVocab[];
  analysisStatus: "PENDING" | "COMPLETED";

  createdAt: Date;
  updatedAt: Date;
}

const ReadingSchema = new Schema<Reading>(
  {
    authUserId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    passageType: {
      type: String,
      enum: ["ARTICLE", "ACADEMIC", "STORY", "OPINION", "NEWS"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      required: true,
    },
    passage: { type: String, required: true },
    passageWordCount: { type: Number, required: true },
    questions: { type: [ReadingQuestionSchema], default: [] },

    userAnswers: {
      type: [
        new Schema(
          { questionIndex: Number, answer: String },
          { _id: false }
        ),
      ],
      default: [],
    },
    results: { type: [QuestionResultSchema], default: [] },
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    generalFeedback: { type: String, default: null },
    improvementPlan: { type: [String], default: [] },
    newVocabulary: { type: [NewVocabSchema], default: [] },
    analysisStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const ReadingModel =
  (mongoose.models.Reading as mongoose.Model<Reading>) ??
  mongoose.model<Reading>("Reading", ReadingSchema);

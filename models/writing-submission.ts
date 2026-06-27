import mongoose, { Schema, Document } from "mongoose";

export type CriterionScore = {
  score: number;
  feedback: string;
};

export type WritingAnalysisData = {
  overallScore: number;
  bandScore: string;
  criteria: {
    taskAchievement: CriterionScore;
    coherence: CriterionScore;
    lexicalResource: CriterionScore;
    grammar: CriterionScore;
  };
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  strengths: string[];
  improvements: string[];
};

export interface WritingSubmissionDocument extends Document {
  authUserId: string;
  title: string;
  topic: string;
  prompt: string;
  type: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  draft: string;
  wordCount: number;
  analysis: WritingAnalysisData | null;
  createdAt: Date;
  updatedAt: Date;
}

const CriterionSchema = new Schema<CriterionScore>(
  { score: Number, feedback: String },
  { _id: false }
);

const WritingSubmissionSchema = new Schema<WritingSubmissionDocument>(
  {
    authUserId: { type: String, required: true, index: true },
    title:      { type: String, required: true },
    topic:      { type: String, required: true },
    prompt:     { type: String, required: true },
    type:       { type: String, required: true },
    difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"], required: true },
    draft:      { type: String, required: true },
    wordCount:  { type: Number, required: true },
    analysis: {
      type: new Schema(
        {
          overallScore: Number,
          bandScore:    String,
          criteria: {
            taskAchievement: CriterionSchema,
            coherence:       CriterionSchema,
            lexicalResource: CriterionSchema,
            grammar:         CriterionSchema,
          },
          corrections: [
            new Schema(
              { original: String, corrected: String, explanation: String },
              { _id: false }
            ),
          ],
          strengths:    [String],
          improvements: [String],
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { timestamps: true }
);

export const WritingSubmissionModel =
  (mongoose.models.WritingSubmission as mongoose.Model<WritingSubmissionDocument>) ??
  mongoose.model<WritingSubmissionDocument>(
    "WritingSubmission",
    WritingSubmissionSchema
  );

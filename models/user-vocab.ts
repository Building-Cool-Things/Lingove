import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel, LEVELS } from "./_shared";

// One row per user per word.
// source: incident = key vocab of the story, tapped = user tapped an unknown word, mistake = misused word
// status: new -> learning -> known (3 correct in a row, spaced review)
const userVocabSchema = new Schema(
  {
    userId: { type: String, required: true },
    word: { type: String, required: true },
    level: { type: String, enum: LEVELS, required: true },
    partOfSpeech: { type: String, required: true },
    meaning: { type: String, required: true }, // simple English meaning
    translation: String, // in user's native language
    example: { type: String, required: true },
    pronunciation: String,
    audioUrl: String,
    source: { type: String, enum: ["incident", "tapped", "mistake"], required: true },
    scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario" },
    incidentId: String,
    status: { type: String, enum: ["new", "learning", "known"], default: "new" },
    timesSeen: { type: Number, default: 0 },
    correctStreak: { type: Number, default: 0 }, // 3 in a row -> known
    lastReviewedAt: Date,
    nextReviewAt: Date,
  },
  { timestamps: { createdAt: "addedAt", updatedAt: false } }
);
userVocabSchema.index({ userId: 1, word: 1 }, { unique: true });
userVocabSchema.index({ userId: 1, nextReviewAt: 1 });

export const UserVocab = getModel("UserVocab", userVocabSchema);
export type IUserVocab = InferSchemaType<typeof userVocabSchema> & { _id: Types.ObjectId };

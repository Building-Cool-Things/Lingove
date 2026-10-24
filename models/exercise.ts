import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel, LEVELS } from "./_shared";

// Shared bank that grows incrementally and never repeats for a user.
// Serve: weak topics -> unseen exercises -> if < 3 unseen, LLM generates 10,
// skip hash duplicates, insert, serve.
const exerciseSchema = new Schema({
  kind: { type: String, enum: ["grammar_mcq", "vocab_meaning", "vocab_fill_blank", "fix_sentence"], required: true },
  level: { type: String, enum: LEVELS, required: true },
  topicSlug: String, // grammar kinds
  vocabWord: String, // vocab kinds (shared by word, not per user)
  question: { type: String, required: true },
  options: { type: [String], default: [] }, // empty for fix_sentence
  answerIndex: Number,
  answerText: String, // for fix_sentence
  explanation: { type: String, required: true },
  hash: { type: String, required: true, unique: true }, // hash of normalized question
});
exerciseSchema.index({ kind: 1, topicSlug: 1, level: 1 });
exerciseSchema.index({ vocabWord: 1, level: 1 });

export const Exercise = getModel("Exercise", exerciseSchema);
export type IExercise = InferSchemaType<typeof exerciseSchema> & { _id: Types.ObjectId };

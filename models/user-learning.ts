import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "./_shared";

const exerciseResultSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
    correct: { type: Boolean, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const topicScoreSchema = new Schema(
  {
    mistakes: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
  },
  { _id: false }
);

const userLearningSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  seenExerciseIds: { type: [Schema.Types.ObjectId], default: [] }, // never show again
  results: { type: [exerciseResultSchema], default: [] },
  topicScores: { type: Map, of: topicScoreSchema, default: {} }, // key = topic slug
});

export const UserLearning = getModel("UserLearning", userLearningSchema);
export type IUserLearning = InferSchemaType<typeof userLearningSchema> & { _id: Types.ObjectId };

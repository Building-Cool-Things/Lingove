import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel, LEVELS } from "./_shared";

// One question of the placement test shown at the end of onboarding. The answer never leaves the server.
const placementQuestionSchema = new Schema(
  {
    order: { type: Number, required: true, unique: true }, // 1 = first question shown, easy to hard
    level: { type: String, enum: LEVELS, required: true }, // CEFR level this question tests
    prompt: { type: String, required: true },
    options: { type: [String], required: true, validate: (v: string[]) => v.length >= 2 },
    answerIndex: { type: Number, required: true }, // index into options
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PlacementQuestion = getModel("PlacementQuestion", placementQuestionSchema);
export type IPlacementQuestion = InferSchemaType<typeof placementQuestionSchema> & { _id: Types.ObjectId };

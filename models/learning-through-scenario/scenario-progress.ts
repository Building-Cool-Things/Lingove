import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "../_shared";
import { PROGRESS_STATUSES } from "./constants";

// Overall progress of one user in one scenario.
const scenarioProgressSchema = new Schema(
  {
    userId: { type: String, required: true }, // better-auth user id
    scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario", required: true },
    status: { type: String, enum: PROGRESS_STATUSES, default: "not_started" },
    currentIncidentId: String,
    completedIncidentIds: { type: [String], default: [] },
    totalXp: { type: Number, default: 0 },
    startedAt: Date,
    lastActivityAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);
scenarioProgressSchema.index({ userId: 1, scenarioId: 1 }, { unique: true });

export const ScenarioProgress = getModel("ScenarioProgress", scenarioProgressSchema);
export type IScenarioProgress = InferSchemaType<typeof scenarioProgressSchema> & { _id: Types.ObjectId };

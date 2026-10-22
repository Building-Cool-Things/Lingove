import { Schema, type InferSchemaType, type Types } from "mongoose";

import { DIFFICULTIES, getModel, LEVELS } from "./_shared";

// Progress only, never a copy of the scenario.
const incidentProgressSchema = new Schema(
  {
    incidentId: { type: String, required: true },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" },
    milestonesDone: { type: [String], default: [] },
    mistakeCount: { type: Number, default: 0 },
    userMessageCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const userScenarioProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario", required: true },
    currentIncidentId: String,
    incidents: { type: [incidentProgressSchema], default: [] },
    difficulty: { type: String, enum: DIFFICULTIES, default: "medium" }, // moves after each incident
    cefrLevel: { type: String, enum: LEVELS, required: true }, // level characters speak at
    hiddenState: { type: Schema.Types.Mixed, default: {} }, // trust, flags (never send to client)
    memorySummary: { type: String, default: "" }, // recap of finished incidents for the LLM
  },
  { timestamps: true }
);
userScenarioProgressSchema.index({ userId: 1, scenarioId: 1 }, { unique: true });

export const UserScenarioProgress = getModel("UserScenarioProgress", userScenarioProgressSchema);
export type IUserScenarioProgress = InferSchemaType<typeof userScenarioProgressSchema> & { _id: Types.ObjectId };

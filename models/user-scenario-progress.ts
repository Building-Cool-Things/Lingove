import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel, LEVELS } from "./_shared";

// Progress only, never a copy of the scenario.
const incidentProgressSchema = new Schema(
  {
    incidentId: { type: String, required: true },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    milestonesDone: { type: [String], default: [] },
    mistakeCount: { type: Number, default: 0 },
    userMessageCount: { type: Number, default: 0 },
    // Written once when the incident ends: { summary, wins, focus, mistakesByTopic, examples, words }
    feedback: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const userScenarioProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario", required: true },
    currentIncidentId: { type: String, required: true },
    incidents: { type: [incidentProgressSchema], default: [] },
    cefrLevel: { type: String, enum: LEVELS, required: true }, // level characters speak at
    // Character moods the AI keeps up to date: { moods: { tobias: { mood: "irritated", trust: 3 } } }. Never sent to the browser.
    hiddenState: { type: Schema.Types.Mixed, default: {} },
    memorySummary: { type: String, default: "" }, // recap of finished incidents for the AI
  },
  { timestamps: true }
);
userScenarioProgressSchema.index({ userId: 1, scenarioId: 1 }, { unique: true });

export const UserScenarioProgress = getModel("UserScenarioProgress", userScenarioProgressSchema);
export type IUserScenarioProgress = InferSchemaType<typeof userScenarioProgressSchema> & { _id: Types.ObjectId };

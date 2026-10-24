import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "../_shared";
import { PROGRESS_STATUSES } from "./constants";

// Progress of one user in one incident of a scenario.
const incidentProgressSchema = new Schema(
  {
    userId: { type: String, required: true }, // better-auth user id
    scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario", required: true },
    incidentId: { type: String, required: true },
    status: { type: String, enum: PROGRESS_STATUSES, default: "not_started" },
    currentMilestoneId: String,
    completedMilestoneIds: { type: [String], default: [] },
    xpEarned: { type: Number, default: 0 },
    turnCount: { type: Number, default: 0 }, // messages the user has sent here
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);
incidentProgressSchema.index({ userId: 1, scenarioId: 1, incidentId: 1 }, { unique: true });

export const IncidentProgress = getModel("IncidentProgress", incidentProgressSchema);
export type IIncidentProgress = InferSchemaType<typeof incidentProgressSchema> & { _id: Types.ObjectId };

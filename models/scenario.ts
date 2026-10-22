import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "./_shared";

// Embedded docs keep a string `id` (other fields point to them).
const characterSchema = new Schema(
  {
    id: { type: String, required: true }, // "ravi"
    name: { type: String, required: true },
    role: { type: String, required: true },
    persona: { type: String, required: true },
  },
  { _id: false }
);

const milestoneSchema = new Schema(
  {
    id: { type: String, required: true }, // "m1"
    goal: { type: String, required: true }, // default (mid) goal text
  },
  { _id: false }
);

// Same incident played per level band. Milestone ids stay the same.
const incidentVariantSchema = new Schema(
  {
    openingText: { type: String, required: true },
    milestoneGoals: { type: Map, of: String, default: {} }, // milestoneId -> goal text
    guideHints: { type: [String], default: [] }, // basic: sample replies
  },
  { _id: false }
);

const incidentSchema = new Schema(
  {
    id: { type: String, required: true }, // "bag_stolen"
    scenario: { type: String, required: true },
    userRole: { type: String, required: true },
    characterParticipants: { type: [String], required: true }, // character ids
    userGuideId: { type: Schema.Types.ObjectId, ref: "Guide", required: true },
    milestones: { type: [milestoneSchema], required: true },
    variants: {
      // basic = A1-A2, mid = B1-B2, high = C1
      basic: incidentVariantSchema,
      mid: incidentVariantSchema,
      high: incidentVariantSchema,
    },
    keyVocab: { type: [String], default: [] },
  },
  { _id: false }
);

const scenarioSchema = new Schema(
  {
    title: { type: String, required: true },
    characters: { type: [characterSchema], required: true },
    sceneSetup: { type: String, required: true },
    startIncident: { type: String, required: true },
    published: { type: Boolean, default: false, index: true },
    incidents: { type: [incidentSchema], required: true }, // array order = story order
  },
  { timestamps: true }
);

export const Scenario = getModel("Scenario", scenarioSchema);
export type IScenario = InferSchemaType<typeof scenarioSchema> & { _id: Types.ObjectId };

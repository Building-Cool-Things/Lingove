import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "../_shared";

// A scenario is a story (e.g. "At the Hotel") made of incidents.
// Each incident is one situation with its own characters and milestones.
// Embedded docs use a string `id` (not _id) because other documents point to them.

const characterSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true }, // "Receptionist"
    role: { type: String, required: true }, // "Hotel Receptionist"
    persona: { type: String, required: true },
    secrets: { type: [String], default: [] }, // hidden facts, only the AI sees them
  },
  { _id: false }
);

const milestoneSchema = new Schema(
  {
    id: { type: String, required: true },
    goal: { type: String, required: true }, // "Book a room for two nights."
    xp: { type: Number, default: 0 },
    order: { type: Number, required: true }, // 1, 2, 3...
    // true: the AI picks the grammar/vocabulary to teach from this milestone's context.
    learningEnabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const incidentSchema = new Schema(
  {
    id: { type: String, required: true }, // "hotel-booking"
    title: { type: String, required: true }, // "Book a Room"
    scenarioSetup: { type: [String], default: [] }, // context of this incident
    worldFacts: { type: [String], default: [] }, // fixed facts, e.g. "Double room costs $100."
    userRole: {
      name: { type: String, required: true }, // "Traveler"
      description: String, // what the user has to play
    },
    guideId: { type: Schema.Types.ObjectId, ref: "Guide", required: true }, // the coach for this incident
    guidePersona: { type: String, required: true }, // how the guide behaves here, e.g. "Friendly and encouraging"
    characterParticipants: { type: [characterSchema], default: [] },
    milestones: { type: [milestoneSchema], default: [] },
  },
  { _id: false }
);

const scenarioSchema = new Schema(
  {
    title: { type: String, required: true },
    sceneSetup: { type: [String], default: [] }, // overall story context
    isPublished: { type: Boolean, default: false },
    // Bump when the scenario changes, so old progress can be matched to the version it was played on.
    version: { type: Number, default: 1 },
    startingIncident: String, // id of the first incident
    incidents: { type: [incidentSchema], default: [] },
  },
  { timestamps: true }
);

export const Scenario = getModel("Scenario", scenarioSchema);
export type IScenario = InferSchemaType<typeof scenarioSchema> & { _id: Types.ObjectId };

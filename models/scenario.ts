import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "./_shared";

// A scenario is only the story skeleton. Replies, hints, guide advice and vocabulary
// are written by the AI while the user chats, so none of that is stored here.

// Embedded docs keep a string `id` (other fields point to them).
const characterSchema = new Schema(
  {
    id: { type: String, required: true }, // "tobias"
    name: { type: String, required: true },
    role: { type: String, required: true },
    persona: { type: String, required: true },
    secret: { type: String, default: null }, // only the AI sees this, never sent to the browser
  },
  { _id: false }
);

const milestoneSchema = new Schema(
  {
    id: { type: String, required: true }, // "m1"
    goal: { type: String, required: true },
  },
  { _id: false }
);

const incidentSchema = new Schema(
  {
    id: { type: String, required: true }, // "overbooked_arrival"
    title: { type: String, required: true },
    scenario: { type: String, required: true }, // what is happening right now
    userRole: { type: String, required: true },
    openingFrom: { type: String, required: true }, // character id who speaks first
    characterParticipants: { type: [String], required: true }, // character ids in this incident
    userGuideId: { type: Schema.Types.ObjectId, ref: "Guide", required: true },
    milestones: { type: [milestoneSchema], required: true },
  },
  { _id: false }
);

const scenarioSchema = new Schema(
  {
    title: { type: String, required: true, unique: true }, // the seed file upserts by title
    sceneSetup: { type: String, required: true },
    startIncident: { type: String, required: true },
    published: { type: Boolean, default: false, index: true },
    characters: { type: [characterSchema], required: true },
    incidents: { type: [incidentSchema], required: true }, // array order = story order
  },
  { timestamps: true }
);

export const Scenario = getModel("Scenario", scenarioSchema);
export type IScenario = InferSchemaType<typeof scenarioSchema> & { _id: Types.ObjectId };

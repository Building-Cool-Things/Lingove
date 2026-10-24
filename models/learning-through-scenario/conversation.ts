import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "../_shared";

// One mistake found in a user message.
const errorSchema = new Schema(
  {
    // Not named `type`: mongoose would read that as the field's data type.
    category: { type: String, required: true }, // "grammar" | "vocabulary" | "spelling"
    code: String, // exact error, e.g. "pluralization", "article", "wrong_word"
    original: String, // what the user wrote
    correction: String,
    explanation: String,
    explanationNative: String, // same explanation in the user's native language
    examples: { type: [String], default: [] }, // e.g. ["I stayed for two nights."]
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    speaker: { type: String, enum: ["user", "character", "guide"], required: true },
    // Who spoke: a character id (speaker "character") or guide id (speaker "guide"). Empty for the user.
    characterId: String,
    text: { type: String, required: true },
    // Only user messages are evaluated.
    evaluation: {
      score: Number,
      errors: { type: [errorSchema], default: [] },
    },
    createdAt: { type: Date, default: Date.now },
  },
  // Keeps the default _id: the Translate button finds a message by it.
);

// The chat history of one user in one incident.
const conversationSchema = new Schema(
  {
    userId: { type: String, required: true }, // better-auth user id
    scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario", required: true },
    incidentId: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);
conversationSchema.index({ userId: 1, scenarioId: 1, incidentId: 1 });

export const Conversation = getModel("Conversation", conversationSchema);
export type IConversation = InferSchemaType<typeof conversationSchema> & { _id: Types.ObjectId };

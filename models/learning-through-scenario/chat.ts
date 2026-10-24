import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "../_shared";

// One row in the user's chat list. This is what the Chats screen shows.
//   "scenario": the user copied a scenario from Explore. The story itself lives in
//               ScenarioProgress, IncidentProgress and Conversation.
//   "free":     a chat that is not based on a scenario (no scenarioId).
const chatSchema = new Schema(
  {
    userId: { type: String, required: true }, // better-auth user id
    type: { type: String, enum: ["scenario", "free"], required: true },
    title: { type: String, required: true }, // scenario title, or the name of a free chat
    scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario" }, // only for type "scenario"
    // Copied here so the list does not have to open every conversation.
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
chatSchema.index({ userId: 1, lastMessageAt: -1 });
// A user copies a scenario only once.
chatSchema.index({ userId: 1, scenarioId: 1 }, { unique: true, partialFilterExpression: { scenarioId: { $exists: true } } });

export const Chat = getModel("Chat", chatSchema);
export type IChat = InferSchemaType<typeof chatSchema> & { _id: Types.ObjectId };

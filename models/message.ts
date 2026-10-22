import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "./_shared";

const sentenceCheckSchema = new Schema(
  {
    text: { type: String, required: true },
    isError: { type: Boolean, default: false },
    corrected: String, // only if isError
    explanation: String, // only if isError
    topicSlug: String, // grammar topic, e.g. "past_simple"
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    progressId: { type: Schema.Types.ObjectId, ref: "UserScenarioProgress", required: true },
    incidentId: { type: String, required: true },
    channel: { type: String, enum: ["group", "guide"], required: true },
    senderType: { type: String, enum: ["user", "character", "guide", "system"], required: true },
    senderId: { type: String, required: true }, // user id / character id / guide id
    text: { type: String, required: true },
    tags: { type: [String], default: [] }, // @tagged character ids
    sentences: { type: [sentenceCheckSchema], default: [] }, // user messages only
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
messageSchema.index({ progressId: 1, incidentId: 1, createdAt: 1 });

export const Message = getModel("Message", messageSchema);
export type IMessage = InferSchemaType<typeof messageSchema> & { _id: Types.ObjectId };

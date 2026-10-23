import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "./_shared";

// One English mistake found in a user message.
const mistakeSchema = new Schema(
  {
    wrong: { type: String, required: true }, // exact words the user wrote
    right: { type: String, required: true }, // the corrected words
    why: { type: String, required: true }, // short reason in simple English
    whyNative: String, // same reason in the user's native language
    // A mistake can break several rules at once. Every slug exists in GrammarTopic.
    topicSlugs: { type: [String], default: [] },
    // "grammar" when topicSlugs is filled. "other" is a mistake no grammar topic covers.
    category: { type: String, enum: ["grammar", "spelling", "word_choice", "punctuation", "register", "other"], default: "grammar" },
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
    mistakes: { type: [mistakeSchema], default: [] }, // user messages only
    translation: String, // filled the first time the user taps Translate
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
messageSchema.index({ progressId: 1, incidentId: 1, createdAt: 1 });

export const Message = getModel("Message", messageSchema);
export type IMessage = InferSchemaType<typeof messageSchema> & { _id: Types.ObjectId };

import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel, LEVELS } from "./_shared";

// Error checks must tag mistakes with a slug from this collection.
const grammarTopicSchema = new Schema({
  slug: { type: String, required: true, unique: true }, // "past_simple"
  title: { type: String, required: true },
  level: { type: String, enum: LEVELS, required: true },
  explanation: { type: String, required: true }, // lesson text, generated once
});

export const GrammarTopic = getModel("GrammarTopic", grammarTopicSchema);
export type IGrammarTopic = InferSchemaType<typeof grammarTopicSchema> & { _id: Types.ObjectId };

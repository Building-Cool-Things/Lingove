import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "./_shared";

// The friendly coach who helps the user inside a mission (maya, jonah, zara).
const guideSchema = new Schema({
  key: { type: String, required: true, unique: true }, // "maya", used by the seed file
  name: { type: String, required: true },
  avatar: { type: String, required: true },
});

export const Guide = getModel("Guide", guideSchema);
export type IGuide = InferSchemaType<typeof guideSchema> & { _id: Types.ObjectId };

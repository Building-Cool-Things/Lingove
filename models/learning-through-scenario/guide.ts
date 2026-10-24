import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "../_shared";

// The coach who helps the user inside an incident (e.g. Emma).
// Persona is not stored here: each incident sets it, so the same guide can behave differently per incident.
const guideSchema = new Schema({
  name: { type: String, required: true }, // "Emma"
  avatar: String,
});

export const Guide = getModel("Guide", guideSchema);
export type IGuide = InferSchemaType<typeof guideSchema> & { _id: Types.ObjectId };

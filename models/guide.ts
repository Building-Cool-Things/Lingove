import { Schema, type InferSchemaType, type Types } from "mongoose";

import { getModel } from "./_shared";

const guideSchema = new Schema({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
});

export const Guide = getModel("Guide", guideSchema);
export type IGuide = InferSchemaType<typeof guideSchema> & { _id: Types.ObjectId };

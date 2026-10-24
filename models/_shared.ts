import mongoose, { type InferSchemaType, type Schema } from "mongoose";

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Level = (typeof LEVELS)[number];

// Hot-reload safe model getter. Models reference users by the better-auth
// user id (a string), same as UserProfile.authUserId.
export function getModel<S extends Schema>(name: string, schema: S) {
  return (mongoose.models[name] ?? mongoose.model(name, schema)) as mongoose.Model<InferSchemaType<S>>;
}

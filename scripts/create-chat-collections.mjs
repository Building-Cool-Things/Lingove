// Creates the empty chat collections (and their indexes) so they show up in MongoDB.
//   pnpm node --env-file=.env.local scripts/create-chat-collections.mjs
import mongoose from "mongoose";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

const existing = new Set((await db.listCollections()).map((c) => c.name));
for (const name of ["chats", "guides", "scenarios", "scenarioprogresses", "incidentprogresses", "conversations"]) {
  if (!existing.has(name)) await db.createCollection(name);
}
console.log((await db.listCollections()).map((c) => c.name).sort().join("\n"));
await mongoose.disconnect();

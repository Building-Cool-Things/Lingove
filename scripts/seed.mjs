// Loads guides and scenarios into MongoDB. Safe to run again: everything is upserted.
//
//   pnpm seed <lingov-guides.json> <lingov-scenarios.json>
//
// The scenarios file points to guides by fixed ids (6718a...01, 6718a...02), so guide number N
// in the guides file gets id 6718a00000000000000000NN. Keep the guides file in that order.
// Plain mongoose collections are used on purpose: node cannot import the .ts models without a build step.
import { readFileSync } from "node:fs";
import mongoose from "mongoose";

const [guidesFile, scenariosFile] = process.argv.slice(2);
if (!guidesFile || !scenariosFile) {
  console.error("Usage: pnpm seed <guides.json> <scenarios.json>");
  process.exit(1);
}
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set (run through `pnpm seed`).");

const { EJSON, ObjectId } = mongoose.mongo.BSON;
const read = (file) => EJSON.parse(readFileSync(file, "utf8")); // understands { "$oid" } and { "$date" }

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

for (const [i, guide] of read(guidesFile).entries()) {
  const _id = new ObjectId(`6718a00000000000000000${String(i + 1).padStart(2, "0")}`);
  await db.collection("guides").replaceOne({ _id }, { _id, ...guide }, { upsert: true });
  console.log(`guide: ${guide.name}`);
}

for (const { _id, ...scenario } of read(scenariosFile)) {
  await db.collection("scenarios").updateOne({ title: scenario.title }, { $set: scenario }, { upsert: true });
  console.log(`scenario: ${scenario.title} (${scenario.incidents.length} incidents)`);
}

await mongoose.disconnect();

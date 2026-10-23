// Loads story and grammar JSON files into MongoDB. Safe to run again: everything is upserted.
//
//   pnpm seed ~/Downloads/stories.json ~/Downloads/grammar-topics.json
//
// File type is detected from the content: { guides, scenarios } = stories, an array = grammar topics.
// Plain mongoose collections are used on purpose: node cannot import the .ts models without a build step.
import { readFileSync } from "node:fs";
import mongoose from "mongoose";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: pnpm seed <stories.json> [grammar-topics.json]");
  process.exit(1);
}
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set (run through `pnpm seed`).");

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

async function seedStories({ guides, scenarios }) {
  const guideIds = {};
  for (const g of guides) {
    await db.collection("guides").updateOne({ key: g.key }, { $set: { name: g.name, avatar: g.avatar } }, { upsert: true });
    guideIds[g.key] = (await db.collection("guides").findOne({ key: g.key }))._id;
  }

  for (const s of scenarios) {
    const doc = {
      title: s.title,
      sceneSetup: s.sceneSetup,
      startIncident: s.startIncident,
      published: s.published ?? false,
      characters: s.characters.map(({ id, name, role, persona, secret }) => ({ id, name, role, persona, secret: secret ?? null })),
      // Only the story skeleton is kept. `variants` and `keyVocab` in the file are ignored: the AI writes those live.
      incidents: s.incidents.map((i) => {
        if (!guideIds[i.userGuideId]) throw new Error(`Incident ${i.id}: unknown guide "${i.userGuideId}"`);
        return {
          id: i.id,
          title: i.title,
          scenario: i.scenario,
          userRole: i.userRole,
          openingFrom: i.openingFrom,
          characterParticipants: i.characterParticipants,
          userGuideId: guideIds[i.userGuideId],
          milestones: i.milestones.map(({ id, goal }) => ({ id, goal })),
        };
      }),
      updatedAt: new Date(),
    };
    checkStory(doc);
    await db.collection("scenarios").updateOne({ title: doc.title }, { $set: doc, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    console.log(`scenario: ${doc.title} (${doc.incidents.length} incidents)`);
  }
}

// Catches typos in ids before they break a chat at runtime.
function checkStory(s) {
  const chars = new Set(s.characters.map((c) => c.id));
  if (!s.incidents.some((i) => i.id === s.startIncident)) throw new Error(`${s.title}: startIncident "${s.startIncident}" does not exist`);
  for (const i of s.incidents) {
    for (const id of [i.openingFrom, ...i.characterParticipants]) {
      if (!chars.has(id)) throw new Error(`${s.title} / ${i.id}: unknown character "${id}"`);
    }
    if (!i.characterParticipants.includes(i.openingFrom)) throw new Error(`${s.title} / ${i.id}: openingFrom is not a participant`);
  }
}

async function seedGrammar(topics) {
  for (const t of topics) {
    const { slug, title, level, explanation, lesson } = t;
    await db.collection("grammartopics").updateOne({ slug }, { $set: { slug, title, level, explanation, lesson } }, { upsert: true });
  }
  console.log(`grammar topics: ${topics.length}`);
}

for (const file of files) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (Array.isArray(data)) await seedGrammar(data);
  else if (data.scenarios) await seedStories(data);
  else throw new Error(`${file}: not a stories file or a grammar topics file`);
}

await mongoose.disconnect();

import type { Types } from "mongoose";

import { UserProfile } from "@/models/user-profile";
import { UserVocab } from "@/models/user-vocab";
import { VocabularyModel } from "@/models/vocab";

const POS = ["NOUN", "VERB", "ADJECTIVE", "ADVERB", "PRONOUN", "PREPOSITION", "CONJUNCTION", "INTERJECTION"] as const;

export type NewWord = {
  word: string;
  meaning: string;
  example: string;
  partOfSpeech: string;
  translation?: string;
  pronunciation?: string;
};

// Adds a word to the user's list and to the shared word bank. Words they already have are left alone.
// One place for every source: tapped in reading, met in a chat, or misused in a chat.
export async function addUserWord(
  userId: string,
  level: string,
  w: NewWord,
  source: "incident" | "tapped" | "mistake",
  where?: { scenarioId: Types.ObjectId; incidentId: string },
): Promise<boolean> {
  const word = w.word.toLowerCase();
  const pos = (POS as readonly string[]).includes(w.partOfSpeech?.toUpperCase()) ? w.partOfSpeech.toUpperCase() : "NOUN";

  const res = await UserVocab.updateOne(
    { userId, word },
    { $setOnInsert: { userId, word, level, partOfSpeech: pos.toLowerCase(), meaning: w.meaning, translation: w.translation, example: w.example, pronunciation: w.pronunciation, source, ...where } },
    { upsert: true },
  );
  if (res.upsertedCount) await UserProfile.updateOne({ authUserId: userId }, { $inc: { totalVocabLearned: 1 } });

  await VocabularyModel.updateOne(
    { word },
    { $setOnInsert: { word, level, difficulty: "MEDIUM", partOfSpeech: pos, meaning: w.meaning, pronunciation: w.pronunciation, examples: [w.example] } },
    { upsert: true },
  );
  return Boolean(res.upsertedCount);
}

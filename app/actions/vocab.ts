"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserProfile } from "@/models/user-profile";
import { addUserWord } from "@/lib/vocab-store";
import { VocabularyModel, type Vocabulary } from "@/models/vocab";

// Reading session "Save word": adds the word to the user's list (and the shared word bank).
export async function saveWord(w: { word: string; meaning: string; translation: string; pronunciation: string; partOfSpeech: string; example: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await connectDB();

  const profile = await UserProfile.findOne({ authUserId: session.user.id }).lean();
  await addUserWord(session.user.id, profile?.currentLevel ?? "A2", w, "tapped");
  return { ok: true };
}

export type VocabCard = {
  id: string;
  word: string;
  level: Vocabulary["level"];
  difficulty: Vocabulary["difficulty"];
  partOfSpeech: Vocabulary["partOfSpeech"];
  meaning: string;
  pronunciation?: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
};

export async function getVocabCards(
  level?: Vocabulary["level"],
  limit = 30,
): Promise<VocabCard[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  await connectDB();

  const query = level ? { level } : {};
  const docs = await VocabularyModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.map((d) => ({
    id: String(d._id),
    word: d.word,
    level: d.level,
    difficulty: d.difficulty,
    partOfSpeech: d.partOfSpeech,
    meaning: d.meaning,
    pronunciation: d.pronunciation,
    examples: d.examples ?? [],
    synonyms: d.synonyms ?? [],
    antonyms: d.antonyms ?? [],
  }));
}

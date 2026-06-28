"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VocabularyModel, type Vocabulary } from "@/models/vocab";

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

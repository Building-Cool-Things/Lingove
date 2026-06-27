import mongoose, { Schema, Document } from "mongoose";

export interface Vocabulary extends Document {
  word: string;

  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

  difficulty: "EASY" | "MEDIUM" | "HARD";

  partOfSpeech:
    | "NOUN"
    | "VERB"
    | "ADJECTIVE"
    | "ADVERB"
    | "PRONOUN"
    | "PREPOSITION"
    | "CONJUNCTION"
    | "INTERJECTION";

  meaning: string;

  pronunciation?: string;

  examples: string[];

  synonyms: string[];

  antonyms: string[];

  collocations: string[];

  phrasalForms: string[];

  tags: string[];
}

const VocabularySchema = new Schema<Vocabulary>({
  word: { type: String, required: true, unique: true },
  level: {
    type: String,
    enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["EASY", "MEDIUM", "HARD"],
    required: true,
  },
  partOfSpeech: {
    type: String,
    enum: [
      "NOUN",
      "VERB",
      "ADJECTIVE",
      "ADVERB",
      "PRONOUN",
      "PREPOSITION",
      "CONJUNCTION",
      "INTERJECTION",
    ],
    required: true,
  },
  meaning: { type: String, required: true },
  pronunciation: { type: String },
  examples: { type: [String], default: [] },
  synonyms: { type: [String], default: [] },
  antonyms: { type: [String], default: [] },
  collocations: { type: [String], default: [] },
  phrasalForms: { type: [String], default: [] },
  tags: { type: [String], default: [] },
});
export const VocabularyModel = mongoose.model<Vocabulary>(
  "Vocabulary",
  VocabularySchema,
);

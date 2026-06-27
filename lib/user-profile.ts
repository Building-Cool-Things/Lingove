import mongoose, { Schema, type Model } from "mongoose";

import { connectDB } from "@/lib/db";

export type UserProfileDocument = {
  authUserId: string;
  email?: string | null;
  name?: string | null;
  hasOnboarded: boolean;
  occupation?: string;
  interests?: string[];

  // Writing progress
  writingDifficulty: "EASY" | "MEDIUM" | "HARD";
  writingRecentScores: number[];
  writingRecentTopics: string[];
  writingTotalSubmissions: number;
  writingLastActivityAt: Date | null;

    // Reading progress
  readingDifficulty: "EASY" | "MEDIUM" | "HARD";
  readingRecentScores: number[];
  readingRecentTopics: string[];
  readingTotalSubmissions: number;
  readingLastActivityAt: Date | null;

  // Listening progress
  listeningDifficulty: "EASY" | "MEDIUM" | "HARD";
  listeningRecentScores: number[];
  listeningRecentTopics: string[];
  listeningTotalSubmissions: number;
  listeningLastActivityAt: Date | null;

  // Speaking progress
  speakingDifficulty: "EASY" | "MEDIUM" | "HARD";
  speakingRecentScores: number[];
  speakingRecentTopics: string[];
  speakingTotalSubmissions: number;
  speakingLastActivityAt: Date | null;


   // Overall stats
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Date | null;
  totalVocabLearned: number;

  totalXP: number;
  level: number;
  xpForNextLevel: number;

  createdAt: Date;
  updatedAt: Date;
};

const userProfileSchema = new Schema<UserProfileDocument>(
  {
    authUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: null },
    name: { type: String, default: null },
    hasOnboarded: { type: Boolean, required: true, default: false },
    occupation: { type: String, default: "" },
    interests: { type: [String], default: [] },

    writingDifficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"] as const, default: "EASY" },
    writingRecentScores: { type: [Number], default: [] },
    writingRecentTopics: { type: [String], default: [] },
    writingTotalSubmissions: { type: Number, default: 0 },
    writingLastActivityAt: { type: Date, default: null },

    readingDifficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"] as const, default: "EASY" },
    readingRecentScores: { type: [Number], default: [] },
    readingRecentTopics: { type: [String], default: [] },
    readingTotalSubmissions: { type: Number, default: 0 },
    readingLastActivityAt: { type: Date, default: null },

    listeningDifficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"] as const, default: "EASY" },
    listeningRecentScores: { type: [Number], default: [] },
    listeningRecentTopics: { type: [String], default: [] },
    listeningTotalSubmissions: { type: Number, default: 0 },
    listeningLastActivityAt: { type: Date, default: null },

    speakingDifficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"] as const, default: "EASY" },
    speakingRecentScores: { type: [Number], default: [] },
    speakingRecentTopics: { type: [String], default: [] },
    speakingTotalSubmissions: { type: Number, default: 0 },
    speakingLastActivityAt: { type: Date, default: null },

    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: null },
    totalVocabLearned: { type: Number, default: 0 },

    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xpForNextLevel: { type: Number, default: 100 },
  },
  { timestamps: true }
);

// Always delete the cached model so schema changes take effect on hot reload.
// In production the module is evaluated once, so this is safe.
delete (mongoose.models as Record<string, unknown>).UserProfile;

export const UserProfile = mongoose.model<UserProfileDocument>(
  "UserProfile",
  userProfileSchema,
  "user_profiles"
);

export async function ensureUserProfile(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  await connectDB();

  return UserProfile.findOneAndUpdate(
    { authUserId: user.id },
    {
      $setOnInsert: {
        authUserId: user.id,
        hasOnboarded: false,
      },
      $set: {
        email: user.email ?? null,
        name: user.name ?? null,
      },
    },
    { new: true, upsert: true }
  ).lean<UserProfileDocument>();
}

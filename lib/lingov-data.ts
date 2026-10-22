import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ensureUserProfile } from "@/lib/user-profile";

export type LingovProfile = {
  hasOnboarded: boolean;
  nativeLanguage: string;
  interests: string[];
  currentLevel: string;
  dailyTimeSpend: number;
  correctionStyle: string;
  level: number;
  totalXP: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  incidentsCompleted: number;
  totalVocabLearned: number;
  activeDays: string[];
  practicedToday: boolean;
  readingDifficulty: "EASY" | "MEDIUM" | "HARD";
  writingDifficulty: "EASY" | "MEDIUM" | "HARD";
};

// Session user + profile as plain JSON for the Lingov client app.
export async function getLingovData() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const { id, name, email } = session.user;
  const p = await ensureUserProfile({ id, email, name });
  const last = p?.lastActivityAt ? new Date(p.lastActivityAt) : null;

  const profile: LingovProfile = {
    hasOnboarded: Boolean(p?.hasOnboarded),
    nativeLanguage: p?.nativeLanguage ?? "",
    interests: p?.interests ?? [],
    currentLevel: p?.currentLevel ?? "",
    dailyTimeSpend: p?.dailyTimeSpend ?? 10,
    correctionStyle: p?.correctionStyle ?? "instant",
    level: p?.level ?? 1,
    totalXP: p?.totalXP ?? 0,
    xpForNextLevel: p?.xpForNextLevel ?? 100,
    currentStreak: p?.currentStreak ?? 0,
    longestStreak: p?.longestStreak ?? 0,
    incidentsCompleted: p?.incidentsCompleted ?? 0,
    totalVocabLearned: p?.totalVocabLearned ?? 0,
    activeDays: (p?.activeDays ?? []).map((d) => new Date(d).toISOString()),
    practicedToday: !!last && last.toDateString() === new Date().toDateString(),
    readingDifficulty: p?.readingDifficulty ?? "EASY",
    writingDifficulty: p?.writingDifficulty ?? "EASY",
  };

  return { user: { name, email }, profile };
}

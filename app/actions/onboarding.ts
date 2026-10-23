"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AVATARS, GOALS, LANGS, LEVELS } from "@/lib/lingov/data";
import { UserProfile } from "@/models/user-profile";

export type OnboardingInput = {
  name: string;
  image: string;
  nativeLanguage: string;
  interests: string[];
  currentLevel: string;
  dailyTimeSpend: number;
  notifyLanguages: string[];
};

type OnboardingResult = { ok: boolean; message: string };

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function completeOnboarding(data: OnboardingInput): Promise<OnboardingResult> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const interests = data.interests.filter((v) => typeof v === "string" && v.trim().length > 0).slice(0, 15);

  const name = data.name.trim().slice(0, 50);
  if (!name) {
    return { ok: false, message: "Please enter your name." };
  }
  // Avatar must be one of our emojis, or the photo the user already has (e.g. from Google).
  if (!AVATARS.includes(data.image) && data.image !== user.image) {
    return { ok: false, message: "Please pick a picture." };
  }

  // Never trust the client: only accept values the UI actually offers.
  // The client sends the language code; we store the full English name (e.g. "Hindi").
  const nativeLanguage = LANGS.find(([code]) => code === data.nativeLanguage)?.[2];
  if (!nativeLanguage) {
    return { ok: false, message: "Please pick your native language." };
  }
  if (!LEVELS.some(([code]) => code === data.currentLevel)) {
    return { ok: false, message: "Please pick your level." };
  }
  if (!GOALS.some(([min]) => min === data.dailyTimeSpend)) {
    return { ok: false, message: "Please pick a daily goal." };
  }

  if (interests.length < 3) {
    return { ok: false, message: "Please pick at least 3 interests." };
  }

  await connectDB();
  await auth.api.updateUser({ headers: await headers(), body: { name, image: data.image } });

  await UserProfile.updateOne(
    { authUserId: user.id },
    {
      $set: {
        hasOnboarded: true,
        name,
        nativeLanguage,
        interests,
        currentLevel: data.currentLevel,
        dailyTimeSpend: data.dailyTimeSpend,
        notifyLanguages: data.notifyLanguages,
      },
      $setOnInsert: { authUserId: user.id },
    },
    { upsert: true }
  );

  return { ok: true, message: "" };
}

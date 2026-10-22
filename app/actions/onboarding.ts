"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserProfile } from "@/lib/user-profile";

export type OnboardingInput = {
  nativeLanguage: string;
  interests: string[];
  currentLevel: string;
  dailyTimeSpend: number;
  correctionStyle: "instant" | "end";
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

  if (!data.nativeLanguage) {
    return { ok: false, message: "Please pick your native language." };
  }

  if (interests.length < 3) {
    return { ok: false, message: "Please pick at least 3 interests." };
  }

  await connectDB();

  await UserProfile.updateOne(
    { authUserId: user.id },
    {
      $set: {
        hasOnboarded: true,
        nativeLanguage: data.nativeLanguage,
        interests,
        currentLevel: data.currentLevel,
        dailyTimeSpend: data.dailyTimeSpend,
        correctionStyle: data.correctionStyle === "end" ? "end" : "instant",
        notifyLanguages: data.notifyLanguages,
      },
      $setOnInsert: { authUserId: user.id },
    },
    { upsert: true }
  );

  return { ok: true, message: "" };
}

"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureUserProfile, UserProfile } from "@/lib/user-profile";

type OnboardingState = {
  hasOnboarded: boolean;
  occupation: string;
  interests: string[];
};

type OnboardingResult = { ok: boolean; message: string };

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function getOnboardingState(): Promise<OnboardingState | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await ensureUserProfile({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    hasOnboarded: Boolean(profile?.hasOnboarded),
    occupation: profile?.occupation ?? "",
    interests: profile?.interests ?? [],
  };
}

export async function completeOnboarding(data: {
  occupation: string;
  interests: string[];
}): Promise<OnboardingResult> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const occupation = data.occupation.trim();
  const interests = data.interests.filter((v) => typeof v === "string" && v.trim().length > 0);

  if (!occupation) {
    return { ok: false, message: "Please select what you do." };
  }

  if (interests.length === 0) {
    return { ok: false, message: "Please pick at least one interest." };
  }

  await connectDB();

  await UserProfile.updateOne(
    { authUserId: user.id },
    {
      $set: { hasOnboarded: true, occupation, interests },
      $setOnInsert: { authUserId: user.id },
    },
    { upsert: true }
  );

  return { ok: true, message: "" };
}

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { customSession } from "better-auth/plugins";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { UserProfile, ensureUserProfile } from "@/models/user-profile";

await connectDB();

export const auth = betterAuth({
  database: mongodbAdapter(mongoose.connection.db!),
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          if (!user?.id) return;

          await ensureUserProfile({
            id: user.id,
            email: user.email,
            name: user.name,
          });
        },
      },
    },
  },
  // Passwords are hashed (scrypt) by better-auth; we never store or see them in plain text.
  emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
  // Blocks brute-force logins (stricter limits on sign-in / sign-up are built in).
  rateLimit: { enabled: true },
  plugins: [
    // Adds the onboarding fields to every session, so pages can read them
    // from useSession() / auth.api.getSession() without another query.
    customSession(async ({ user, session }) => {
      const p = await UserProfile.findOne({ authUserId: user.id }).lean();
      return {
        session,
        user: {
          ...user,
          hasOnboarded: p?.hasOnboarded ?? false,
          nativeLanguage: p?.nativeLanguage ?? "",
          interests: p?.interests ?? [],
          currentLevel: p?.currentLevel ?? "",
          dailyTimeSpend: p?.dailyTimeSpend ?? 10,
        },
      };
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

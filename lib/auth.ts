import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ensureUserProfile } from "@/lib/user-profile";

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
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/lingov/auth-screen";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  // First-time users go to onboarding, everyone else to the app.
  if (session?.user) redirect(session.user.hasOnboarded ? "/dashboard" : "/onboarding");

  return <AuthScreen />;
}

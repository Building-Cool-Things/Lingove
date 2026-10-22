import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/lingov/auth-screen";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  return <AuthScreen />;
}

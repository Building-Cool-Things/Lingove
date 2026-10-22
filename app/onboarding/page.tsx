import { redirect } from "next/navigation";

import { Onboarding } from "@/components/lingov/onboarding";
import { getLingovData } from "@/lib/lingov-data";

export default async function OnboardingPage() {
  const data = await getLingovData();
  if (!data) redirect("/");
  if (data.profile.hasOnboarded) redirect("/dashboard");
  return <Onboarding />;
}

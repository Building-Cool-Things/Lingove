import { redirect } from "next/navigation";

import { getPlacementQuestions } from "@/app/actions/onboarding";
import { Onboarding } from "@/components/lingov/onboarding";
import { getLingovData } from "@/lib/lingov-data";

export default async function OnboardingPage() {
  const data = await getLingovData();
  if (!data) redirect("/");
  if (data.profile.hasOnboarded) redirect("/dashboard");
  return <Onboarding name={data.user.name} image={data.user.image} questions={await getPlacementQuestions()} />;
}

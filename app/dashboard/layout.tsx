import { redirect } from "next/navigation";

import { LingovProvider } from "@/components/lingov/store";
import { getLingovData } from "@/lib/lingov-data";

// Signed-in, onboarded users only. The provider keeps app state across tabs.
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const data = await getLingovData();
  if (!data) redirect("/");
  if (!data.profile.hasOnboarded) redirect("/onboarding");

  return (
    <LingovProvider user={data.user} profile={data.profile}>
      {children}
    </LingovProvider>
  );
}

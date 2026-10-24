import { Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export default function ProgressPage() {
  return (
    <section className="px-5 py-6 sm:px-8 lg:px-10">
      <Badge variant="secondary">Progress</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">Progress</h1>
      <p className="mt-2 text-muted-foreground">
        Track your streaks, words learned, and improvements over time. Coming soon.
      </p>
      <div className="mt-16 flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
        <Target className="size-12 opacity-30" />
        <p className="text-sm">This section is under construction.</p>
      </div>
    </section>
  );
}

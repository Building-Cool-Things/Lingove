import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export default function ReadingPage() {
  return (
    <section className="px-5 py-6 sm:px-8 lg:px-10">
      <Badge variant="secondary">Reading practice</Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Reading</h1>
      <p className="mt-2 text-muted-foreground">
        Short passages with comprehension and meaning checks. Coming soon.
      </p>
      <div className="mt-16 flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
        <BookOpen className="size-12 opacity-30" />
        <p className="text-sm">This section is under construction.</p>
      </div>
    </section>
  );
}

import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getReadingSubmission } from "@/app/actions/reading";
import { ReadingAnalysis } from "@/components/reading/reading-analysis";

function AnalysisSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
        <div className="flex gap-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-[44%] shrink-0 border-r border-border bg-muted/20 px-7 py-8 lg:block xl:px-10">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-5 space-y-3">
            {[1, 0.9, 0.75, 1, 0.85, 0.6, 1, 0.8].map((w, i) => (
              <div key={i} className="h-3.5 animate-pulse rounded bg-muted" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 xl:px-10">
          <div className="flex items-center gap-6">
            <div className="size-[108px] animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Loading your results…
          </p>
        </div>
      </div>
    </div>
  );
}

async function AnalysisContent({ id }: { id: string }) {
  const submission = await getReadingSubmission(id);
  if (!submission) notFound();
  return <ReadingAnalysis submission={submission} />;
}

export default async function ReadingAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submission = await getReadingSubmission(id);
  if (!submission) notFound();

  return (
    <Suspense fallback={<AnalysisSkeleton />}>
      <AnalysisContent id={id} />
    </Suspense>
  );
}

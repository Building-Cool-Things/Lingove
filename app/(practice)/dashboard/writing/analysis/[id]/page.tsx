import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  getOrGenerateAnalysis,
  getSubmission,
} from "@/app/actions/writing";
import { WritingAnalysis } from "@/components/writing/writing-analysis";

// ── Loading skeleton shown while AI generates the analysis ────────────────────

function AnalysisSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* header ghost */}
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
        {/* left panel ghost */}
        <div className="hidden w-[40%] shrink-0 border-r border-indigo-100 bg-indigo-50/60 px-7 py-8 dark:border-indigo-900/40 dark:bg-indigo-950/20 lg:block xl:px-10">
          <div className="h-3 w-32 animate-pulse rounded bg-indigo-200 dark:bg-indigo-900/40" />
          <div className="mt-5 space-y-3">
            {[1, 0.9, 0.75, 1, 0.85, 0.6].map((w, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-indigo-100 dark:bg-indigo-900/30"
                style={{ width: `${w * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* right analysis ghost */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 xl:px-10">
          <div className="flex items-center gap-6">
            <div className="size-[108px] animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>

          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-36 animate-pulse rounded-xl bg-emerald-50 dark:bg-emerald-950/20" />
            <div className="h-36 animate-pulse rounded-xl bg-amber-50 dark:bg-amber-950/20" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Analysing your writing…
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Async server component — suspends while analysis is generated ─────────────

async function AnalysisContent({ id }: { id: string }) {
  const submission = await getOrGenerateAnalysis(id);
  if (!submission) notFound();
  return <WritingAnalysis submission={submission} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WritingAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submission = await getSubmission(id);
  if (!submission) notFound();

  return (
    <Suspense fallback={<AnalysisSkeleton />}>
      <AnalysisContent id={id} />
    </Suspense>
  );
}

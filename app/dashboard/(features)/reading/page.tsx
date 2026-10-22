import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { connectDB } from "@/lib/db";
import { ReadingModel } from "@/models/reading";
import { levelChip, PageShell, sectionTitle } from "@/components/page-shell";

export default async function ReadingPage() {
  await connectDB();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/");

  const submissions = await ReadingModel.find({ authUserId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return (
    <PageShell title="Reading">
      <Link
        href="/dashboard/reading/practice"
        className="flex items-center gap-4 rounded-[20px] bg-[linear-gradient(135deg,#ffc6a8,#f6a07a)] p-[18px] text-[#2a1206] shadow-[inset_0_1px_0_rgba(255,255,255,.35)] active:scale-[.99]"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-[11.5px] font-semibold tracking-[.04em]">NEW PASSAGE</span>
          <span className="text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">Start a reading practice</span>
          <span className="text-[13px] font-medium">
            Read a passage, then answer MCQ, True/False/Not Given and short questions.
          </span>
        </div>
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#2a1206] text-[#ffb38f]">
          <ArrowRight className="size-7" />
        </span>
      </Link>

      <span className={sectionTitle}>Recent sessions</span>
      {submissions.length === 0 ? (
        <span className="text-sm text-muted-foreground">No sessions yet. Start your first reading practice!</span>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {submissions.map((s) => (
            <Link
              key={String(s._id)}
              href={`/dashboard/reading/analysis/${String(s._id)}`}
              className="lg-card flex flex-col gap-2.5 p-3.5 transition-colors hover:border-primary"
            >
              <span className="lg-tile flex size-11 items-center justify-center rounded-xl text-foreground dark:text-[#c5cee0]">
                <BookOpen className="size-[19px]" />
              </span>
              <span className="text-[15px] font-semibold leading-tight">{s.title}</span>
              <span className="text-[13px] capitalize leading-snug text-muted-foreground">
                {s.topic} · {s.passageType?.toLowerCase()}
              </span>
              <div className="mt-auto flex items-center gap-2">
                <span className={levelChip}>{s.difficulty}</span>
                <span className="text-xs text-muted-foreground">
                  {s.correctCount ?? 0}/{s.totalQuestions ?? 0} correct
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

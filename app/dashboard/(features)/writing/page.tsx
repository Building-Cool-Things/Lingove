import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

import { connectDB } from "@/lib/db";
import { WritingModel } from "@/models/writing";
import { levelChip, PageShell, sectionTitle } from "@/components/page-shell";

export default async function WritingPage() {
  await connectDB();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/");

  const submissions = await WritingModel.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return (
    <PageShell title="Writing">
      <Link
        href="/dashboard/writing/practice"
        className="flex items-center gap-4 rounded-[20px] bg-[linear-gradient(135deg,#ffc6a8,#f6a07a)] p-[18px] text-[#2a1206] shadow-[inset_0_1px_0_rgba(255,255,255,.35)] active:scale-[.99]"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-[11.5px] font-semibold tracking-[.04em]">NEW PROMPT</span>
          <span className="text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">Start a writing practice</span>
          <span className="text-[13px] font-medium">Respond to a prompt and get corrections with a score.</span>
        </div>
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#2a1206] text-[#ffb38f]">
          <ArrowRight className="size-7" />
        </span>
      </Link>

      <span className={sectionTitle}>Submissions</span>
      {submissions.length === 0 ? (
        <span className="text-sm text-muted-foreground">No submissions yet.</span>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {submissions.map((s) => (
            <Link
              key={String(s._id)}
              href={`/dashboard/writing/analysis/${String(s._id)}`}
              className="lg-card flex flex-col gap-2.5 p-3.5 transition-colors hover:border-primary"
            >
              <span className="lg-tile flex size-11 items-center justify-center rounded-xl text-foreground dark:text-[#c5cee0]">
                <PenLine className="size-[19px]" />
              </span>
              <span className="text-[15px] font-semibold leading-tight">{s.title}</span>
              <span className="text-[13px] leading-snug text-muted-foreground">{s.topic}</span>
              <div className="mt-auto flex items-center gap-2">
                <span className={levelChip}>{s.difficulty}</span>
                <span className="text-xs capitalize text-muted-foreground">{s.type.toLowerCase()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

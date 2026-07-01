import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { connectDB } from "@/lib/db";
import { ReadingModel } from "@/models/reading";
import { Button } from "@/components/ui/button";

const DIFFICULTY_CHIP: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HARD:   "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default async function ReadingPage() {
  await connectDB();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const submissions = await ReadingModel.find({ authUserId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return (
    <section className="px-5 py-10 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-semibold">Reading Practice</h3>
          <p className="mt-2 text-muted-foreground">
            Read passages and answer comprehension questions. IELTS-style MCQ, True/False/Not Given, and short answers.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/reading/practice">Start Practice</Link>
        </Button>
      </div>

      <div className="mt-7">
        <h3 className="text-2xl font-semibold">Recent Sessions</h3>
        {submissions.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No sessions yet. Start your first reading practice!</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {submissions.map((s) => (
              <li key={String(s._id)}>
                <Link
                  href={`/dashboard/reading/analysis/${String(s._id)}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{s.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_CHIP[s.difficulty] ?? ""}`}
                      >
                        {s.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.correctCount ?? 0}/{s.totalQuestions ?? 0} correct
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {s.topic} · {s.passageType?.toLowerCase()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { WritingModel } from "@/models/writing";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function WritingPage() {
  await connectDB();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const submissions = await WritingModel.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return (
    <section className="px-5 py-10 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-semibold">Writing Practice</h3>
          <p className="mt-2 text-muted-foreground">
            Practice your writing skills by responding to prompts and receiving feedback.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/writing/practice">Start Practice</Link>
        </Button>
      </div>
      <div className="mt-7">
        <h3 className="text-2xl font-semibold">Submissions</h3>
        {submissions.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No submissions yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {submissions.map((s) => (
              <li key={String(s._id)}>
                <Link
                  href={`/dashboard/writing/analysis/${String(s._id)}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {s.type.toLowerCase()} · {s.difficulty.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.topic}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

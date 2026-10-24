import { ReadingSession } from "@/components/lingov/reading-session";

// ?demo=read-start|read-word|read-ready|read-checking|read-results|read-review
export default async function ReadingSessionPage({ searchParams }: PageProps<"/dashboard/practice/reading">) {
  const { demo } = await searchParams;
  return <ReadingSession demo={typeof demo === "string" ? demo : undefined} />;
}

import { WritingSession } from "@/components/lingov/writing-session";

// ?demo=write-empty|write-draft|write-ready|write-checking|write-results|write-selected|write-improved|write-fixed
export default async function WritingSessionPage({ searchParams }: PageProps<"/dashboard/practice/writing">) {
  const { demo } = await searchParams;
  return <WritingSession demo={typeof demo === "string" ? demo : undefined} />;
}

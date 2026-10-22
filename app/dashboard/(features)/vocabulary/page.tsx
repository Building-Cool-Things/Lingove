import { VocabFlashcard } from "@/components/vocabulary/vocab-flashcard";
import { PageShell } from "@/components/page-shell";
import { getVocabCards } from "@/app/actions/vocab";

export default async function VocabularyPage() {
  const cards = await getVocabCards();

  return (
    <PageShell title="Vocabulary">
      <VocabFlashcard initial={cards} />
    </PageShell>
  );
}

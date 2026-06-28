import { Badge } from "@/components/ui/badge";
import { VocabFlashcard } from "@/components/vocabulary/vocab-flashcard";
import { getVocabCards } from "@/app/actions/vocab";

export default async function VocabularyPage() {
  const cards = await getVocabCards();

  return (
    <section className="px-5 py-6 sm:px-8 lg:px-10">
      <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
        Vocabulary
      </h1>
      <p className="mt-2 text-muted-foreground">
        Flip through your word bank. Send tricky words to the back, keep going until you know them all.
      </p>

      <div className="mt-10">
        <VocabFlashcard initial={cards} />
      </div>
    </section>
  );
}

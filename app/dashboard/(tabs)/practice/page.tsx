import { getVocabCards } from "@/app/actions/vocab";
import { Practice } from "@/components/lingov/practice";

export default async function PracticePage() {
  return <Practice vocab={await getVocabCards()} />;
}

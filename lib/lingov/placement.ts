// Placement test: the starting questions and how answers turn into a level. No database here.
import { LEVELS, type Level } from "@/models/_shared";

// Easy to hard, one question per level. Seeded into the database the first time the test is opened.
export const PLACEMENT_SEED: { order: number; level: Level; prompt: string; options: string[]; answerIndex: number }[] = [
  { order: 1, level: "A1", prompt: "Choose the correct sentence.", options: ["She are a teacher.", "She is a teacher.", "She am a teacher.", "She be a teacher."], answerIndex: 1 },
  { order: 2, level: "A2", prompt: "Yesterday I ___ to the market with my sister.", options: ["go", "gone", "went", "going"], answerIndex: 2 },
  { order: 3, level: "B1", prompt: "If it ___ tomorrow, we will stay at home.", options: ["will rain", "rained", "is raining", "rains"], answerIndex: 3 },
  { order: 4, level: "B2", prompt: "Had I known about the delay, I ___ earlier.", options: ["would leave", "had left", "would have left", "will leave"], answerIndex: 2 },
  { order: 5, level: "C1", prompt: "Rarely ___ such a talented speaker.", options: ["I have heard", "have I heard", "I heard", "did I heard"], answerIndex: 1 },
];

// One right answer is worth one step up from A1, so a single slip is forgiven.
// The level can never be higher than the hardest question that was answered correctly.
export function levelFrom(results: { level: string; correct: boolean }[]): Level {
  const right = results.filter((r) => r.correct);
  const top = Math.max(-1, ...right.map((r) => LEVELS.indexOf(r.level as Level)));
  return LEVELS[Math.max(0, Math.min(right.length - 1, top))];
}

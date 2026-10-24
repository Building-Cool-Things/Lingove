// Shared by the reading/writing server actions and the Lingov UI.
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export const LEVEL_LABELS: Record<Difficulty, string> = { EASY: "A2-B1", MEDIUM: "B1-B2", HARD: "C1-C2" };

export const READING_XP: Record<Difficulty, number> = { EASY: 30, MEDIUM: 60, HARD: 100 };
export const WRITING_XP: Record<Difficulty, number> = { EASY: 40, MEDIUM: 80, HARD: 120 };

export const WORD_LIMITS: Record<Difficulty, { range: string; min: number; recommended: number; max: number }> = {
  EASY: { range: "100-150 words", min: 100, recommended: 130, max: 150 },
  MEDIUM: { range: "150-220 words", min: 150, recommended: 190, max: 220 },
  HARD: { range: "220-300 words", min: 220, recommended: 260, max: 300 },
};

// Lingov reading sessions use the design's 5 multiple-choice / true-false questions.
export const SESSION_QUESTIONS = 5;

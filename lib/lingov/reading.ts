// Reading session: prototype sample content (used by ?demo= links) plus helpers that turn
// a ReadingTask from app/actions/reading.ts into what the design renders.
import type { ReadingTask, ReadingView } from "@/app/actions/reading";

export type ReadingQuestion = { t: "mc" | "tf"; prompt: string; opts: string[]; ans: number; p: number; why: string };
export type Answers = Record<number, number>;

export const RD: [string, string][] = [
  ["In the last few years, hundreds of companies around the world have tested a new idea: working four days a week instead of five. Staff keep the same salary, but they get one extra day off.", "पिछले कुछ वर्षों में, दुनिया भर की सैकड़ों कंपनियों ने एक नया विचार आज़माया है: पाँच के बजाय हफ्ते में चार दिन काम करना। कर्मचारियों का वेतन वही रहता है, लेकिन उन्हें एक दिन की अतिरिक्त छुट्टी मिलती है।"],
  ["The results have surprised many managers. In one large trial in the UK, most companies said that productivity stayed the same or even improved. Workers took fewer sick days, and fewer people left their jobs.", "नतीजों ने कई मैनेजरों को हैरान किया है। ब्रिटेन के एक बड़े परीक्षण में, ज़्यादातर कंपनियों ने कहा कि उत्पादकता वही रही या बेहतर हुई। कर्मचारियों ने कम बीमारी की छुट्टियाँ लीं, और कम लोगों ने नौकरी छोड़ी।"],
  ["However, the idea does not work for everyone. Hospitals, shops and restaurants need staff every day, so they often find it harder to change. Some workers also say that fitting five days of work into four makes their days longer and more stressful.", "हालाँकि, यह विचार हर किसी के लिए काम नहीं करता। अस्पतालों, दुकानों और रेस्तरां को हर दिन कर्मचारियों की ज़रूरत होती है, इसलिए उनके लिए बदलाव मुश्किल होता है। कुछ कर्मचारी कहते हैं कि पाँच दिन का काम चार दिन में करने से उनके दिन लंबे और तनावपूर्ण हो जाते हैं।"],
  ["Experts believe the key is planning. Companies that cut unnecessary meetings and set clear goals usually see the best results. For many of them, the shorter week is no longer a test. It is simply how they work now.", "विशेषज्ञों का मानना है कि असली बात योजना है। जो कंपनियाँ अनावश्यक मीटिंग कम करती हैं और साफ़ लक्ष्य तय करती हैं, उन्हें आमतौर पर सबसे अच्छे नतीजे मिलते हैं। कई कंपनियों के लिए छोटा हफ्ता अब परीक्षण नहीं है। यह बस उनके काम करने का तरीका है।"],
];

export const GL: Record<string, [string, string, string]> = {
  salary: ["/ˈsæləri/", "Money you are paid for your job, usually every month.", "वेतन"],
  trial: ["/ˈtraɪəl/", "A test to see if something works.", "परीक्षण"],
  productivity: ["/ˌprɒdʌkˈtɪvəti/", "How much work is done in a period of time.", "उत्पादकता"],
  stressful: ["/ˈstresfəl/", "Making you feel worried and tired.", "तनावपूर्ण"],
  unnecessary: ["/ʌnˈnesəsəri/", "Not needed.", "अनावश्यक"],
};
export const GL_RE = new RegExp("\\b(" + Object.keys(GL).join("|") + ")\\b", "i");

export const RQ: ReadingQuestion[] = [
  { t: "mc", prompt: "What stays the same for workers in a four-day week?", opts: ["The number of meetings", "Their salary", "Their hours per day", "Their job title"], ans: 1, p: 0, why: 'Paragraph 1 says "Staff keep the same salary, but they get one extra day off."' },
  { t: "tf", prompt: "The UK trial lasted for one full year.", opts: ["True", "False", "Not given"], ans: 2, p: 1, why: "Paragraph 2 describes the UK trial but never says how long it lasted, so the answer is Not given." },
  { t: "mc", prompt: "Why is the change harder for hospitals and shops?", opts: ["They pay lower salaries", "Their staff prefer five days", "They need staff every day", "They have too many meetings"], ans: 2, p: 2, why: 'Paragraph 3 says hospitals, shops and restaurants "need staff every day".' },
  { t: "tf", prompt: "Some workers say a four-day week makes their days more stressful.", opts: ["True", "False", "Not given"], ans: 0, p: 2, why: 'Paragraph 3 says fitting five days into four "makes their days longer and more stressful".' },
  { t: "mc", prompt: 'In paragraph 4, "unnecessary" is closest in meaning to:', opts: ["important", "not needed", "very long", "online"], ans: 1, p: 3, why: '"Unnecessary" means not needed. Companies removed meetings they did not need.' },
];

export type Skill = "details" | "tfng" | "vocab";
export const RS_SKILLS: [string, Skill, string][] = [["Finding details", "details", "Locate a fact stated in the text"], ["True / False / Not given", "tfng", "Decide if the text says it"], ["Vocabulary in context", "vocab", "Work out meaning from the sentence"]];
export const rsSteps = (n: number): [string, number][] => [["Checking " + n + " answers", 0.2], ["Finding evidence in the passage", 0.6], ["Writing your feedback", 1]];

// Prototype passage in the backend's ReadingTask shape (demo links).
const TF_VALUES = ["True", "False", "Not Given"];
export const SAMPLE_TASK: ReadingTask = {
  title: "Why some companies are trying a four-day week", topic: "Work", passageType: "ARTICLE", difficulty: "MEDIUM", level: "B1",
  passage: RD.map((p) => p[0]).join("\n\n"), passageWordCount: 190, tips: [],
  questions: RQ.map((q, i) => ({
    index: i, text: q.prompt, type: q.t === "tf" ? "TRUE_FALSE_NG" : "MCQ", explanation: q.why, paragraph: q.p,
    options: q.t === "tf" ? null : q.opts.map((o, k) => "ABCD"[k] + ". " + o),
    correctAnswer: q.t === "tf" ? TF_VALUES[q.ans] : "ABCD"[q.ans],
    skill: q.t === "tf" ? "tfng" : q.p === 3 ? "vocab" : "details",
  })),
  glossary: Object.entries(GL).map(([word, [ipa, meaning, native]]) => ({ word, ipa, meaning, native, partOfSpeech: "NOUN" })),
};
// Prototype demo answers are option indexes.
export const demoAnswers = (a: Answers) => Object.fromEntries(Object.entries(a).map(([i, k]) => [i, questionsOf(SAMPLE_TASK)[+i].values[k]]));

// What the design renders for one question.
export type QV = { prompt: string; tf: boolean; labels: string[]; values: string[]; correct: string; p: number | null; skill: Skill; why: string };
export function questionsOf(task: ReadingTask): QV[] {
  return task.questions.map((q) => {
    const tf = q.type === "TRUE_FALSE_NG";
    const labels = tf ? ["True", "False", "Not given"] : (q.options ?? []).map((o) => o.replace(/^\s*[A-D][.)]\s*/, ""));
    const values = tf ? TF_VALUES : labels.map((_, k) => "ABCD"[k]);
    const raw = q.correctAnswer.trim();
    const correct = tf ? TF_VALUES.find((v) => v.toLowerCase() === raw.toLowerCase()) ?? raw : raw.charAt(0).toUpperCase();
    return { prompt: q.text, tf, labels, values, correct, p: typeof q.paragraph === "number" ? q.paragraph : null, skill: q.skill ?? (tf ? "tfng" : "details"), why: q.explanation };
  });
}
export const paragraphsOf = (task: ReadingTask) => task.passage.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const glossaryRe = (task: ReadingTask) => {
  const w = (task.glossary ?? []).map((g) => g.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return w.length ? new RegExp("\\b(" + w.join("|") + ")\\b", "i") : null;
};
export const labelOf = (q: QV, value?: string) => (value == null ? "–" : q.labels[q.values.indexOf(value)] ?? value);

export const scoreColor = (right: number, n: number) => (right >= 0.8 * n ? "#4cc283" : right >= 0.6 * n ? "#ffb38f" : "#ea7a4f");
export const verdict = (right: number, n: number) => (right === n ? "Excellent" : right >= 0.8 * n ? "Good" : right >= 0.6 * n ? "Fair" : "Needs work");
export const fmtTime = (s: number) => Math.floor(s / 60) + " min " + (s % 60) + " s";

// Prototype feedback rules (used for demo links and when the AI returns no feedback).
export function feedback(qs: QV[], good: boolean[]) {
  const right = good.filter(Boolean).length, n = qs.length, wr = qs.filter((_, i) => !good[i]);
  if (!wr.length) return "Excellent work. You understood the main ideas and the specific details of the passage, including vocabulary in context.";
  let t = right >= 0.8 * n ? "You show a good understanding of the passage and found most of the key points." : right >= 0.4 * n ? "You understood some of the main ideas but missed several details." : "You found this passage difficult. Read it again slowly before answering.";
  if (wr.some((x) => x.tf)) t += " Take more care with True / False / Not given: if the passage does not say it, the answer is Not given.";
  if (wr.some((x) => !x.tf && x.skill !== "vocab")) t += " For multiple choice, find the exact sentence in the passage before you choose.";
  if (wr.some((x) => !x.tf && x.skill === "vocab")) t += " Tap underlined words to check their meaning in context.";
  return t;
}

// Local marking for demo links (same rule as the backend for MCQ / TF).
export function gradeLocal(task: ReadingTask, ans: Record<number, string>, timeTaken: number): ReadingView {
  const qs = questionsOf(task);
  const results = qs.map((q, i) => ({ questionIndex: i, userAnswer: ans[i] ?? "", isCorrect: ans[i] === q.correct, feedback: "" }));
  const correctCount = results.filter((r) => r.isCorrect).length;
  return {
    id: "demo", title: task.title, topic: task.topic, passageType: task.passageType, difficulty: task.difficulty, passage: task.passage,
    passageWordCount: task.passageWordCount, questions: task.questions, userAnswers: results.map((r) => ({ questionIndex: r.questionIndex, answer: r.userAnswer })),
    results, correctCount, totalQuestions: qs.length, score: correctCount * 2, timeTaken,
    generalFeedback: feedback(qs, results.map((r) => r.isCorrect)), improvementPlan: [], newVocabulary: [], analysisStatus: "COMPLETED", createdAt: new Date(0).toISOString(),
  };
}

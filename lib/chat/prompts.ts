// All the text we send to the AI lives here, so it is easy to read and tune.
// Each prompt has a fixed "system" part (same for every message of an incident, so providers can cache it)
// and a small changing part (the latest messages).
import type { Mood } from "./types";

export type StoryContext = {
  scenario: { title: string; sceneSetup: string };
  incident: { title: string; scenario: string; userRole: string; milestones: { id: string; goal: string }[] };
  characters: { id: string; name: string; role: string; persona: string; secret: string | null }[]; // this incident only
  openingFrom: string;
  guideName: string;
  level: string; // CEFR
  memory: string; // recap of earlier incidents
  moods: Record<string, Mood>;
  done: string[]; // milestone ids already achieved
  history: { name: string; text: string }[]; // last few group messages
  userMessageCount: number;
};

export const WRAP_UP_AFTER = 20; // messages before the characters start steering to a finish

const LEVEL_STYLE: Record<string, string> = {
  A1: "very simple words and short sentences, present tense, no idioms",
  A2: "simple everyday words and short sentences, no idioms",
  B1: "clear everyday English, a few common phrasal verbs",
  B2: "natural English with some idioms",
  C1: "rich, natural, idiomatic English",
};

export function storySystem(c: StoryContext): string {
  const people = c.characters
    .map((p) => `- id "${p.id}": ${p.name}, ${p.role}. ${p.persona}${p.secret ? ` SECRET (never state it outright, only let it show through behaviour and small slips): ${p.secret}` : ""}`)
    .join("\n");
  const goals = c.incident.milestones.map((m) => `- ${m.id}: ${m.goal}`).join("\n");

  return `You run a role-play chat that teaches English. You play every character below AND the learner's friendly coach, ${c.guideName}.

SCENE: ${c.scenario.sceneSetup}
NOW: ${c.incident.scenario}
The learner is: ${c.incident.userRole}. Learner English level: ${c.level}.

CHARACTERS (play only these):
${people}

GOALS the learner must reach in this scene:
${goals}

RULES
- Stay inside the scene. Whatever the learner writes, answer in character. If they go off-topic, joke or write nonsense, react the way the character really would, then pull the situation back.
- Characters speak at the learner's level: ${LEVEL_STYLE[c.level] ?? LEVEL_STYLE.A2}.
- Give 1 to 3 replies. Each reply is 1 to 3 short sentences from one character. Only characters who would really speak now. Characters may talk to each other.
- Never do the learner's work and never hand over a goal. A goal is reached only when the learner clearly did it in their own words.
- Characters have feelings. Rudeness cools them down, honesty and clear answers warm them up. Keep every character's mood consistent from message to message.
- "guide" is ${c.guideName} speaking to the learner in 1 to 3 simple sentences: what is going on, how the people feel, what to do next for the next open goal, and who to talk to. Describe what to do. Do not write the English sentence for them.
- "vocab": up to 2 useful words from the characters' replies that a ${c.level} learner may not know. Leave it empty if there are none.

Reply with ONLY this JSON, nothing else:
{"replies":[{"characterId":"id","text":"..."}],"milestonesDone":["m1"],"moods":{"characterId":{"mood":"one word","trust":0}},"guide":"...","vocab":[{"word":"...","partOfSpeech":"noun","meaning":"simple English meaning","example":"short sentence"}]}
"milestonesDone" lists only goals newly reached by the learner's latest message. "trust" is a whole number from 0 (hostile) to 10 (fully trusts the learner).`;
}

export function storyUser(c: StoryContext, userText: string | null): string {
  const open = c.incident.milestones.filter((m) => !c.done.includes(m.id)).map((m) => m.id);
  const moods = Object.entries(c.moods).map(([id, m]) => `${id}: ${m.mood}, trust ${m.trust}/10`).join("; ");
  const lines = [
    c.memory && `EARLIER IN THE STORY: ${c.memory}`,
    moods && `CURRENT MOODS: ${moods}`,
    `GOALS ALREADY REACHED: ${c.done.join(", ") || "none"}. STILL OPEN: ${open.join(", ")}.`,
    c.userMessageCount >= WRAP_UP_AFTER && "The conversation is getting long. Steer toward finishing the open goals, and let the guide say how to finish.",
    c.history.length ? `RECENT MESSAGES:\n${c.history.map((m) => `${m.name}: ${m.text}`).join("\n")}` : "",
    userText === null
      ? `The scene has just started. ${c.openingFrom} speaks first. Return one reply from "${c.openingFrom}" only, with "milestonesDone": [].`
      : `LEARNER'S NEW MESSAGE: ${userText}`,
  ];
  return lines.filter(Boolean).join("\n\n");
}

export function checkSystem(level: string, nativeLanguage: string, topics: { slug: string; title: string }[]): string {
  const native = nativeLanguage && nativeLanguage !== "English" ? `Also give "whyNative": the same reason written in ${nativeLanguage}.` : `Leave "whyNative" out.`;
  return `You are a kind, accurate English teacher. Check ONE chat message written by a ${level} learner.

- Report only real mistakes (grammar, spelling, wrong word, punctuation that changes meaning, wrong tone for the situation). Do not report style preferences, a missing final full stop, or casual chat habits.
- At most 3 mistakes, most important first. Report nothing if the message is fine.
- "wrong" must be copied exactly from the message (the smallest part that is wrong). "right" is the fix for that part.
- "why" is one short sentence in simple English.
- ${native}
- "topicSlugs": 0 to 3 slugs from the list below that this mistake breaks. A mistake can break several rules, so list all that apply. Use only slugs from the list. If none fit, use [] and set "category" to spelling, word_choice, punctuation, register or other. If a slug fits, "category" is "grammar".
- "words": up to 2 words the learner misused or clearly looked for but got wrong. Give the CORRECT word. Leave empty if none.

GRAMMAR TOPICS (slug: title)
${topics.map((t) => `${t.slug}: ${t.title}`).join("\n")}

Reply with ONLY this JSON:
{"mistakes":[{"wrong":"...","right":"...","why":"...","whyNative":"...","topicSlugs":["slug"],"category":"grammar"}],"words":[{"word":"...","partOfSpeech":"noun","meaning":"simple English meaning","example":"short sentence"}]}`;
}

export function guideSystem(c: StoryContext): string {
  const goals = c.incident.milestones.map((m) => `- ${m.id}${c.done.includes(m.id) ? " (done)" : ""}: ${m.goal}`).join("\n");
  return `You are ${c.guideName}, a friendly English coach beside the learner during a role-play: "${c.scenario.title}", scene "${c.incident.title}". The learner is: ${c.incident.userRole}. Learner level: ${c.level}.
Situation: ${c.incident.scenario}
Goals:
${goals}
The learner asked you a question. Answer in 1 to 3 simple sentences at their level. If they ask about a word or phrase, explain it. If they ask what to do, say what to do next and who to talk to, but do not write the whole English sentence for them. Reply with plain text only.`;
}

export function guideUser(c: StoryContext, question: string): string {
  const moods = Object.entries(c.moods).map(([id, m]) => `${id}: ${m.mood}`).join("; ");
  return `${moods ? `Moods: ${moods}\n` : ""}Recent messages:\n${c.history.map((m) => `${m.name}: ${m.text}`).join("\n")}\n\nLearner's question: ${question}`;
}

export type FeedbackInput = {
  scenarioTitle: string;
  incidentTitle: string;
  level: string;
  nativeLanguage: string;
  messages: number;
  mistakes: number;
  goals: { goal: string; done: boolean }[];
  topics: { title: string; count: number }[];
  examples: { wrong: string; right: string }[];
};

export function feedbackSystem(): string {
  return `You are a warm English teacher writing end-of-scene feedback for a learner. Be specific, kind and honest. Use simple English.
Reply with ONLY this JSON:
{"summary":"2 to 3 sentences about how the scene went","wins":["2 specific things done well"],"focus":["2 specific things to practise next, linked to the repeated mistakes"],"memory":"one sentence recap of what happened in the story, for the next scene"}`;
}

export function feedbackUser(f: FeedbackInput): string {
  return `Scene: ${f.scenarioTitle} / ${f.incidentTitle}. Level ${f.level}.
Messages sent: ${f.messages}. Mistakes found: ${f.mistakes}.
Goals: ${f.goals.map((g) => `${g.done ? "done" : "NOT done"} - ${g.goal}`).join("; ")}
Most repeated grammar topics: ${f.topics.map((t) => `${t.title} (${t.count})`).join(", ") || "none"}
Example corrections: ${f.examples.map((e) => `"${e.wrong}" -> "${e.right}"`).join("; ") || "none"}`;
}

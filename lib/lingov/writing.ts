// Writing session checker, ported 1:1 from the prototype (`WRULES`, `evalSent`, `wsVals`).
// Rule-based dummy marking: see REPLACE.md to use app/actions/writing.ts (AI) instead.
// No imports so `node lib/lingov/writing.check.ts` can run it directly.

export const WS0 = "I think four-day work week is a good idea for most people. Workers has more time for family and hobbies. For my opinion, people works better when they are not tired. In my last compnay we worked long hours and everyone were stressed. some days I could not focus at all. A shorter week can make people happy and it can make them healthy and it can also make them more productive at work because they rest more. However it does not work for every job, for example hospitals need staff every day. Companies should try it slowly and check the results. So I beleive the four-day week is the future of work.";

export type Cat = "Grammar" | "Spelling" | "Punct." | "Clarity" | "Structure";
export const WCAT: Record<Cat | "Correct", string> = { Grammar: "#EDBF73", Spelling: "#EDBF73", "Punct.": "#52C79A", Clarity: "#52C79A", Structure: "#52C79A", Correct: "#52C79A" };
export const SP: Record<string, string> = { compnay: "company", beleive: "believe", becuase: "because", recieve: "receive", alot: "a lot", freind: "friend", wich: "which", untill: "until", tommorow: "tomorrow", definately: "definitely", opinon: "opinion", realy: "really", productivety: "productivity", enviroment: "environment", goverment: "government", mutaul: "mutual" };

type Rule = { type: Cat; sub: string; re: RegExp; fix: (m: RegExpMatchArray) => string; why: (m: RegExpMatchArray) => string };
const WRULES: Rule[] = [
  { type: "Grammar", sub: "subject-verb agreement", re: /\b(workers|people|they|we|companies|students|employees|managers) (has|is|was|works|makes|gives|wants|needs|feels)\b/i, fix: (m) => m[1] + " " + ({ has: "have", is: "are", was: "were", works: "work", makes: "make", gives: "give", wants: "want", needs: "need", feels: "feel" } as Record<string, string>)[m[2].toLowerCase()], why: () => "Plural subjects take a plural verb." },
  { type: "Grammar", sub: "subject-verb agreement", re: /\b(everyone|everybody|he|she|it|my company|the company) (were|are|have|work|make|feel)\b/i, fix: (m) => m[1] + " " + ({ were: "was", are: "is", have: "has", work: "works", make: "makes", feel: "feels" } as Record<string, string>)[m[2].toLowerCase()], why: (m) => '"' + m[1] + '" is singular, so it takes a singular verb.' },
  { type: "Grammar", sub: "prepositions", re: /\bfor my opinion\b/i, fix: (m) => (m[0][0] === "F" ? "I" : "i") + "n my opinion", why: () => 'We say "in my opinion", not "for my opinion".' },
  { type: "Grammar", sub: "articles", re: /\b(think|is|was|try) (four-day work week|shorter week)\b/i, fix: (m) => m[1] + " a " + m[2], why: () => '"Work week" is countable, so it needs "a" before it.' },
  { type: "Spelling", sub: "spelling", re: new RegExp("\\b(" + Object.keys(SP).join("|") + ")\\b", "i"), fix: (m) => SP[m[1].toLowerCase()], why: (m) => '"' + m[1] + '" is spelled "' + SP[m[1].toLowerCase()] + '".' },
  { type: "Punct.", sub: "capital letters", re: /^[a-z]/, fix: (m) => m[0].toUpperCase(), why: () => "Every sentence starts with a capital letter." },
  { type: "Punct.", sub: "commas", re: /^(However|Also|Finally|In addition|Firstly|Secondly|In conclusion)(?=\s)/, fix: (m) => m[1] + ",", why: () => "Put a comma after a linking word at the start of a sentence." },
  { type: "Structure", sub: "linking words", re: /^(So|And|But) /, fix: (m) => ({ So: "Therefore, ", And: "Also, ", But: "However, " } as Record<string, string>)[m[1]], why: (m) => 'In an essay, use a formal linking word instead of starting with "' + m[1] + '".' },
];

export type Issue = { type: Cat; sub: string; find: string; repl: string; why: string };

export function evalSent(s: string): { issues: Issue[]; fixed: string } {
  const issues: Issue[] = [];
  let fx = s;
  WRULES.forEach((r) => {
    for (let k = 0; k < 3; k++) {
      const m = fx.match(r.re);
      if (!m) break;
      if (r.sub === "commas" && fx[m[0].length] === ",") break;
      const rep = r.fix(m);
      issues.push({ type: r.type, sub: r.sub, find: m[0].trim(), repl: rep.trim(), why: r.why(m) });
      fx = fx.slice(0, m.index) + rep + fx.slice(m.index! + m[0].length);
    }
  });
  if ((s.match(/\band\b/gi) || []).length >= 2 && s.split(/\s+/).length >= 18) {
    const better = /make people happy and it can make them healthy/i.test(s) ? "A shorter week can make people happier, healthier and more productive at work, because they rest more." : null;
    issues.push({ type: "Clarity", sub: "long sentences", find: "and … and …", repl: better ? "a list with commas" : "two shorter sentences", why: 'This sentence repeats "and" several times. Join the ideas in a list or split it in two.' });
    if (better) fx = better;
  }
  return { issues, fixed: fx };
}

export type Sent = { text: string; start: number; lead: string; trail: string; idx: number };
export type Found = Issue & { id: string; si: number; loc: number };

// Words, sentences and paragraphs with their positions in the text (prototype split).
export function splitText(wt: string) {
  const words = (wt.trim().match(/\S+/g) || []).length;
  const sents: Sent[] = [], paras: Sent[][] = [];
  let cur = 0;
  wt.split(/\n\s*\n/).forEach((p) => {
    if (!p.trim()) return;
    const st = wt.indexOf(p, cur);
    cur = st + p.length;
    let c2 = st;
    const list: Sent[] = [];
    (p.match(/[^.!?]+[.!?]*\s*/g) || []).forEach((part) => {
      const s0 = wt.indexOf(part, c2);
      c2 = s0 + part.length;
      const lead = part.match(/^\s*/)![0], tr = part.trim();
      if (!tr) return;
      const o = { text: tr, start: s0 + lead.length, lead, trail: part.slice(lead.length + tr.length), idx: sents.length };
      sents.push(o);
      list.push(o);
    });
    paras.push(list);
  });
  return { words, sents, paras };
}

const planOf = (wt: string, sents: Sent[]) => {
  const lastS = sents.length ? sents[sents.length - 1].text : "";
  const plan: [string, boolean, string][] = [
    ["State your main idea", /\b(i think|in my opinion|i believe|i feel)\b/i.test(wt), 'Use "I think…" or "In my opinion…"'],
    ["Give reasons with an example", /\b(because|for example|for instance|the reason)\b/i.test(wt), 'Use "because…" or "For example…"'],
    ["Finish with a summary", sents.length > 2 && /\b(in conclusion|to sum up|overall|therefore|so i believe|in short)\b/i.test(lastS), 'End with "In conclusion…" or "Overall…"'],
  ];
  return { plan, pn: plan.filter((p) => p[1]).length };
};

const critOf = (words: number, minWords: number, pn: number, cats: Partial<Record<Cat, number>>, nParas: number): [string, number, string][] => {
  const t = Math.min(10, (words >= minWords ? 6 : (words / minWords) * 6) + (pn * 4) / 3), g = Math.max(1, 10 - (cats.Grammar || 0) * 1.2), v = Math.max(1, 10 - (cats.Spelling || 0) * 1.5), o = Math.max(1, 10 - ((cats["Punct."] || 0) + (cats.Clarity || 0) + (cats.Structure || 0)) * 1.2 - (nParas < 2 ? 1.5 : 0));
  return [["Task response", t, pn + " of 3 plan points covered"], ["Grammar", g, (cats.Grammar || 0) + " grammar errors"], ["Vocabulary & spelling", v, (cats.Spelling || 0) + " spelling errors"], ["Organisation", o, nParas < 2 ? "Use paragraphs to split your ideas" : "Good use of paragraphs"]];
};

const tally = (all: Found[]) => {
  const subs: Record<string, number> = {}, cats: Partial<Record<Cat, number>> = {};
  all.forEach((i) => { subs[i.sub] = (subs[i.sub] || 0) + 1; cats[i.type] = (cats[i.type] || 0) + 1; });
  return { subs, cats, top: Object.entries(subs).sort((a, b) => b[1] - a[1])[0] as [string, number] | undefined };
};

// Everything `wsVals` derives from the essay text, using the prototype's rule checker (demo links).
export function analyse(wt: string) {
  const { words, sents, paras } = splitText(wt);
  const ev = sents.map((x) => evalSent(x.text));
  const all: Found[] = [];
  ev.forEach((e, i) => e.issues.forEach((x, k) => all.push({ ...x, id: i + "-" + k, si: i, loc: x.type === "Clarity" ? -1 : sents[i].text.indexOf(x.find) })));
  const errs = all.length, okN = ev.filter((e) => !e.issues.length).length, tot = sents.length || 1;
  const { subs, cats, top } = tally(all);
  const score = Math.max(1, Math.min(10, 10 - errs * 0.6 - (words < 100 ? (100 - words) / 20 : 0)));

  let fb: string;
  if (!errs) fb = "Excellent work. Every sentence is correct and your ideas are easy to follow.";
  else {
    fb = score >= 8 ? "Your essay is clear and well organised, with only a few small mistakes." : score >= 5 ? "Your essay answers the question and your ideas are easy to follow, but several mistakes make it harder to read." : "Your essay answers the question, but many grammar and spelling mistakes make it hard to follow.";
    if (top) fb += " Focus on " + top[0] + " first: it caused " + top[1] + " of your " + errs + " errors.";
    if (subs["long sentences"]) fb += " Some sentences are too long; split them or use a list.";
  }
  if (words < 100) fb += " Your answer is under 100 words, which lowers the score.";

  const { plan, pn } = planOf(wt, sents);
  const crit = critOf(words, 100, pn, cats, paras.length);
  return { words, sents, paras, ev, all, errs, okN, tot, cats, top, score, fb, plan, pn, crit };
}
export type Analysis = ReturnType<typeof analyse>;

// AI result (app/actions/writing.ts WritingView, structurally) mapped onto the same shape.
export type AICorrection = { sentence: number; type: string; rule: string; find: string; replace: string; why: string };
const AI_CAT: Record<string, Cat> = { grammar: "Grammar", spelling: "Spelling", punctuation: "Punct.", clarity: "Clarity", structure: "Structure" };

export function analyseAI(wt: string, ai: { corrections: AICorrection[]; generalFeedback: string | null }, minWords: number): Analysis {
  const { words, sents, paras } = splitText(wt);
  const taken: [number, number][] = [];
  const all: Found[] = [];
  ai.corrections.forEach((c, k) => {
    if (!c.find) return;
    // Nearest free occurrence to the sentence the AI pointed at; a fix that was applied no longer matches.
    const hint = sents[Math.min(c.sentence ?? 0, sents.length - 1)]?.start ?? 0;
    let best = -1;
    for (let i = wt.indexOf(c.find); i >= 0; i = wt.indexOf(c.find, i + 1)) {
      if (taken.some(([a, b]) => i < b && i + c.find.length > a)) continue;
      if (best < 0 || Math.abs(i - hint) < Math.abs(best - hint)) best = i;
    }
    if (best < 0) return;
    const si = sents.findIndex((s) => best >= s.start && best + c.find.length <= s.start + s.text.length);
    if (si < 0) return;
    taken.push([best, best + c.find.length]);
    all.push({ type: AI_CAT[c.type?.toLowerCase()] ?? "Grammar", sub: c.rule || c.type || "grammar", find: c.find, repl: c.replace, why: c.why, id: "ai-" + k, si, loc: best - sents[si].start });
  });
  const ev = sents.map((s) => {
    const issues = all.filter((x) => x.si === s.idx).sort((a, b) => b.loc - a.loc);
    let fixed = s.text;
    issues.forEach((x) => { fixed = fixed.slice(0, x.loc) + x.repl + fixed.slice(x.loc + x.find.length); });
    return { issues, fixed };
  });
  const errs = all.length, okN = ev.filter((e) => !e.issues.length).length, tot = sents.length || 1;
  const { cats, top } = tally(all);
  // Backend formula (share of sentences with an error), recomputed as fixes are applied.
  const score = Math.max(1, Math.min(10, 10 * (1 - (sents.length - okN) / tot)));
  const fb = ai.generalFeedback || (errs ? "Review the corrections below." : "Excellent work. Every sentence is correct and your ideas are easy to follow.");
  const { plan, pn } = planOf(wt, sents);
  const crit = critOf(words, minWords, pn, cats, paras.length);
  return { words, sents, paras, ev, all, errs, okN, tot, cats, top, score, fb, plan, pn, crit };
}

export const scoreCol = (s: number) => (s >= 8 ? "#9ADBBE" : s >= 5 ? "#52C79A" : "#EDBF73");
export const levelOf = (s: number) => (s >= 7 ? "B2" : s >= 4.5 ? "B1" : s >= 2.5 ? "A2" : "A1");
export const verdictOf = (s: number) => (s >= 9 ? "Excellent" : s >= 7 ? "Good" : s >= 5 ? "Fair" : "Needs work");

export function applyOne(text: string, a: Analysis, x: Found): string | null {
  if (x.type === "Clarity") {
    const s = a.sents[x.si];
    return text.slice(0, s.start) + a.ev[x.si].fixed + text.slice(s.start + s.text.length);
  }
  if (x.loc < 0) return null;
  const p = a.sents[x.si].start + x.loc;
  return text.slice(0, p) + x.repl + text.slice(p + x.find.length);
}

export function applyAll(text: string, a: Analysis): string {
  let t = text;
  for (let i = a.sents.length - 1; i >= 0; i--) {
    if (!a.ev[i].issues.length) continue;
    const s = a.sents[i];
    t = t.slice(0, s.start) + a.ev[i].fixed + t.slice(s.start + s.text.length);
  }
  return t;
}

// Prototype `?demo=write-draft` / `write-fixed` texts.
export const WS_DRAFT = WS0.split(". ").slice(0, 4).join(". ") + ".";
export const WS_FIXED = (WS0.match(/[^.!?]+[.!?]*\s*/g) || []).map((p) => { const t = p.trim(); return p.replace(t, evalSent(t).fixed); }).join("");

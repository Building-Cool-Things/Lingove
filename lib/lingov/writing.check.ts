// Run: node lib/lingov/writing.check.ts
import assert from "node:assert";
import { WS0, WS_FIXED, analyse, analyseAI, applyAll, applyOne } from "./writing.ts";

const a = analyse(WS0);
assert.equal(a.words, 113);
assert.equal(a.sents.length, 9);
assert.equal(a.errs, 11);
assert.equal(a.cats.Grammar, 5);
assert.equal(a.cats.Spelling, 2);
assert.equal(a.top?.[0], "subject-verb agreement");
assert.equal(a.score.toFixed(1), "3.4"); // prototype demo `write-fixed` uses wsStart 3.4

const fixed = analyse(applyAll(WS0, a));
assert.equal(fixed.errs, 0);
assert.equal(analyse(WS_FIXED).errs, 0);
assert.equal(analyse("").words, 0);
console.log("writing ok");

// AI corrections map onto the same shape and disappear once applied.
const ai = { generalFeedback: "ok", corrections: [{ sentence: 1, type: "grammar", rule: "subject-verb agreement", find: "Workers has", replace: "Workers have", why: "Plural." }, { sentence: 0, type: "spelling", rule: "spelling", find: "nope-not-there", replace: "x", why: "" }] };
const b = analyseAI(WS0, ai, 100);
assert.equal(b.errs, 1);
assert.equal(b.all[0].si, 1);
const fixedAI = applyOne(WS0, b, b.all[0]);
assert.ok(fixedAI && fixedAI.includes("Workers have"));
assert.equal(analyseAI(fixedAI!, ai, 100).errs, 0);
console.log("writing ai ok");

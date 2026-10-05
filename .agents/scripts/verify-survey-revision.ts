import assert from "node:assert/strict";
import { Q, TRACKS, LEGACY_TRACKS, REPORT_TRACKS, SKILLS, COURSE_GROUPS, type Answers } from "../../artifacts/survey/src/lib/survey-definition";
import { defaultTrackOrder, normalizeDraft, ownerAllowed, jobLevelRequired, b2bAllowed, questionNumbers, validateStep, validTrackOrder } from "../../artifacts/survey/src/lib/survey-logic";
import { preferences, trackRanks, matching } from "../../artifacts/api-server/src/lib/analytics";
import { catalogue } from "../../artifacts/api-server/src/data/catalogue";
import { ITEM_WORKSHOPS, TRACKS as SERVER_TRACKS } from "../../artifacts/api-server/src/data/survey-items";
import type { ResponseRow } from "@workspace/db";

const base: Answers = {
  Q1: "kuwaiti", Q2: "male", Q3: "30_39", Q4: "bachelor",
  Q5: { sector: "private", sub: "technology" }, Q6: "senior", Q7: "B2B",
  Q8: "small", Q9: "ready", Q10: ["tailored"],
  Q14: Object.fromEntries(SKILLS.map((s) => [s.id, { importance: 4, performance: 3 }])),
  Q19: ["center", "live_online"], Q20: ["short", "1_2_days"], Q21: ["morning", "evening"], Q22: "arabic",
  Q24: defaultTrackOrder(), Q25G: ["G5"],
  Q25: Object.fromEntries(COURSE_GROUPS.find((g) => g.id === "G5")!.courses.map((c) => [c.id, 1])) as Answers["Q25"],
  Q26: ["real_certs", "practitioners", "simulation"],
};
for (const step of [1, 2, 3]) assert.deepEqual(validateStep(step, base), {});
const notWorking = { ...base, Q5: { sector: "not_working" }, Q6: undefined, Q7: "B2C" } satisfies Answers;
assert.equal(jobLevelRequired(notWorking), false);
assert.deepEqual(validateStep(1, notWorking), {});
assert.equal(b2bAllowed(notWorking), false);
assert.equal(b2bAllowed(base), true);
assert.ok(validateStep(1, { ...notWorking, Q7: "B2B" }).Q7);
assert.equal(normalizeDraft({ ...notWorking, Q7: "B2B" }).Q7, undefined);
assert.equal(normalizeDraft(notWorking).Q7, "B2C");
assert.equal(questionNumbers("B2C", "not_working").Q6, undefined);
assert.equal(questionNumbers("B2C", "not_working").Q7, 6);
assert.equal(normalizeDraft({ ...notWorking, Q6: "senior" }).Q6, undefined);
assert.ok(validateStep(1, { ...notWorking, Q5: { sector: "nonprofit" } }).Q6);
for (const path of ["B2B", "B2C"] as const) {
  assert.equal(questionNumbers(path).Q11, undefined);
  assert.equal(questionNumbers(path).Q23, undefined);
}
assert.equal(ownerAllowed(base), false);
assert.ok(validateStep(1, { ...base, Q6: "owner" }).Q6);
assert.equal(ownerAllowed({ Q5: { sector: "government" } }), false);
assert.equal(ownerAllowed({ Q5: { sector: "entrepreneur" } }), true);
for (const k of ["Q19", "Q20", "Q21"] as const) assert.ok(validateStep(3, { ...base, [k]: [] })[k]);
assert.ok(validateStep(3, { ...base, Q26: [...base.Q26!, "packages"] }).Q26);
assert.equal(TRACKS.length, 6);
assert.deepEqual(TRACKS, Q.Q25G.options);
assert.deepEqual(Object.keys(SERVER_TRACKS), defaultTrackOrder());
assert.equal(validTrackOrder([...defaultTrackOrder().slice(1), "R2"]), false);
const old = { ...base, Q6: "owner", Q19: "center", Q20: "short", Q21: "morning", Q24: LEGACY_TRACKS.map((t) => t.id), Q11: ["kpis"], Q23: "attendance" };
const resumed = normalizeDraft(old);
assert.deepEqual(resumed.Q19, ["center"]);
assert.deepEqual(resumed.Q20, ["short"]);
assert.deepEqual(resumed.Q21, ["morning"]);
for (const k of ["Q6", "Q24", "Q11", "Q23"] as const) assert.equal(resumed[k], undefined);
assert.equal(old.Q6, "owner"); // no mutation of historical input

const row = (answers: unknown) => ({ answers, path: "B2B", status: "complete" }) as ResponseRow;
const rows = [row(base), row(old)];
for (const k of ["Q19", "Q20", "Q21"]) {
  const p = preferences(rows).questions.find((q) => q.questionId === k)!;
  assert.equal(p.respondents, 2);
  assert.equal(p.options[0].count, 2);
  assert.equal(p.options[1].count, 1);
}
const ranks = trackRanks(rows).items;
assert.equal(ranks.find((t) => t.trackId === "G1")!.score, 100);
assert.equal(ranks.find((t) => t.trackId === "G6")!.score, 0);
assert.equal(ranks.find((t) => t.trackId === "T1")!.n, 1);
assert.match(ranks.find((t) => t.trackId === "T1")!.label, /مسار سابق/);
const reportOrder = REPORT_TRACKS.map((t) => t.id);
assert.equal(normalizeDraft({ ...base, Q24: reportOrder }).Q24, undefined);
const allRanks = trackRanks([...rows, row({ Q24: reportOrder })]).items;
assert.equal(allRanks.find((t) => t.trackId === "R1")!.score, 100);
assert.equal(allRanks.find((t) => t.trackId === "R7")!.score, 0);
assert.equal(allRanks.find((t) => t.trackId === "R1")!.n, 1);
assert.equal(allRanks.find((t) => t.trackId === "G1")!.n, 1);
for (const t of TRACKS) for (const title of ITEM_WORKSHOPS[t.id]) assert.ok(catalogue.some((w) => w.titleEn === title), title);
assert.ok(matching(rows, 40));
assert.equal(Q.Q26.max, 3);
console.log("PASS: removed questions, profile rules, multi-select validation, draft normalization, consistent training-track ranking, historical reporting and matching.");

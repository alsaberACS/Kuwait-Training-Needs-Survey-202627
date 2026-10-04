import assert from "node:assert/strict";
import { ALL_COURSES, COURSE_GROUPS, type Answers } from "../../artifacts/survey/src/lib/survey-definition";
import { validateStep, bookedCourses, STEP_S4 } from "../../artifacts/survey/src/lib/survey-logic";
import { TRAINING_TOPICS, TRAINING_MODE, normalizeShortTraining, recommendedCourseIds, topicOptions, shortTrainingErrors } from "../../lib/api-zod/src/training";
import { COURSES, ITEM_WORKSHOPS } from "../../artifacts/api-server/src/data/survey-items";
import { catalogue } from "../../artifacts/api-server/src/data/catalogue";
import { courseDemand, matching, toCsv } from "../../artifacts/api-server/src/lib/analytics";
import { trainingValidationError } from "../../artifacts/api-server/src/lib/training-validation";

assert.equal(ALL_COURSES.length, 70);
assert.equal(new Set(ALL_COURSES.map((c) => c.id)).size, 70);
const primary = ALL_COURSES.map((c) => ITEM_WORKSHOPS[c.id][0]);
assert.equal(new Set(primary).size, 70);
for (const w of catalogue) assert.ok(primary.includes(w.titleEn), w.titleEn);
for (const g of COURSE_GROUPS) {
  for (const c of g.courses) assert.deepEqual(COURSES[c.id], { label: c.label, group: g.id });
  assert.ok(topicOptions([g.id]).length <= 6);
}
const mapped = TRAINING_TOPICS.flatMap((t) => t.courses);
assert.equal(new Set(mapped).size, 70);
assert.equal(mapped.length, 70);
for (const t of TRAINING_TOPICS) for (const c of t.courses) assert.equal(COURSES[c].group, t.group);
const choices: Answers = normalizeShortTraining({ Q25G: ["G1", "G3"], Q25T: ["TP01", "TP02", "TP12"] });
assert.equal(choices.Q25Mode, TRAINING_MODE);
assert.equal(choices.Q25Shown?.length, 5);
assert.deepEqual(choices.Q25Shown?.slice(0, 3), ["C1", "C2", "C10"]);
const selected = normalizeShortTraining({ ...choices, Q25I: ["C10", "C1"] });
const pruned = normalizeShortTraining({ ...selected, Q25G: ["G1"] });
assert.deepEqual(pruned.Q25T, ["TP01", "TP02"]);
assert.deepEqual(pruned.Q25I, ["C1"]);
assert.ok(!pruned.Q25Shown?.includes("C10"));
assert.equal(bookedCourses(selected).length, 2);
assert.equal(bookedCourses({ Q25: { C1: 2 } }).length, 1);
assert.ok(shortTrainingErrors({ Q25G: ["G1", "G2", "G3"] }).Q25G);
assert.ok(shortTrainingErrors({ Q25G: ["G1"], Q25T: ["TP01", "TP02", "TP03", "TP04"] }).Q25T);
assert.ok(shortTrainingErrors({ Q25G: ["G1"], Q25T: ["TP12"] }).Q25T);
assert.ok(shortTrainingErrors({ Q25G: ["G1"], Q25T: ["TP01"], Q25I: ["C70"] }).Q25I);
assert.equal(validateStep(STEP_S4, { ...choices, Q25I: [] }).Q25I, undefined);
assert.equal(validateStep(STEP_S4, choices).Q25T, undefined);
assert.equal(trainingValidationError(choices as Record<string, unknown>, true), undefined);
assert.equal(trainingValidationError({ ...choices, Q25I: [] }, true), undefined);
assert.ok(trainingValidationError({ ...choices, Q25: { C1: 2 } }, true));
assert.ok(trainingValidationError({ ...choices, Q25T: "TP01" }, true));
assert.ok(trainingValidationError({ ...choices, Q25Shown: ["C70"] }, true));
assert.equal(trainingValidationError({ Q25: { C1: 2 } }, true), undefined);
for (const t of TRAINING_TOPICS) {
  const candidates = recommendedCourseIds([t.id]);
  assert.ok(candidates.length >= 1 && candidates.length <= 5);
  assert.ok(candidates.every((id) => t.courses.includes(id)));
}
const row = (answers: Record<string, unknown>) => ({
  id: "verification-only", status: "complete", path: "B2C", consent: true, currentStep: 5,
  answers, createdAt: new Date(), updatedAt: new Date(), completedAt: new Date(),
  durationSec: 120, device: "desktop", sourceTag: null, contact: null,
});
const rows = [row(selected as Record<string, unknown>)];
const demand = courseDemand(rows as never);
assert.equal(demand.items.every((i) => i.shown === 0), true);
assert.equal(demand.topics.find((t) => t.topicId === "TP01")?.selected, 1);
assert.equal(demand.topics.find((t) => t.topicId === "TP06")?.respondents, 0);
assert.equal(demand.enquiries.find((c) => c.courseId === "C10")?.enquiries, 1);
assert.equal(demand.enquiries.find((c) => c.courseId === "C70")?.recommended, 0);
assert.equal(demand.enquiries.find((c) => c.courseId === "C33")?.enquiries, 0);
const matches = matching(rows as never, 40).items;
const match = matches.find((i) => i.workshop.titleEn === ITEM_WORKSHOPS.C1[0]);
assert.equal(match?.fieldN, 0);
assert.equal(match?.topicPriorityShare, 100);
assert.equal(match?.enquiryCount, 1);
assert.notEqual(match?.gridCell, "confirmed_priority");
const mixed = courseDemand([...rows, row({ Q25: { C1: 2 } })] as never);
assert.equal(mixed.items.find((i) => i.courseId === "C1")?.shown, 1);
assert.equal(mixed.items.find((i) => i.courseId === "C1")?.bookNow, 1);
assert.equal(mixed.enquiries.find((i) => i.courseId === "C1")?.enquiries, 1);
assert.ok(toCsv(rows as never).includes("Q25Shown"));
assert.ok(toCsv(rows as never).includes("TP01"));
console.log("PASS: 70 workshops covered once by topics; <=6 topics per track.");
console.log("PASS: limits, recommendations, pruning, optional enquiries, server validation.");
console.log("PASS: topic denominators, enquiry exposure, separate legacy ratings, matching and CSV.");
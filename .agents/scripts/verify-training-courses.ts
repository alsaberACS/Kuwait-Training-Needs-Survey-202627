import assert from "node:assert/strict";
import { ALL_COURSES, COURSE_GROUPS, type Answers } from "../../artifacts/survey/src/lib/survey-definition";
import { selectedCourses, pruneCourseAnswers, validateStep, bookedCourses, STEP_S4 } from "../../artifacts/survey/src/lib/survey-logic";
import { COURSES, ITEM_WORKSHOPS } from "../../artifacts/api-server/src/data/survey-items";
import { catalogue } from "../../artifacts/api-server/src/data/catalogue";
import { courseDemand, matching, toCsv } from "../../artifacts/api-server/src/lib/analytics";
import type { ResponseRow } from "@workspace/db";

assert.equal(ALL_COURSES.length, 70);
assert.equal(new Set(ALL_COURSES.map((c) => c.id)).size, 70);
assert.equal(Object.keys(COURSES).length, 70);
const primary = ALL_COURSES.map((c) => ITEM_WORKSHOPS[c.id][0]);
assert.equal(new Set(primary).size, 70);
for (const w of catalogue) assert.ok(primary.includes(w.titleEn), w.titleEn);
for (const g of COURSE_GROUPS) {
  for (const c of g.courses) assert.deepEqual(COURSES[c.id], { label: c.label, group: g.id });
  const answers: Answers = { Q25G: [g.id] };
  assert.deepEqual(selectedCourses(answers), g.courses);
  assert.equal(validateStep(STEP_S4, answers).Q25, `بقي ${g.courses.length} من الدورات دون اختيار`);
  const ratings = Object.fromEntries(g.courses.map((c) => [c.id, 2])) as Answers["Q25"];
  answers.Q25 = ratings;
  assert.equal(validateStep(STEP_S4, answers).Q25, undefined);
  assert.equal(bookedCourses(answers).length, g.courses.length);
  assert.deepEqual(pruneCourseAnswers(ratings, []), {});
}
const pruned = pruneCourseAnswers({ C1: 1, C32: 2, C70: 2 }, ["G1"]);
assert.deepEqual(pruned, { C1: 1, C32: 2 });
const row = {
  id: "verification-only", status: "complete", path: "B2C", consent: true,
  currentStep: 5, answers: { Q25G: ["G6"], Q25: { C70: 2 } },
  createdAt: new Date(), updatedAt: new Date(), completedAt: new Date(),
  durationSec: 120, device: "desktop", sourceTag: null, contact: null,
} as ResponseRow;
const demand = courseDemand([row]);
assert.equal(demand.items.length, 70);
assert.equal(demand.items.find((i) => i.courseId === "C70")?.bookNow, 1);
assert.equal(demand.items.find((i) => i.courseId === "C32")?.shown, 0);
const match = matching([row], 40).items.find((i) => i.workshop.titleEn === ITEM_WORKSHOPS.C70[0]);
assert.equal(match?.fieldN, 1);
assert.equal(match?.fieldNeed, 100);
assert.ok(toCsv([row]).includes("C70"));
console.log("PASS: 70 workshops covered; frontend/server labels and tracks agree.");
console.log("PASS: selected-track validation, pruning, booking, demand, matching and CSV.");
console.log(COURSE_GROUPS.map((g) => `${g.id}: ${g.courses.length}`).join(", "));
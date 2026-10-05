import assert from "node:assert/strict";
import { ALL_COURSES, COURSE_GROUPS, SKILLS, TRACKS, TRACK_LABELS, type Answers } from "../../artifacts/survey/src/lib/survey-definition";
import { orderedCourseGroups, suggestedGroups } from "../../artifacts/survey/src/lib/survey-logic";
import { surveyProgress } from "../../artifacts/survey/src/lib/survey-progress";
import { personalizedSummary } from "../../artifacts/survey/src/lib/personalized-results";
import { COURSE_DESCRIPTIONS, SKILL_EXPLANATIONS } from "../../artifacts/survey/src/lib/survey-content";

const matrix = Object.fromEntries(SKILLS.map((s) => [s.id, { importance: 4, performance: 3 }]));
const full: Answers = {
  Q1: "kuwaiti", Q2: "male", Q3: "30_39", Q4: "bachelor",
  Q5: { sector: "private", sub: "technology" }, Q6: "senior", Q7: "B2B",
  Q8: "small", Q9: "ready", Q10: ["tailored"], Q14: matrix,
  Q19: ["center", "live_online"], Q20: ["short"], Q21: ["morning"], Q22: "arabic",
  Q24: TRACKS.map((t) => t.id), Q25G: ["G5"], Q25: { C18: 0, C19: 1, C20: 2 }, Q26: ["real_certs"],
};
assert.deepEqual(surveyProgress({}), { completed: 0, total: 19, percent: 0 });
assert.deepEqual(surveyProgress(full), { completed: 19, total: 19, percent: 100 });
const individual: Answers = { ...full, Q5: { sector: "not_working" }, Q6: undefined, Q7: "B2C", Q15: ["y2b"], Q18: matrix };
assert.deepEqual(surveyProgress(individual), { completed: 16, total: 16, percent: 100 });
assert.equal(surveyProgress({ ...full, Q14: { ...matrix, S10: { importance: 4 } } }).completed, 18);
assert.equal(surveyProgress({ ...full, Q25: { C18: 0, C19: 1 } }).completed, 18);
assert.equal(surveyProgress({ ...full, Q25: { C18: 3 as 0, C19: 1, C20: 2 } }).completed, 18);
assert.equal(surveyProgress({ ...full, Q25G: [], Q25: {} }).completed, 17);
assert.equal(surveyProgress({ Q24: ["T1", "T2", "T3"] }, true).percent, 100);

for (const s of SKILLS) assert.ok(SKILL_EXPLANATIONS[s.id]?.trim(), `Explanation missing for ${s.id}`);
for (const c of ALL_COURSES) assert.ok(COURSE_DESCRIPTIONS[c.id]?.trim(), `Description missing for ${c.id}`);
assert.equal(Object.keys(COURSE_DESCRIPTIONS).length, ALL_COURSES.length);
assert.equal(new Set(Object.values(COURSE_DESCRIPTIONS)).size, ALL_COURSES.length);
assert.deepEqual(orderedCourseGroups(full).map((g) => g.id), COURSE_GROUPS.map((g) => g.id));
assert.deepEqual(orderedCourseGroups(individual).map((g) => g.id), COURSE_GROUPS.map((g) => g.id));
assert.deepEqual(suggestedGroups(full), []);
assert.deepEqual(suggestedGroups(individual), []);

const ranked: Answers = {
  ...full, Q24: ["G5", "G1", "G2", "G3", "G4", "G6"], Q25G: ["G5", "G1"],
  Q14: { S1: { importance: 5, performance: 2 }, S2: { importance: 4, performance: 1 },
    S3: { importance: 4, performance: 3 }, S4: { importance: 3, performance: 1 },
    S5: { importance: 6, performance: 1 }, S6: { importance: 5, performance: 5 } },
  Q25: { C18: 2, C19: 1, C20: 0, C1: 1, C2: 0, C6: 2 },
};
const before = JSON.stringify(ranked);
const result = personalizedSummary(ranked);
assert.equal(result.isInstitution, true);
assert.deepEqual(result.priorities.map((p) => p.id), ["G5", "G1", "G2"]);
assert.deepEqual(result.skills.map((s) => s.id), ["S1", "S2", "S3"]);
assert.deepEqual(result.courses.map((c) => c.id), ["C18", "C19", "C1"]);
assert.ok(result.courses[0].reason.includes("الحجز"));
assert.equal(result.preferences.length, 4);
assert.equal(JSON.stringify(ranked), before, "Generating a result must not modify stored answers");
assert.deepEqual(personalizedSummary({ ...ranked, Q7: "B2C", Q18: { S8: { importance: 5, performance: 1 } } }).skills.map((s) => s.id), ["S8"]);
assert.equal(personalizedSummary({ ...ranked, Q25: { C18: 0 } }).courses.length, 0);
assert.equal(personalizedSummary({ ...ranked, Q14: matrix, Q18: {} }).skills.length, 3);
assert.equal(personalizedSummary({ Q7: "B2C", Q18: { S1: { importance: 2, performance: 2 } } }).skills.length, 0);
const historical = personalizedSummary({ Q24: ["T1", "T2", "T3"], Q19: "center" } as unknown as Answers);
assert.deepEqual(historical.priorities.map((p) => p.label), ["T1", "T2", "T3"].map((id) => TRACK_LABELS[id]));
assert.equal(historical.preferences[0].values.length, 1);
assert.equal(personalizedSummary({}).priorities.length, 0);
console.log("PASS: branch-aware progress, zero-valued course answers, neutral course ordering, all course/skill explanations, personalized summaries, empty states and historical labels.");

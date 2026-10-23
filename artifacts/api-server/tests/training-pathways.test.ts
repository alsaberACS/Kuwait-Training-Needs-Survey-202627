import { test } from "node:test";
import assert from "node:assert/strict";
import type { ResponseRow } from "@workspace/db";
import { GetTrainingPathwaysResponse, GetTrainingPathwaysQueryParams } from "@workspace/api-zod";
import { trainingPathways } from "../src/lib/training-pathways";
import { COURSE_GROUPS } from "../src/data/survey-items";

// In-memory fixtures only: these tests never connect to or modify the database.
function row(answers: Record<string, unknown>, overrides: Partial<ResponseRow> = {}): ResponseRow {
  return {
    id: "fixture", status: "complete", path: "B2B", consent: true,
    currentStep: 5, answers, contact: null, sourceTag: null, device: null,
    durationSec: 60, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
    completedAt: new Date("2026-01-01"), ...overrides,
  };
}

function group(report: ReturnType<typeof trainingPathways>, id = "G1") {
  const domain = report.domains.find((domain) => domain.groupId === id);
  assert.ok(domain);
  return domain;
}

test("empty result preserves all six domains, with no invented courses", () => {
  const report = trainingPathways([]);
  assert.deepEqual(report.domains.map((domain) => domain.groupId), Object.keys(COURSE_GROUPS));
  assert.equal(report.respondents, 0);
  assert.equal(report.courseCount, 70);
  for (const domain of report.domains) {
    assert.deepEqual(domain.topCourses, []);
    assert.equal(domain.gate.respondents, 0);
    assert.equal(domain.evaluatedCourses, 0);
  }
  assert.ok(GetTrainingPathwaysResponse.safeParse(report).success);
});

test("only valid shown ratings enter denominators; drafts and other paths do not", () => {
  const rows = [
    row({ Q25: { C1: 2 } }),
    row({ Q25: { C1: 1 } }),
    row({ Q25: { C1: 0 } }),
    row({ Q25: {} }),
    row({ Q25: { C1: null, C2: "2", C3: 3 } }),
    row({ Q25: { C1: 0 } }, { path: "B2C" }),
    row({ Q25: { C1: 2 } }, { status: "draft" }),
  ];
  const report = trainingPathways(rows, "B2B");
  const domain = group(report);
  const item = domain.topCourses[0];
  assert.equal(report.respondents, 5);
  assert.equal(domain.evaluatedRespondents, 3);
  assert.equal(domain.evaluatedCourses, 1);
  assert.equal(item.demand.shown, 3);
  assert.equal(item.demand.needIndex, 50);
  assert.equal(item.demand.bookNowShare, 33.33);
  assert.equal(item.interestedRespondents, 2);
  assert.deepEqual(group(trainingPathways(rows, "B2C")).topCourses, []);
});

test("each workshop gets its own interested cohort and per-question denominators", () => {
  const report = trainingPathways([
    row({ Q25: { C1: 2, C2: 0 }, Q19: ["center", "center", "live_online"], Q22: "english", Q26: ["practitioners", "simulation"] }),
    row({ Q25: { C1: 1, C2: 0 }, Q19: "live_online", Q22: "arabic" }), // legacy single choice
    row({ Q25: { C1: 0, C2: 2 }, Q19: ["onsite"], Q22: "bilingual", Q26: ["packages"] }),
    row({ Q25: { C1: 0, C2: 1 }, Q19: ["onsite"] }),
    row({ Q25: { C1: 2 } }, { path: "B2C" }), // no delivery answers
  ]);
  const course1 = group(report).topCourses.find((course) => course.demand.courseId === "C1")!;
  assert.equal(course1.interestedRespondents, 3);
  const mode = course1.preferences.find((pref) => pref.questionId === "Q19")!;
  assert.equal(mode.respondents, 2);
  assert.deepEqual(mode.options.map((option) => [option.key, option.count, option.pct]), [
    ["live_online", 2, 100], ["center", 1, 50],
  ]);
  const language = course1.preferences.find((pref) => pref.questionId === "Q22")!;
  assert.equal(language.options.length, 2); // ties retained, not arbitrarily resolved
  assert.ok(language.options.every((option) => option.pct === 50));
  const certificate = course1.preferences.find((pref) => pref.questionId === "Q23")!;
  assert.equal(certificate.respondents, 0);
  assert.deepEqual(certificate.options, []);
  const differentiators = course1.preferences.find((pref) => pref.questionId === "Q26")!;
  assert.equal(differentiators.respondents, 1);
  assert.ok(differentiators.options.every((option) => option.pct === 100));
  const course2 = group(report).topCourses.find((course) => course.demand.courseId === "C2")!;
  assert.equal(course2.preferences.find((pref) => pref.questionId === "Q19")!.options[0].key, "onsite");
});

test("top three ranking is stable and never fills spaces with no-interest workshops", () => {
  const report = trainingPathways([
    row({ Q25: { C1: 2, C2: 2, C3: 2, C4: 2, C5: 0 } }),
    row({ Q25: { C1: 2, C2: 2, C3: 2, C4: 2, C5: 0 } }),
  ]);
  assert.deepEqual(group(report).topCourses.map((course) => course.demand.courseId), ["C1", "C2", "C3"]);
  assert.equal(group(report).interestedCourses, 4);
  assert.equal(group(report).evaluatedCourses, 5);
  const futureOnly = trainingPathways([row({ Q25: { C18: 1, C19: 0 } })]);
  assert.deepEqual(group(futureOnly, "G5").topCourses.map((course) => course.demand.courseId), ["C18"]);
  assert.equal(group(futureOnly, "G5").topCourses[0].demand.bookNowShare, 0);
});

test("equal need ranks by immediate intent, then coverage, then stable id", () => {
  const report = trainingPathways([
    row({ Q25: { C1: 1, C2: 2, C3: 2 } }),
    row({ Q25: { C1: 1, C2: 0, C3: 0 } }),
    row({ Q25: { C2: 2 } }),
    row({ Q25: { C2: 0 } }),
  ]);
  assert.deepEqual(group(report).topCourses.map((course) => course.demand.courseId), ["C2", "C3", "C1"]);
});

test("legacy gates and ranks do not overwrite actual course evaluation", () => {
  const input = [
    row({ Q25G: ["G1"], Q25: { C14: 2 }, Q24: ["T1", "T2", "T3", "T4", "T5", "T6"] }),
    row({ Q25: { C14: 1 } }),
  ];
  const before = JSON.stringify(input);
  const report = trainingPathways(input);
  const finance = group(report, "G4");
  assert.equal(finance.gate.respondents, 1);
  assert.equal(finance.gate.selected, 0);
  assert.equal(finance.topCourses[0].demand.shown, 2);
  assert.equal(finance.topCourses[0].demand.needIndex, 75);
  assert.equal(JSON.stringify(input), before); // historical data untouched
});

test("catalogue uses only primary workshop and no respondent identities are returned", () => {
  const report = trainingPathways([row({ Q25: { C1: 2 } }, { id: "private-id", contact: { email: "private@example.invalid" } })]);
  assert.equal(group(report).topCourses[0].catalogue?.titleEn, "Prompt and Workflow Design");
  assert.ok(GetTrainingPathwaysResponse.safeParse(report).success);
  assert.ok(!JSON.stringify(report).includes("private-id"));
  assert.ok(!JSON.stringify(report).includes("private@example.invalid"));
  assert.ok(GetTrainingPathwaysQueryParams.safeParse({ path: "B2B" }).success);
  assert.ok(!GetTrainingPathwaysQueryParams.safeParse({ path: "invalid" }).success);
});

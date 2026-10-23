import { test } from "node:test";
import assert from "node:assert/strict";
import type { ResponseRow } from "@workspace/db";
import { GetCourseInsightQueryParams, GetCourseInsightResponse } from "@workspace/api-zod";
import { courseInsight } from "../src/lib/course-insight";
import { COURSES } from "../src/data/survey-items";

// Pure in-memory fixtures. Do not read, insert or delete database records.
function row(answers: Record<string, unknown>, overrides: Partial<ResponseRow> = {}): ResponseRow {
  return {
    id: "fixture", status: "complete", path: "B2B", consent: true,
    currentStep: 5, answers, contact: null, sourceTag: null, device: null,
    durationSec: 60, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
    completedAt: new Date("2026-01-01"), ...overrides,
  };
}

test("all 70 courses have a valid profile even without ratings", () => {
  assert.equal(Object.keys(COURSES).length, 70);
  for (const [id, definition] of Object.entries(COURSES)) {
    const report = courseInsight([], id)!;
    assert.ok(report);
    assert.ok(GetCourseInsightResponse.safeParse(report).success);
    assert.equal(report.workshop.demand.label, definition.label);
    assert.equal(report.domain.groupId, definition.group);
    assert.equal(report.state, "not_evaluated");
    assert.equal(report.domainRank, null);
    assert.equal(report.rankTied, false);
    assert.ok(report.byPath.every((slice) => slice.needIndex === null));
    assert.equal(report.workshop.interestedRespondents, 0);
    assert.ok(report.workshop.preferences.every((question) => question.respondents === 0 && question.options.length === 0));
  }
});

test("unobserved is not the same as measured zero interest", () => {
  const rows = [row({ Q25: { C1: 0, C2: 2 } }), row({ Q25: { C1: 0 } })];
  const zero = courseInsight(rows, "C1")!;
  assert.equal(zero.state, "no_interest");
  assert.equal(zero.workshop.demand.shown, 2);
  assert.equal(zero.workshop.demand.needIndex, 0);
  assert.equal(zero.domainRank, 2);
  assert.equal(zero.workshop.interestedRespondents, 0);
  assert.ok(zero.workshop.preferences.every((question) => question.respondents === 0));
  const unobserved = courseInsight(rows, "C3")!;
  assert.equal(unobserved.state, "not_evaluated");
  assert.equal(unobserved.domainRank, null);
  assert.equal(unobserved.domainEvaluatedCourses, 2);
  assert.equal(unobserved.byPath[0].needIndex, null);
});

test("course-specific cohorts preserve answered denominators, multiple selections and ties", () => {
  const rows = [
    row({ Q25: { C1: 2, C2: 0 }, Q19: ["center", "center"], Q22: "english", Q26: ["simulation", "practitioners"] }),
    row({ Q25: { C1: 1, C2: 0 }, Q19: "live_online", Q22: "arabic" }),
    row({ Q25: { C1: 1, C2: 0 } }),
    row({ Q25: { C1: 0, C2: 2 }, Q19: ["onsite"], Q22: "bilingual" }),
  ];
  const report = courseInsight(rows, "C1")!;
  assert.equal(report.workshop.interestedRespondents, 3);
  assert.equal(report.workshop.demand.shown, 4);
  const delivery = report.workshop.preferences.find((question) => question.questionId === "Q19")!;
  assert.equal(delivery.respondents, 2);
  assert.deepEqual(delivery.options.map((option) => [option.key, option.count, option.pct]), [
    ["center", 1, 50], ["live_online", 1, 50],
  ]);
  const differentiators = report.workshop.preferences.find((question) => question.questionId === "Q26")!;
  assert.equal(differentiators.respondents, 1);
  assert.equal(differentiators.options.length, 2);
  assert.ok(differentiators.options.every((option) => option.pct === 100));
  assert.equal(report.workshop.preferences.find((question) => question.questionId === "Q23")!.respondents, 0);
  const other = courseInsight(rows, "C2")!;
  assert.equal(other.workshop.preferences.find((question) => question.questionId === "Q19")!.options[0].key, "onsite");
});

test("complete status, valid numeric ratings and path scope apply to every metric", () => {
  const rows = [
    row({ Q25: { C1: 2 } }),
    row({ Q25: { C1: 1 } }),
    row({ Q25: { C1: "2" } }),
    row({ Q25: { C1: null } }),
    row({ Q25: { C1: 3 } }),
    row({ Q25: { C1: 0 } }, { path: "B2C" }),
    row({ Q25: { C1: 2 } }, { status: "draft" }),
  ];
  const b2b = courseInsight(rows, "C1", "B2B")!;
  assert.equal(b2b.respondents, 5);
  assert.equal(b2b.workshop.demand.shown, 2);
  assert.equal(b2b.workshop.demand.needIndex, 75);
  assert.deepEqual(b2b.byPath, [
    { path: "B2B", shown: 2, interested: 2, bookNow: 1, needIndex: 75 },
    { path: "B2C", shown: 0, interested: 0, bookNow: 0, needIndex: null },
  ]);
  const all = courseInsight(rows, "C1")!;
  assert.equal(all.workshop.demand.shown, 3);
  assert.equal(all.workshop.demand.needIndex, 50);
  assert.equal(all.byPath[1].needIndex, 0);
  assert.equal(courseInsight(rows, "C1", "B2C")!.state, "no_interest");
});

test("competition ranking preserves exact ties and compares only evaluated domain courses", () => {
  const rows = [
    row({ Q25: { C1: 2, C2: 2, C3: 1, C4: 2, C6: 2 } }),
    row({ Q25: { C1: 2, C2: 2, C3: 1, C4: 0, C6: 2 } }),
  ];
  for (const course of ["C1", "C2"]) {
    assert.equal(courseInsight(rows, course)!.domainRank, 1);
    assert.equal(courseInsight(rows, course)!.rankTied, true);
  }
  assert.equal(courseInsight(rows, "C4")!.domainRank, 3);
  assert.equal(courseInsight(rows, "C3")!.domainRank, 4);
  assert.equal(courseInsight(rows, "C3")!.rankTied, false);
  assert.equal(courseInsight(rows, "C1")!.domainEvaluatedCourses, 4);
  assert.equal(courseInsight(rows, "C6")!.domainEvaluatedCourses, 1);
});

test("legacy gate selections do not rewrite course evidence or leak participant data", () => {
  const rows = [row(
    { Q25G: ["G1"], Q25: { C14: 2 }, Q24: ["T1", "T2", "T3", "T4", "T5", "T6"] },
    { id: "private-fixture-id", contact: { email: "private@example.invalid" } },
  )];
  const before = JSON.stringify(rows);
  const report = courseInsight(rows, "C14")!;
  assert.equal(report.domain.selected, 0);
  assert.equal(report.workshop.demand.shown, 1);
  assert.equal(report.state, "interested");
  assert.ok(GetCourseInsightResponse.safeParse(report).success);
  assert.equal(JSON.stringify(rows), before);
  assert.ok(!JSON.stringify(report).includes("private-fixture-id"));
  assert.ok(!JSON.stringify(report).includes("private@example.invalid"));
  assert.equal(courseInsight([], "C1")!.workshop.catalogue?.titleEn, "Prompt and Workflow Design");
});

test("query validation rejects malformed filters and unknown courses are explicit", () => {
  assert.ok(GetCourseInsightQueryParams.safeParse({ courseId: "C70", path: "B2C" }).success);
  assert.ok(!GetCourseInsightQueryParams.safeParse({}).success);
  assert.ok(!GetCourseInsightQueryParams.safeParse({ courseId: "C1", path: "other" }).success);
  assert.ok(!GetCourseInsightQueryParams.safeParse({ courseId: ["C1", "C2"] }).success);
  assert.ok(!GetCourseInsightQueryParams.safeParse({ courseId: "not-a-course" }).success);
  assert.equal(courseInsight([], "C999"), null);
});

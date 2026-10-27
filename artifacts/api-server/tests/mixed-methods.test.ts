import { test } from "node:test";
import assert from "node:assert/strict";
import type { ResponseRow } from "@workspace/db";
import { GetMixedMethodsQueryParams, GetMixedMethodsResponse } from "@workspace/api-zod";
import { mixedMethods, mixedAlignment, mixedDemand } from "../src/lib/mixed-methods";
import { focusGroupAnalysis } from "../src/data/focus-groups";
import { COURSE_GROUPS, COURSES, ITEM_WORKSHOPS } from "../src/data/survey-items";
import { catalogue } from "../src/data/catalogue";

// In-memory fixtures only. No database connection, seed, or response mutation.
function row(answers: Record<string, unknown>, overrides: Partial<ResponseRow> = {}): ResponseRow {
  return {
    id: "fixture", status: "complete", path: "B2B", consent: true,
    currentStep: 5, answers, contact: null, sourceTag: null, device: null,
    durationSec: 60, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
    completedAt: new Date("2026-01-01"), ...overrides,
  };
}
const domain = (report: ReturnType<typeof mixedMethods>, id = "G1") => report.domains.find((d) => d.groupId === id)!;
const many = (n: number, answers: Record<string, unknown>) => Array.from({ length: n }, (_, i) => row(answers, { id: `fixture-${i}` }));

test("empty report retains six domains and all eighteen domain-level cells", () => {
  const report = mixedMethods([]);
  assert.ok(GetMixedMethodsResponse.safeParse(report).success);
  assert.deepEqual(report.domains.map((d) => d.groupId), Object.keys(COURSE_GROUPS));
  assert.equal(report.domains.flatMap((d) => d.levels).length, 18);
  assert.equal(report.respondents, 0);
  assert.equal(report.qualitativeGroups, 3);
  for (const d of report.domains) {
    assert.equal(d.demand.needIndex, null);
    assert.equal(d.selectionShare, null);
    assert.equal(d.priorityScore, null);
    assert.equal(d.alignment.code, "unobserved");
    assert.deepEqual(d.topCourses, []);
    for (const cell of d.levels) {
      assert.equal(cell.demand.evaluatedRespondents, 0);
      assert.equal(cell.demand.interestShare, null);
      assert.equal(cell.demand.needIndex, null);
    }
  }
});

test("course rating counts are distinct from unique-person denominators", () => {
  const report = mixedMethods([
    row({ Q25: { C1: 2, C2: 1, C3: 0 } }),
    row({ Q25: { C1: 0 } }),
    row({ Q25: { C2: 1, C3: 2 } }),
    row({ Q25: {} }),
  ]);
  const d = domain(report).demand;
  assert.equal(d.ratingCount, 6);
  assert.equal(d.evaluatedRespondents, 3);
  assert.equal(d.interestedRespondents, 2);
  assert.equal(d.bookNowRespondents, 2);
  assert.equal(d.futureRatings, 2);
  assert.equal(d.bookNowRatings, 2);
  assert.equal(d.notInterestedRatings, 2);
  assert.equal(d.needIndex, 50);
  assert.equal(d.interestShare, 200 / 3);
});

test("only strict 0/1/2 values count, never malformed or unknown course entries", () => {
  const report = mixedMethods([
    row({ Q25: { C1: "2", C2: true, C3: null, C4: 2.5, C5: -1, C32: 3, C33: NaN, C34: Infinity, Unknown: 2 } }),
    row({ Q25: null }), row({ Q25: [] }), row({ Q25: "bad" }),
    row({ Q25: { C1: 0 } }),
  ]);
  const d = domain(report);
  assert.equal(d.demand.ratingCount, 1);
  assert.equal(d.demand.needIndex, 0);
  assert.equal(d.demand.interestShare, 0);
  assert.equal(d.demand.evaluatedRespondents, 1);
  assert.deepEqual(d.topCourses, []);
});

test("measured zero is different from missing data and can flag descriptive divergence", () => {
  const report = mixedMethods(many(5, { Q25: { C1: 0 } }));
  assert.equal(domain(report).alignment.code, "divergent");
  assert.equal(domain(report).demand.needIndex, 0);
  assert.equal(domain(report, "G2").alignment.code, "unobserved");
  assert.equal(domain(report, "G2").demand.needIndex, null);
});

test("small samples stay exploratory and never become agreement claims", () => {
  const report = mixedMethods(many(4, { Q25: { C1: 2 } }));
  assert.equal(domain(report).demand.needIndex, 100);
  assert.equal(domain(report).alignment.code, "limited");
  assert.equal(domain(mixedMethods(many(5, { Q25: { C1: 1 } }))).alignment.code, "convergent");
});

test("classification uses unrounded index, explicit evidence and five-person rule", () => {
  const measured = mixedDemand(many(5, { Q25: { C1: 1 } }), ["C1"]);
  assert.equal(mixedAlignment({ ...measured, needIndex: 49.999 }, 1).code, "divergent");
  assert.equal(mixedAlignment({ ...measured, needIndex: 50 }, 1).code, "convergent");
  assert.equal(mixedAlignment(measured, 0).code, "quantitative_only");
  assert.equal(mixedAlignment({ ...measured, evaluatedRespondents: 0 }, 0).code, "unobserved");
});

test("survey path and completion filters never change the independent qualitative sample", () => {
  const rows = [
    ...many(5, { Q25: { C1: 2 } }),
    row({ Q25: { C1: 0 } }, { path: "B2C" }),
    row({ Q25: { C1: 2 } }, { path: "B2C", status: "draft" }),
  ];
  const b2b = mixedMethods(rows, "B2B"), b2c = mixedMethods(rows, "B2C"), all = mixedMethods(rows);
  assert.equal(b2b.respondents, 5);
  assert.equal(b2c.respondents, 1);
  assert.equal(all.respondents, 6);
  assert.equal(domain(b2b).demand.needIndex, 100);
  assert.equal(domain(b2c).demand.needIndex, 0);
  assert.deepEqual(domain(b2b).qualitativeGroupIds, domain(b2c).qualitativeGroupIds);
  assert.deepEqual(domain(b2b).evidenceLinks, domain(b2c).evidenceLinks);
  assert.equal(b2b.qualitativeGroups, 3);
  assert.equal(b2c.scope, "B2C");
});

test("domain selection deduplicates valid choices and retains its own denominator", () => {
  const report = mixedMethods([
    row({ Q25G: ["G1", "G1", "G2", "bad"] }),
    row({ Q25G: ["G2"] }),
    row({ Q25G: ["bad"] }), row({ Q25G: [] }), row({ Q25G: "G1" }),
    row({ Q25: { C1: 2 } }),
  ]);
  assert.equal(report.gateRespondents, 2);
  assert.equal(domain(report).selected, 1);
  assert.equal(domain(report).selectionShare, 50);
  assert.equal(domain(report, "G2").selectionShare, 100);
  assert.equal(domain(report).demand.evaluatedRespondents, 1);
});

test("rankings use only complete current permutations, never reinterpret historical cohorts", () => {
  const current = Object.keys(COURSE_GROUPS);
  const report = mixedMethods([
    row({ Q24: current }),
    row({ Q24: current.map((id) => id.replace("G", "T")) }),
    row({ Q24: ["R1", "R2", "R3", "R4", "R5", "R6", "R7"] }),
    row({ Q24: ["G1", "G1", "G2", "G3", "G4", "G5"] }),
    row({ Q24: ["G1", "G2"] }), row({ Q24: [] }), row({}),
  ]);
  assert.equal(report.rankRespondents, 1);
  assert.equal(report.excludedRankingRespondents, 4);
  assert.equal(domain(report).priorityScore, 100);
  assert.equal(domain(report, "G6").priorityScore, 0);
  assert.equal(domain(report).meanRank, 1);
  assert.equal(domain(report).demand.needIndex, null);
});

test("opposite current orders preserve equal priority scores", () => {
  const order = Object.keys(COURSE_GROUPS);
  const report = mixedMethods([row({ Q24: order }), row({ Q24: [...order].reverse() })]);
  assert.ok(report.domains.every((d) => d.priorityScore === 50 && d.meanRank === 3.5));
});

test("qualitative crosswalk resolves only verified evidence and excludes contextual coverage", () => {
  const report = mixedMethods([]);
  const evidence = new Map(focusGroupAnalysis.evidence.map((e) => [e.id, e]));
  for (const d of report.domains) {
    for (const link of d.evidenceLinks) {
      const theme = focusGroupAnalysis.themes.find((t) => t.id === link.themeId)!;
      for (const id of link.evidenceIds) assert.ok(evidence.has(id), id);
      const explicit = theme.signals.filter((signal) => signal.status === "explicit" && signal.evidenceIds.some((id) => link.evidenceIds.includes(id))).map((s) => s.groupId);
      assert.deepEqual(link.explicitGroupIds, [...new Set(explicit)]);
    }
    assert.deepEqual(d.qualitativeGroupIds, [...new Set(d.evidenceLinks.filter((l) => l.relation === "direct").flatMap((l) => l.explicitGroupIds))]);
  }
  assert.equal(domain(report, "G5").qualitativeGroupIds.length, 1, "Do not borrow all three change groups for projects");
  assert.equal(domain(report, "G6").qualitativeGroupIds.length, 2, "Contextual graduate programmes are not an explicit onboarding need");
  assert.equal(domain(report, "G4").qualitativeGroupIds.length, 2);
  assert.equal(domain(report).evidenceLinks.find((link) => link.themeId === "data")!.explicitGroupIds.length, 2);
  for (const item of [...report.levels, ...report.blindSpots]) {
    assert.ok(item.evidenceIds.length > 0);
    item.evidenceIds.forEach((id) => assert.ok(evidence.has(id), id));
  }
});

test("all courses map only through the primary catalogue link to three provisional levels", () => {
  const q25 = Object.fromEntries(Object.keys(COURSES).map((id) => [id, 1]));
  const report = mixedMethods([row({ Q25: q25 })]);
  assert.equal(report.unclassifiedCourseCount, 0);
  assert.equal(report.levels.reduce((n, l) => n + l.demand.courseCount, 0), 70);
  for (const d of report.domains) {
    for (const cell of d.levels) {
      const expected = Object.entries(COURSES).filter(([id, course]) =>
        course.group === d.groupId && catalogue.find((w) => w.titleEn === ITEM_WORKSHOPS[id]?.[0])?.tier === cell.tier).length;
      assert.equal(cell.demand.courseCount, expected);
      assert.equal(cell.demand.ratingCount, expected);
      assert.equal(cell.demand.needIndex, expected ? 50 : null);
    }
  }
  const unavailable = domain(report, "G6").levels.find((l) => l.tier === "Leadership")!;
  assert.equal(unavailable.demand.courseCount, 0);
  assert.equal(unavailable.demand.needIndex, null);
});

test("level measures count people independently and do not infer proficiency from job titles", () => {
  const answers = { Q25: Object.fromEntries(Object.keys(COURSES).map((id) => [id, 2])) };
  const employee = mixedMethods([row({ ...answers, Q6: "employee" })]);
  const senior = mixedMethods([row({ ...answers, Q6: "senior" })]);
  assert.deepEqual(employee.levels, senior.levels);
  assert.ok(employee.levels.every((l) => l.demand.evaluatedRespondents === 1 && l.demand.interestedRespondents === 1));
  assert.ok(employee.levels.reduce((n, l) => n + l.demand.interestedRespondents, 0) > employee.respondents);
});

test("examples include only real observed interest, with deterministic limited tie display", () => {
  const report = mixedMethods([
    row({ Q25: { C1: 2, C2: 2, C3: 1, C4: 0 } }),
    row({ Q25: { C1: 2, C2: 2 } }),
  ]);
  assert.deepEqual(domain(report).topCourses.map((c) => c.courseId), ["C1", "C2", "C3"]);
  assert.equal(domain(report).topCourses[0].needIndex, domain(report).topCourses[1].needIndex);
  assert.ok(report.domains.flatMap((d) => d.topCourses).every((course) => course.shown > 0 && course.interested > 0));
});

test("all report branches satisfy generated schema and path contract", () => {
  for (const rows of [[], many(1, { Q25: { C1: 1 } }), many(6, { Q25: { C1: 0 } }), many(6, { Q25: { C1: 2 } })]) {
    for (const path of [undefined, "B2B", "B2C"] as const) {
      const parsed = GetMixedMethodsResponse.safeParse(mixedMethods(rows, path));
      assert.ok(parsed.success, parsed.success ? "" : parsed.error.message);
    }
  }
  assert.ok(GetMixedMethodsQueryParams.safeParse({ path: "B2C" }).success);
  assert.ok(GetMixedMethodsQueryParams.safeParse({}).success);
  assert.equal(GetMixedMethodsQueryParams.safeParse({ path: "other" }).success, false);
});

test("aggregation is read-only and contains no respondent identifiers or contact details", () => {
  const rows = [row({ Q25: { C1: 2 }, unrelated: "private-fixture-value" }, {
    id: "private-fixture-id", contact: { email: "private-fixture@example.invalid" },
  })];
  const before = JSON.stringify(rows);
  const report = mixedMethods(rows);
  assert.equal(JSON.stringify(rows), before);
  assert.equal(JSON.stringify(report).includes("private-fixture"), false);
});

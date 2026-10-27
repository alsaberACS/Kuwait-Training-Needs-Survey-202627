import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GetFocusGroupAnalysisResponse } from "@workspace/api-zod";
import { focusGroupAnalysis as report } from "../src/data/focus-groups";

// Run from the workspace root. These tests never read or modify survey records.
const groupIds = new Set(report.groups.map((group) => group.id));
const themeIds = new Set(report.themes.map((theme) => theme.id));
const excerpts = new Map(report.evidence.map((item) => [item.id, item]));

test("qualitative report satisfies the generated contract with unique identifiers", () => {
  assert.ok(GetFocusGroupAnalysisResponse.safeParse(report).success);
  assert.equal(groupIds.size, 3);
  assert.equal(themeIds.size, report.themes.length);
  assert.equal(excerpts.size, report.evidence.length);
  for (const collection of [report.executiveFindings, report.issues, report.tensions, report.recommendations]) {
    assert.equal(new Set(collection.map((item) => item.id)).size, collection.length);
  }
});

test("every quotation is verbatim within its cited transcript lines, never the summary", () => {
  const sources = new Map(report.groups.map((group) => [
    group.id, readFileSync(resolve("attached_assets", group.sourceFile), "utf8").split(/\r?\n/),
  ]));
  const failures: string[] = [];
  for (const item of report.evidence) {
    const source = sources.get(item.groupId);
    assert.ok(source, `Unknown group for ${item.id}`);
    const transcriptStart = source.findIndex((line) => line.trim() === "Transcript");
    assert.ok(transcriptStart >= 0);
    if (item.lineStart <= transcriptStart + 1 || item.lineEnd < item.lineStart || item.lineEnd > source.length) {
      failures.push(`${item.id}: invalid transcript range ${item.lineStart}–${item.lineEnd}`);
    } else if (!source.slice(item.lineStart - 1, item.lineEnd).join("\n").includes(item.quote)) {
      failures.push(`${item.id}: quotation mismatch at ${item.lineStart}–${item.lineEnd}`);
    }
    assert.ok(item.quote.length > 10);
    assert.ok(item.meaning.length > 10);
  }
  assert.deepEqual(failures, []);
});

test("all evidence links resolve and theme signals cite only their own group", () => {
  const collections = [report.groups, report.executiveFindings, report.issues, report.tensions, report.recommendations];
  for (const collection of collections) {
    for (const item of collection) {
      assert.ok(item.evidenceIds.length > 0, `No evidence for ${item.id}`);
      assert.equal(new Set(item.evidenceIds).size, item.evidenceIds.length);
      for (const id of item.evidenceIds) assert.ok(excerpts.has(id), `${item.id} refers to missing ${id}`);
    }
  }
  for (const theme of report.themes) {
    assert.deepEqual(new Set(theme.signals.map((signal) => signal.groupId)), groupIds);
    assert.equal(theme.signals.length, groupIds.size);
    for (const signal of theme.signals) {
      if (signal.status === "not_observed") assert.equal(signal.evidenceIds.length, 0);
      else assert.ok(signal.evidenceIds.length > 0, `${theme.id}/${signal.groupId} needs evidence`);
      for (const id of signal.evidenceIds) assert.equal(excerpts.get(id)?.groupId, signal.groupId, id);
    }
  }
});

test("coverage counts unique explicit groups, excludes context and preserves breadth ties", () => {
  for (const theme of report.themes) {
    const count = new Set(theme.signals.filter((s) => s.status === "explicit").map((s) => s.groupId)).size;
    assert.equal(theme.coverage, count);
    assert.ok(count >= 1 && count <= 3);
    assert.equal(theme.priority, count === 3 ? "shared" : count === 2 ? "targeted" : "specialist");
    assert.ok(theme.courseIdeas.length > 0 && theme.audience && theme.deliveryAdvice);
  }
  assert.equal(report.themes.filter((t) => t.coverage === 3).length, 5);
  for (const [id, expected] of [["esg", 2], ["data", 2], ["knowledge", 2], ["onboarding", 2], ["insurance", 1], ["compliance", 1], ["technical", 1], ["hr-training", 1]] as const) {
    assert.equal(report.themes.find((t) => t.id === id)?.coverage, expected, id);
  }
  assert.equal(report.themes.find((t) => t.id === "esg")?.signals.find((s) => s.groupId === "FG3")?.status, "context");
  assert.equal(report.themes.find((t) => t.id === "data")?.signals.find((s) => s.groupId === "FG2")?.status, "context");
});

test("headline metrics are derived from the source-linked analysis", () => {
  assert.deepEqual(report.stats, {
    groups: report.groups.length,
    codedThemes: report.themes.length,
    sharedThemes: report.themes.filter((t) => t.coverage === report.groups.length).length,
    evidenceExcerpts: report.evidence.length,
  });
  assert.ok(report.headline.startsWith(String(report.stats.sharedThemes)));
});

test("source identities, boundaries and action links remain explicit", () => {
  assert.deepEqual(report.groups.map((group) => group.sourceFile), [
    "Meeting1_1793119305697.md", "Meeting2_1793119305697.md", "Meeting3_1793119305697.md",
  ]);
  for (const group of report.groups) {
    for (const id of group.distinctiveThemes) assert.ok(themeIds.has(id));
    for (const id of group.evidenceIds) assert.equal(excerpts.get(id)?.groupId, group.id);
  }
  for (const action of report.recommendations) {
    assert.ok([1, 2, 3].includes(action.stage));
    assert.ok(action.owner.includes("مقترحة"));
    assert.ok(action.successMeasure.length > 20);
    for (const id of action.themeIds) assert.ok(themeIds.has(id));
  }
  assert.match(report.methodology.scopeNote, /B2B\/B2C/);
  assert.match(report.methodology.rankingRule, /التعادل/);
  assert.ok(report.methodology.limitations.some((line) => line.includes("ممثل")));
  assert.ok(excerpts.get("g1-cyber")?.caution);
  assert.ok(excerpts.get("g3-procurement")?.caution);
  assert.ok(excerpts.get("g2-uptake")?.caution);
});

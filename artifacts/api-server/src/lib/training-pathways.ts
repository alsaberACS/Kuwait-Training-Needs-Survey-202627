import type { ResponseRow } from "@workspace/db";
import type { CourseDemandItem, SurveyPath, TrainingPathwaysReport } from "@workspace/api-zod";
import { catalogue } from "../data/catalogue";
import { COURSE_GROUPS, ITEM_WORKSHOPS } from "../data/survey-items";
import { courseDemand, preferences, toCatalogueDto } from "./analytics";

const DELIVERY_QUESTIONS = new Set(["Q19", "Q20", "Q21", "Q22", "Q23", "Q26"]);
const catalogueByTitle = new Map(catalogue.map((workshop) => [workshop.titleEn, workshop]));

function rating(row: ResponseRow, courseId: string): unknown {
  const matrix = row.answers.Q25;
  return matrix && typeof matrix === "object" && !Array.isArray(matrix)
    ? (matrix as Record<string, unknown>)[courseId]
    : undefined;
}

/** Match the existing demand ranking, with a stable final tie-break independent of DB order. */
function rankCourses(a: CourseDemandItem, b: CourseDemandItem): number {
  return b.needIndex - a.needIndex
    || b.bookNowShare - a.bookNowShare
    || b.shown - a.shown
    || Number(a.courseId.slice(1)) - Number(b.courseId.slice(1));
}

/**
 * Read-only aggregate for the six-domain board.
 * Delivery preferences describe the people interested in each course, not a
 * causal explanation of its demand. Each question keeps its own denominator.
 */
export function trainingPathways(all: ResponseRow[], path?: SurveyPath): TrainingPathwaysReport {
  const rows = all.filter((row) => row.status === "complete" && (!path || row.path === path));
  const demand = courseDemand(rows);

  return {
    respondents: rows.length,
    courseCount: demand.items.length,
    evaluatedCourses: demand.items.filter((course) => course.shown > 0).length,
    domains: Object.entries(COURSE_GROUPS).map(([groupId, label]) => {
      const courses = demand.items.filter((course) => course.groupId === groupId);
      const evaluated = courses.filter((course) => course.shown > 0);
      const interested = evaluated.filter((course) => course.future + course.bookNow > 0).sort(rankCourses);
      const gate = demand.groups.find((group) => group.groupId === groupId)!;
      return {
        groupId,
        label,
        gate,
        evaluatedCourses: evaluated.length,
        interestedCourses: interested.length,
        evaluatedRespondents: rows.filter((row) => courses.some((course) => {
          const code = rating(row, course.courseId);
          return code === 0 || code === 1 || code === 2;
        })).length,
        topCourses: interested.slice(0, 3).map((course) => {
          const cohort = rows.filter((row) => {
            const code = rating(row, course.courseId);
            return code === 1 || code === 2;
          });
          const primaryTitle = ITEM_WORKSHOPS[course.courseId]?.[0];
          const workshop = primaryTitle ? catalogueByTitle.get(primaryTitle) : undefined;
          return {
            demand: course,
            interestedRespondents: cohort.length,
            preferences: preferences(cohort).questions.filter((question) => DELIVERY_QUESTIONS.has(question.questionId)),
            // Omit a missing primary link; never substitute a secondary workshop.
            ...(workshop ? { catalogue: toCatalogueDto(workshop) } : {}),
          };
        }),
      };
    }),
  };
}

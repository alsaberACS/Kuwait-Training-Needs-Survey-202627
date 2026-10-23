import type { ResponseRow } from "@workspace/db";
import type { CourseInsightReport, SurveyPath } from "@workspace/api-zod";
import { courseDemand } from "./analytics";
import { compareCourseDemand, courseRating, workshopProfile } from "./training-pathways";

/**
 * A read-only profile of any survey course, not just a leaderboard entry.
 * Unknown courses return null; known-but-unobserved courses retain their identity.
 * No model-generated claims, participant identifiers or persistent data changes.
 */
export function courseInsight(all: ResponseRow[], courseId: string, path?: SurveyPath): CourseInsightReport | null {
  const rows = all.filter((row) => row.status === "complete" && (!path || row.path === path));
  const demand = courseDemand(rows);
  const course = demand.items.find((item) => item.courseId === courseId);
  if (!course) return null;

  const domain = demand.groups.find((group) => group.groupId === course.groupId)!;
  const courses = demand.items.filter((item) => item.groupId === course.groupId);
  const evaluated = courses.filter((item) => item.shown > 0);
  const interested = course.bookNow + course.future;

  return {
    respondents: rows.length,
    state: course.shown === 0 ? "not_evaluated" : interested === 0 ? "no_interest" : "interested",
    workshop: workshopProfile(rows, course),
    domain,
    domainCourseCount: courses.length,
    domainEvaluatedCourses: evaluated.length,
    domainRank: course.shown > 0
      ? 1 + evaluated.filter((item) => compareCourseDemand(item, course) < 0).length
      : null,
    rankTied: course.shown > 0
      && evaluated.some((item) => item.courseId !== courseId && compareCourseDemand(item, course) === 0),
    byPath: (["B2B", "B2C"] as const).map((slice) => {
      const codes = rows
        .filter((row) => row.path === slice)
        .map((row) => courseRating(row, courseId))
        .filter((code): code is number => code === 0 || code === 1 || code === 2);
      const bookNow = codes.filter((code) => code === 2).length;
      const future = codes.filter((code) => code === 1).length;
      return {
        path: slice,
        shown: codes.length,
        interested: bookNow + future,
        bookNow,
        needIndex: codes.length ? Math.round(((2 * bookNow + future) / (2 * codes.length)) * 10_000) / 100 : null,
      };
    }),
  };
}

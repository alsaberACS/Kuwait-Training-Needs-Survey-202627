import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db, responsesTable } from "@workspace/db";
import { ListAdminResponsesQueryParams, GetMatchingResultsQueryParams, GetTrainingPathwaysQueryParams, GetTrainingPathwaysResponse } from "@workspace/api-zod";
import { toDto } from "./responses";
import { catalogue } from "../data/catalogue";
import { summary, skillsGap, courseDemand, trackRanks, preferences, segments, matching, toCatalogueDto, toCsv } from "../lib/analytics";
import { trainingPathways } from "../lib/training-pathways";

const router: IRouter = Router();

function presentedKey(req: Request): string | null {
  const header = req.header("x-admin-key");
  if (header) return header;
  const auth = req.header("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) return res.status(503).json({ error: "ADMIN_ACCESS_KEY is not configured" });
  const given = presentedKey(req);
  if (!given) return res.status(401).json({ error: "Missing admin key" });
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ error: "Invalid admin key" });
  return next();
}

router.use("/admin", requireAdmin);

router.post("/admin/session", (_req, res) => res.json({ ok: true }));

const pathOf = (req: Request) => (req.query.path === "B2B" || req.query.path === "B2C" ? (req.query.path as string) : undefined);

async function completedRows(path?: string) {
  const where = path ? and(eq(responsesTable.status, "complete"), eq(responsesTable.path, path)) : eq(responsesTable.status, "complete");
  return db.select().from(responsesTable).where(where);
}

router.get("/admin/summary", async (req, res) => {
  const path = pathOf(req);
  const all = await db.select().from(responsesTable).where(path ? eq(responsesTable.path, path) : undefined);
  return res.json(summary(all));
});

router.get("/admin/responses", async (req, res) => {
  const parsed = ListAdminResponsesQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { path, status, sector, nationality, hasContact, page, pageSize } = parsed.data;
  const conds: SQL[] = [];
  if (path) conds.push(eq(responsesTable.path, path));
  if (status) conds.push(eq(responsesTable.status, status));
  if (sector) conds.push(sql`${responsesTable.answers}->'Q5'->>'sector' = ${sector}`);
  if (nationality) conds.push(sql`${responsesTable.answers}->>'Q1' = ${nationality}`);
  if (hasContact === true) conds.push(sql`coalesce(${responsesTable.contact}->>'email', ${responsesTable.contact}->>'phone') is not null`);
  const where = conds.length ? and(...conds) : undefined;
  const size = Math.min(Math.max(pageSize, 1), 200);
  const [items, [{ count }]] = await Promise.all([
    db.select().from(responsesTable).where(where).orderBy(desc(responsesTable.createdAt)).limit(size).offset((Math.max(page, 1) - 1) * size),
    db.select({ count: sql<number>`count(*)::int` }).from(responsesTable).where(where),
  ]);
  return res.json({ items: items.map(toDto), total: count, page, pageSize: size });
});

router.get("/admin/skills-gap", async (_req, res) => res.json(skillsGap(await completedRows())));
router.get("/admin/course-demand", async (req, res) => res.json(courseDemand(await completedRows(pathOf(req)))));
router.get("/admin/training-pathways", async (req, res): Promise<void> => {
  const parsed = GetTrainingPathwaysQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid survey path" });
    return;
  }
  const rows = await completedRows(parsed.data.path);
  res.json(GetTrainingPathwaysResponse.parse(trainingPathways(rows, parsed.data.path)));
});
router.get("/admin/track-ranks", async (req, res) => res.json(trackRanks(await completedRows(pathOf(req)))));
router.get("/admin/preferences", async (req, res) => res.json(preferences(await completedRows(pathOf(req)))));
router.get("/admin/segments", async (_req, res) => res.json(segments(await completedRows())));

router.get("/admin/matching", async (req, res) => {
  const parsed = GetMatchingResultsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  return res.json(matching(await completedRows(), parsed.data.needWeight));
});

router.get("/admin/catalogue", (_req, res) => res.json(catalogue.map(toCatalogueDto)));

router.get("/admin/export.csv", async (_req, res) => {
  const rows = await db.select().from(responsesTable).orderBy(desc(responsesTable.createdAt));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="survey-responses-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(toCsv(rows));
});

export default router;

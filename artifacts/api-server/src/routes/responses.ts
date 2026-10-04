import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, responsesTable, type ResponseRow } from "@workspace/db";
import { CreateResponseBody, UpdateResponseBody, CompleteResponseBody } from "@workspace/api-zod";
import { trainingValidationError } from "../lib/training-validation";

const router: IRouter = Router();

export function toDto(r: ResponseRow) {
  return {
    id: r.id,
    status: r.status,
    path: r.path,
    consent: r.consent,
    currentStep: r.currentStep,
    answers: r.answers ?? {},
    contact: r.contact ?? null,
    sourceTag: r.sourceTag,
    device: r.device,
    durationSec: r.durationSec,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
  };
}

async function load(id: string) {
  const [row] = await db.select().from(responsesTable).where(eq(responsesTable.id, id));
  return row ?? null;
}

router.post("/responses", async (req, res) => {
  const parsed = CreateResponseBody.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [row] = await db
    .insert(responsesTable)
    .values({ id: randomUUID(), sourceTag: parsed.data.sourceTag?.slice(0, 64) ?? null, device: parsed.data.device?.slice(0, 32) ?? null })
    .returning();
  return res.status(201).json(toDto(row));
});

router.get("/responses/:id", async (req, res) => {
  const row = await load(req.params.id);
  if (!row) return res.status(404).json({ error: "Response not found" });
  return res.json(toDto(row));
});

router.patch("/responses/:id", async (req, res) => {
  const parsed = UpdateResponseBody.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const existing = await load(req.params.id);
  if (!existing) return res.status(404).json({ error: "Response not found" });
  if (existing.status === "complete") return res.status(409).json({ error: "Response already completed" });
  const { consent, path, currentStep, answers, contact } = parsed.data;
  if (answers) {
    const error = trainingValidationError(answers, false);
    if (error) return res.status(400).json({ error });
  }
  const [row] = await db
    .update(responsesTable)
    .set({
      ...(consent !== undefined ? { consent } : {}),
      ...(path !== undefined ? { path } : {}),
      ...(currentStep !== undefined ? { currentStep } : {}),
      ...(answers !== undefined ? { answers } : {}),
      ...(contact !== undefined ? { contact } : {}),
      updatedAt: new Date(),
    })
    .where(eq(responsesTable.id, existing.id))
    .returning();
  return res.json(toDto(row));
});

router.post("/responses/:id/complete", async (req, res) => {
  const parsed = CompleteResponseBody.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const existing = await load(req.params.id);
  if (!existing) return res.status(404).json({ error: "Response not found" });
  const { path, answers, contact, durationSec } = parsed.data;
  const trainingError = trainingValidationError(answers, true);
  if (trainingError) return res.status(400).json({ error: trainingError });
  if (!existing.consent && answers.consent !== true) return res.status(400).json({ error: "Consent is required" });
  const [row] = await db
    .update(responsesTable)
    .set({
      status: "complete",
      consent: true,
      path,
      answers,
      contact: contact ?? existing.contact ?? null,
      durationSec: durationSec ?? Math.round((Date.now() - existing.createdAt.getTime()) / 1000),
      currentStep: 5,
      completedAt: existing.completedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(responsesTable.id, existing.id))
    .returning();
  return res.json(toDto(row));
});

export default router;

import { pgTable, text, boolean, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type SurveyAnswers = Record<string, unknown>;
export type ContactInfo = { name?: string; email?: string; phone?: string };

export const responsesTable = pgTable(
  "responses",
  {
    id: text("id").primaryKey(),
    status: text("status").notNull().default("draft"), // draft | complete
    path: text("path"), // B2B | B2C | null
    consent: boolean("consent").notNull().default(false),
    currentStep: integer("current_step").notNull().default(0),
    answers: jsonb("answers").$type<SurveyAnswers>().notNull().default({}),
    contact: jsonb("contact").$type<ContactInfo | null>(),
    sourceTag: text("source_tag"),
    device: text("device"),
    durationSec: integer("duration_sec"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("responses_status_idx").on(t.status), index("responses_path_idx").on(t.path)],
);

export const insertResponseSchema = createInsertSchema(responsesTable).omit({ createdAt: true, updatedAt: true });
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type ResponseRow = typeof responsesTable.$inferSelect;

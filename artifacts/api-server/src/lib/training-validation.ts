import { TRAINING_MODE, shortTrainingErrors } from "@workspace/api-zod/training";

/** Legacy completed records remain valid; new short-mode answers have explicit limits. */
export function trainingValidationError(answers: Record<string, unknown>, complete: boolean): string | undefined {
  if (answers.Q25Mode !== TRAINING_MODE) {
    if (answers.Q25Mode !== undefined || answers.Q25T !== undefined || answers.Q25I !== undefined || answers.Q25Shown !== undefined)
      return "Invalid training questionnaire version";
    return undefined;
  }
  for (const key of ["Q25G", "Q25T", "Q25I", "Q25Shown"]) {
    if (answers[key] !== undefined && (!Array.isArray(answers[key]) || !(answers[key] as unknown[]).every((v) => typeof v === "string")))
      return `Invalid ${key}`;
  }
  if (answers.Q25 !== undefined) return "Short questionnaires cannot include legacy workshop ratings";
  if (complete && !Array.isArray(answers.Q25Shown)) return "Recommended workshop exposure must be recorded";
  const errors = shortTrainingErrors(answers, complete);
  if (Object.keys(errors).length) return Object.values(errors)[0];
  return undefined;
}
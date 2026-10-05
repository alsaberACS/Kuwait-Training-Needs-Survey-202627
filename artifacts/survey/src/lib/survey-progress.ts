import { SKILLS, type Answers } from "./survey-definition";
import { questionNumbers, selectedCourses, STEP_PATH, STEP_S1, STEP_S4, validateStep } from "./survey-logic";

/** Count only required questions on the participant's active branch. */
export function surveyProgress(answers: Answers, submitted = false) {
  const ids = Object.keys(questionNumbers(answers.Q7, answers.Q5?.sector));
  const errors = {
    ...validateStep(STEP_S1, answers),
    ...validateStep(STEP_PATH, answers),
    ...validateStep(STEP_S4, answers),
  };
  const rated = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
  const complete = ids.filter((id) => {
    if (errors[id]) return false;
    if (id === "Q14" || id === "Q18") {
      const ratings = answers[id];
      return SKILLS.every((s) => rated(ratings?.[s.id]?.importance) && rated(ratings?.[s.id]?.performance));
    }
    if (id === "Q25") {
      const courses = selectedCourses(answers);
      return courses.length > 0 && courses.every((c) => [0, 1, 2].includes(answers.Q25?.[c.id] ?? -1));
    }
    return answers[id as keyof Answers] !== undefined;
  }).length;
  const total = ids.length;
  return { completed: submitted ? total : complete, total, percent: submitted ? 100 : Math.round(complete / total * 100) };
}

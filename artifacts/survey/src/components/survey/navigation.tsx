import { createContext, useContext } from "react";

/** Optional outside the participant survey, so reused controls remain safe. */
export const SurveyNavigationContext = createContext<(questionId: string, targetId?: string) => void>(() => {});
export const useSurveyAdvance = () => useContext(SurveyNavigationContext);

export function focusSurveyTarget(target: HTMLElement) {
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
}

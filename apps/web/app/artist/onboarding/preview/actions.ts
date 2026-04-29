"use server";

import { redirect } from "next/navigation";
import { getOnboardingState, advanceOnboarding, setOnboardingState, STEP_PATHS } from "../../../../lib/onboarding-state";

export async function publishProfile() {
  const state = getOnboardingState();
  const next = advanceOnboarding(state, "preview");
  setOnboardingState(next);
  redirect(STEP_PATHS[next.currentStep]);
}

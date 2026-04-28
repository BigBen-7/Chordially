"use server";

import { redirect } from "next/navigation";
import { setArtist } from "../../../lib/artist";
import { getOnboardingState, advanceOnboarding, setOnboardingState, STEP_PATHS } from "../../../lib/onboarding-state";

export async function saveArtist(formData: FormData) {
  setArtist({
    stageName: String(formData.get("stageName") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    genres: String(formData.get("genres") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    wallet: String(formData.get("wallet") ?? "").trim()
  });

  // Advance onboarding state and redirect to next step
  const state = getOnboardingState();
  const next = advanceOnboarding(state, "profile");
  setOnboardingState(next);

  redirect(STEP_PATHS[next.currentStep]);
}

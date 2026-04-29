"use server";

// CHORD-115: After payout, redirect to preview step before publishing
import { redirect } from "next/navigation";
import { getArtist, setArtist } from "../../../../lib/artist";
import { getOnboardingState, advanceOnboarding, setOnboardingState, STEP_PATHS } from "../../../../lib/onboarding-state";

export async function savePayout(formData: FormData) {
  const wallet = String(formData.get("wallet") ?? "").trim();
  const artist = getArtist();
  setArtist({ ...artist, wallet });

  const state = getOnboardingState();
  const next = advanceOnboarding(state, "payout");
  setOnboardingState(next);

  redirect(STEP_PATHS[next.currentStep]);
}

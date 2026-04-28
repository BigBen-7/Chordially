// CHORD-119: Onboarding resume links – persist step progress across devices
import { cookies } from "next/headers";

export type OnboardingStep = "profile" | "media" | "payout" | "complete";

export const STEPS: OnboardingStep[] = ["profile", "media", "payout", "complete"];

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
}

const COOKIE = "chordially_onboarding";

const DEFAULT: OnboardingState = {
  currentStep: "profile",
  completedSteps: []
};

export function getOnboardingState(): OnboardingState {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return DEFAULT;
  try {
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return DEFAULT;
  }
}

export function setOnboardingState(state: OnboardingState) {
  cookies().set(COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}

export function advanceOnboarding(state: OnboardingState, completed: OnboardingStep): OnboardingState {
  const completedSteps = Array.from(new Set([...state.completedSteps, completed])) as OnboardingStep[];
  const nextIdx = STEPS.indexOf(completed) + 1;
  const currentStep = nextIdx < STEPS.length ? STEPS[nextIdx] : "complete";
  return { currentStep, completedSteps };
}

export function getResumeStep(state: OnboardingState): OnboardingStep {
  // Return the first incomplete step
  for (const step of STEPS) {
    if (step === "complete") break;
    if (!state.completedSteps.includes(step)) return step;
  }
  return "complete";
}

export const STEP_PATHS: Record<OnboardingStep, string> = {
  profile: "/artist/onboarding",
  media: "/artist/onboarding/media",
  payout: "/artist/onboarding/payout",
  complete: "/artist/dashboard"
};

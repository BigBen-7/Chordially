/**
 * CHORD-111 – Staged artist onboarding state machine.
 *
 * Tracks incremental progress through required onboarding steps.
 * State is persisted in-memory (resumable within a process) and
 * exposed via helper functions consumed by routes and tests.
 *
 * Steps (in order): profile → media → payout → review
 * Status transitions: pending → in_progress → complete | blocked
 */

export type OnboardingStep = "profile" | "media" | "payout" | "review";

export type StepStatus = "pending" | "in_progress" | "complete" | "blocked";

export interface StepState {
  step: OnboardingStep;
  status: StepStatus;
  completedAt?: string;
  errors?: string[];
}

export type OnboardingStatus = "not_started" | "in_progress" | "complete" | "blocked";

export interface OnboardingState {
  artistId: string;
  steps: StepState[];
  status: OnboardingStatus;
  updatedAt: string;
}

export interface ProfileStepData {
  stageName: string;
  genre: string;
  location: string;
  bio?: string;
}

export interface MediaStepData {
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface PayoutStepData {
  walletAddress: string;
}

const ORDERED_STEPS: OnboardingStep[] = ["profile", "media", "payout", "review"];

const store = new Map<string, OnboardingState>();

function initialState(artistId: string): OnboardingState {
  return {
    artistId,
    steps: ORDERED_STEPS.map((step) => ({ step, status: "pending" })),
    status: "not_started",
    updatedAt: new Date().toISOString(),
  };
}

function computeOverallStatus(steps: StepState[]): OnboardingStatus {
  if (steps.every((s) => s.status === "complete")) return "complete";
  if (steps.some((s) => s.status === "blocked")) return "blocked";
  if (steps.some((s) => s.status === "in_progress" || s.status === "complete")) return "in_progress";
  return "not_started";
}

export function getOnboardingState(artistId: string): OnboardingState {
  return store.get(artistId) ?? initialState(artistId);
}

function updateStep(
  artistId: string,
  step: OnboardingStep,
  status: StepStatus,
  errors?: string[]
): OnboardingState {
  const state = getOnboardingState(artistId);
  const steps = state.steps.map((s) =>
    s.step === step
      ? {
          ...s,
          status,
          errors: errors ?? [],
          completedAt: status === "complete" ? new Date().toISOString() : s.completedAt,
        }
      : s
  );
  const next: OnboardingState = {
    ...state,
    steps,
    status: computeOverallStatus(steps),
    updatedAt: new Date().toISOString(),
  };
  store.set(artistId, next);
  console.info("[onboarding] step updated", { artistId, step, status });
  return next;
}

export function submitProfileStep(
  artistId: string,
  data: ProfileStepData
): OnboardingState {
  const errors: string[] = [];
  if (!data.stageName.trim()) errors.push("stageName is required");
  if (!data.genre.trim()) errors.push("genre is required");
  if (!data.location.trim()) errors.push("location is required");

  if (errors.length > 0) {
    return updateStep(artistId, "profile", "blocked", errors);
  }
  return updateStep(artistId, "profile", "complete");
}

export function submitMediaStep(
  artistId: string,
  data: MediaStepData
): OnboardingState {
  // Media is optional but we mark it complete regardless
  return updateStep(artistId, "media", "complete");
}

export function submitPayoutStep(
  artistId: string,
  data: PayoutStepData
): OnboardingState {
  const errors: string[] = [];
  if (!data.walletAddress.trim()) errors.push("walletAddress is required");
  // Basic Stellar public key format check (G + 55 alphanumeric chars)
  if (data.walletAddress && !/^G[A-Z2-7]{55}$/.test(data.walletAddress)) {
    errors.push("walletAddress must be a valid Stellar public key");
  }

  if (errors.length > 0) {
    return updateStep(artistId, "payout", "blocked", errors);
  }
  return updateStep(artistId, "payout", "complete");
}

export function submitReviewStep(artistId: string): OnboardingState {
  const state = getOnboardingState(artistId);
  const required: OnboardingStep[] = ["profile", "payout"];
  const incomplete = required.filter(
    (s) => state.steps.find((st) => st.step === s)?.status !== "complete"
  );

  if (incomplete.length > 0) {
    return updateStep(artistId, "review", "blocked", [
      `Complete required steps first: ${incomplete.join(", ")}`,
    ]);
  }
  return updateStep(artistId, "review", "complete");
}

export function isOnboardingComplete(artistId: string): boolean {
  return getOnboardingState(artistId).status === "complete";
}

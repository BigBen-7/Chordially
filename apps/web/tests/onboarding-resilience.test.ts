// CHORD-120: Onboarding resilience tests – partial saves, back navigation, data loss prevention
// Uses Node.js built-in test runner (node:test)
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Inline the pure logic under test (no Next.js server imports needed) ─────

type OnboardingStep = "profile" | "media" | "payout" | "complete";
const STEPS: OnboardingStep[] = ["profile", "media", "payout", "complete"];

interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
}

function advanceOnboarding(state: OnboardingState, completed: OnboardingStep): OnboardingState {
  const completedSteps = Array.from(new Set([...state.completedSteps, completed])) as OnboardingStep[];
  const nextIdx = STEPS.indexOf(completed) + 1;
  const currentStep = nextIdx < STEPS.length ? STEPS[nextIdx] : "complete";
  return { currentStep, completedSteps };
}

function getResumeStep(state: OnboardingState): OnboardingStep {
  for (const step of STEPS) {
    if (step === "complete") break;
    if (!state.completedSteps.includes(step)) return step;
  }
  return "complete";
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function validateUpload(file: { type: string; size: number }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    errors.push(`Unsupported type ${file.type}. Use JPEG, PNG, or WebP.`);
  }
  if (file.size > MAX_SIZE_BYTES) {
    errors.push(`File exceeds 5 MB limit.`);
  }
  return { valid: errors.length === 0, errors };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CHORD-120 onboarding state – partial saves", () => {
  it("starts with empty completedSteps and profile as currentStep", () => {
    const initial: OnboardingState = { currentStep: "profile", completedSteps: [] };
    assert.equal(initial.currentStep, "profile");
    assert.equal(initial.completedSteps.length, 0);
  });

  it("advances from profile to media after completing profile step", () => {
    const state: OnboardingState = { currentStep: "profile", completedSteps: [] };
    const next = advanceOnboarding(state, "profile");
    assert.equal(next.currentStep, "media");
    assert.ok(next.completedSteps.includes("profile"));
  });

  it("advances from media to payout after completing media step", () => {
    const state: OnboardingState = { currentStep: "media", completedSteps: ["profile"] };
    const next = advanceOnboarding(state, "media");
    assert.equal(next.currentStep, "payout");
    assert.ok(next.completedSteps.includes("media"));
  });

  it("marks complete after payout step", () => {
    const state: OnboardingState = { currentStep: "payout", completedSteps: ["profile", "media"] };
    const next = advanceOnboarding(state, "payout");
    assert.equal(next.currentStep, "complete");
    assert.ok(next.completedSteps.includes("payout"));
  });

  it("does not duplicate completed steps on re-save", () => {
    const state: OnboardingState = { currentStep: "media", completedSteps: ["profile"] };
    const next = advanceOnboarding(state, "profile");
    const unique = new Set(next.completedSteps);
    assert.equal(unique.size, next.completedSteps.length);
  });
});

describe("CHORD-120 onboarding resume – back navigation", () => {
  it("resumes at profile when no steps completed", () => {
    const state: OnboardingState = { currentStep: "profile", completedSteps: [] };
    assert.equal(getResumeStep(state), "profile");
  });

  it("resumes at media when only profile is complete", () => {
    const state: OnboardingState = { currentStep: "media", completedSteps: ["profile"] };
    assert.equal(getResumeStep(state), "media");
  });

  it("resumes at payout when profile and media are complete", () => {
    const state: OnboardingState = { currentStep: "payout", completedSteps: ["profile", "media"] };
    assert.equal(getResumeStep(state), "payout");
  });

  it("returns complete when all steps done", () => {
    const state: OnboardingState = { currentStep: "complete", completedSteps: ["profile", "media", "payout"] };
    assert.equal(getResumeStep(state), "complete");
  });
});

describe("CHORD-120 media upload validation", () => {
  it("accepts valid JPEG within size limit", () => {
    const result = validateUpload({ type: "image/jpeg", size: 1024 * 1024 });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it("rejects unsupported MIME type", () => {
    const result = validateUpload({ type: "image/gif", size: 100 });
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /Unsupported type/);
  });

  it("rejects file exceeding size limit", () => {
    const result = validateUpload({ type: "image/png", size: MAX_SIZE_BYTES + 1 });
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /exceeds/);
  });

  it("accepts all allowed MIME types", () => {
    for (const type of ALLOWED_TYPES) {
      const result = validateUpload({ type, size: 1024 });
      assert.equal(result.valid, true);
    }
  });

  it("accumulates multiple errors", () => {
    const result = validateUpload({ type: "image/bmp", size: MAX_SIZE_BYTES + 1 });
    assert.ok(result.errors.length >= 2);
  });
});

describe("CHORD-120 partial save resilience", () => {
  it("preserves completed steps when navigating back", () => {
    let state: OnboardingState = { currentStep: "profile", completedSteps: [] };
    state = advanceOnboarding(state, "profile");
    assert.ok(state.completedSteps.includes("profile"));
    state = advanceOnboarding(state, "media");
    state = advanceOnboarding(state, "profile"); // re-save profile
    assert.ok(state.completedSteps.includes("media"));
  });

  it("handles out-of-order step completion gracefully", () => {
    const state: OnboardingState = { currentStep: "media", completedSteps: [] };
    const next = advanceOnboarding(state, "media");
    assert.ok(next.completedSteps.includes("media"));
    const resume = getResumeStep(next);
    assert.equal(resume, "profile"); // profile was never completed
  });

  it("step order is stable", () => {
    const nonComplete = STEPS.filter((s) => s !== "complete");
    assert.deepEqual(nonComplete, ["profile", "media", "payout"]);
  });
});

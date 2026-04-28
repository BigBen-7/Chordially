import { describe, it, expect } from "vitest";
import {
  getOnboardingState,
  submitProfileStep,
  submitMediaStep,
  submitPayoutStep,
  submitReviewStep,
  isOnboardingComplete,
} from "../onboarding-state-machine.js";

const uid = () => `artist-${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe("CHORD-111 onboarding state machine", () => {
  it("starts in not_started with all steps pending", () => {
    const state = getOnboardingState(uid());
    expect(state.status).toBe("not_started");
    expect(state.steps.every((s) => s.status === "pending")).toBe(true);
  });

  it("profile step completes with valid data", () => {
    const id = uid();
    const state = submitProfileStep(id, {
      stageName: "Nova Chords",
      genre: "Electronic",
      location: "Lagos",
    });
    const profile = state.steps.find((s) => s.step === "profile");
    expect(profile?.status).toBe("complete");
    expect(state.status).toBe("in_progress");
  });

  it("profile step blocks with missing required fields", () => {
    const id = uid();
    const state = submitProfileStep(id, { stageName: "", genre: "", location: "" });
    const profile = state.steps.find((s) => s.step === "profile");
    expect(profile?.status).toBe("blocked");
    expect(profile?.errors?.length).toBeGreaterThan(0);
    expect(state.status).toBe("blocked");
  });

  it("media step completes (optional fields)", () => {
    const id = uid();
    const state = submitMediaStep(id, {});
    const media = state.steps.find((s) => s.step === "media");
    expect(media?.status).toBe("complete");
  });

  it("payout step completes with valid Stellar key", () => {
    const id = uid();
    const state = submitPayoutStep(id, {
      walletAddress: "GCFX3GM2V4N2O5NFEZ5XGUV3VZL57BC4Q43SGV5WW6H2I6J53GVL5W7W",
    });
    const payout = state.steps.find((s) => s.step === "payout");
    expect(payout?.status).toBe("complete");
  });

  it("payout step blocks with invalid wallet address", () => {
    const id = uid();
    const state = submitPayoutStep(id, { walletAddress: "not-a-wallet" });
    const payout = state.steps.find((s) => s.step === "payout");
    expect(payout?.status).toBe("blocked");
    expect(payout?.errors?.length).toBeGreaterThan(0);
  });

  it("review step blocks if required steps are incomplete", () => {
    const id = uid();
    const state = submitReviewStep(id);
    const review = state.steps.find((s) => s.step === "review");
    expect(review?.status).toBe("blocked");
  });

  it("full happy path reaches complete status", () => {
    const id = uid();
    submitProfileStep(id, { stageName: "Nova", genre: "Jazz", location: "Accra" });
    submitMediaStep(id, { avatarUrl: "https://cdn.example.com/avatar.jpg" });
    submitPayoutStep(id, {
      walletAddress: "GCFX3GM2V4N2O5NFEZ5XGUV3VZL57BC4Q43SGV5WW6H2I6J53GVL5W7W",
    });
    const final = submitReviewStep(id);
    expect(final.status).toBe("complete");
    expect(isOnboardingComplete(id)).toBe(true);
  });

  it("state is resumable: partial progress is preserved", () => {
    const id = uid();
    submitProfileStep(id, { stageName: "Nova", genre: "Jazz", location: "Accra" });
    const resumed = getOnboardingState(id);
    const profile = resumed.steps.find((s) => s.step === "profile");
    expect(profile?.status).toBe("complete");
    expect(resumed.status).toBe("in_progress");
  });
});

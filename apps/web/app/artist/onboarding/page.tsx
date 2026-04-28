// CHORD-119: Onboarding with resume links – returns artist to last incomplete step
import { redirect } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { getArtist } from "../../../lib/artist";
import { getOnboardingState, getResumeStep, STEP_PATHS, STEPS } from "../../../lib/onboarding-state";
import Link from "next/link";
import { saveArtist } from "./actions";

export default function ArtistOnboardingPage({
  searchParams
}: {
  searchParams: { resume?: string };
}) {
  const state = getOnboardingState();

  // If artist has already completed the profile step and isn't explicitly on step 1,
  // redirect to their resume point
  if (searchParams.resume !== "1" && state.completedSteps.includes("profile")) {
    const resumeStep = getResumeStep(state);
    if (resumeStep !== "profile") {
      redirect(STEP_PATHS[resumeStep]);
    }
  }

  const artist = getArtist();
  const stepIndex = STEPS.indexOf("profile");

  return (
    <Shell
      title="Set up an artist profile."
      subtitle="This form is intentionally self-contained so product and design work can continue even before the profile API lands."
    >
      {/* Progress indicator with resume links */}
      <nav aria-label="Onboarding steps" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {STEPS.filter((s) => s !== "complete").map((step, i) => (
          <Link
            key={step}
            href={`${STEP_PATHS[step]}${step === "profile" ? "?resume=1" : ""}`}
            aria-current={step === "profile" ? "step" : undefined}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: 4,
              fontSize: 13,
              background: i <= stepIndex ? "#7c3aed" : "#1c1c26",
              color: "#fff",
              textDecoration: "none"
            }}
          >
            {i + 1}. {step.charAt(0).toUpperCase() + step.slice(1)}
            {state.completedSteps.includes(step) ? " ✓" : ""}
          </Link>
        ))}
      </nav>

      <Card title="Artist details">
        <form action={saveArtist} className="stack">
          <div className="stack">
            <label htmlFor="stageName">Stage name</label>
            <Input id="stageName" defaultValue={artist.stageName} name="stageName" required />
          </div>
          <div className="stack">
            <label htmlFor="slug">Profile slug</label>
            <Input id="slug" defaultValue={artist.slug} name="slug" required />
          </div>
          <div className="stack">
            <label htmlFor="city">City</label>
            <Input id="city" defaultValue={artist.city} name="city" required />
          </div>
          <div className="stack">
            <label htmlFor="genres">Genres</label>
            <Input id="genres" defaultValue={artist.genres} name="genres" required />
          </div>
          <div className="stack">
            <label htmlFor="wallet">Wallet</label>
            <Input id="wallet" defaultValue={artist.wallet} name="wallet" required />
          </div>
          <div className="stack">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" className="textarea" defaultValue={artist.bio} name="bio" required />
          </div>
          <button className="button" type="submit">
            Save and continue
          </button>
        </form>
      </Card>
    </Shell>
  );
}

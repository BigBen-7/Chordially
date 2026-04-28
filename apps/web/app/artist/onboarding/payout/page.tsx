// CHORD-119: Onboarding payout step
import { Shell } from "../../../../components/layout/shell";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { getArtist } from "../../../../lib/artist";
import { getOnboardingState, STEPS, STEP_PATHS } from "../../../../lib/onboarding-state";
import Link from "next/link";
import { savePayout } from "./actions";

export default function ArtistPayoutPage() {
  const artist = getArtist();
  const state = getOnboardingState();
  const stepIndex = STEPS.indexOf("payout");

  return (
    <Shell
      title="Set up payouts."
      subtitle="Connect your Stellar wallet to receive tips from fans."
    >
      {/* Progress indicator */}
      <nav aria-label="Onboarding steps" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {STEPS.filter((s) => s !== "complete").map((step, i) => (
          <Link
            key={step}
            href={`${STEP_PATHS[step]}${step === "profile" ? "?resume=1" : ""}`}
            aria-current={step === "payout" ? "step" : undefined}
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

      <Card title="Stellar wallet">
        <form action={savePayout} className="stack">
          <div className="stack">
            <label htmlFor="wallet">Wallet address</label>
            <Input
              id="wallet"
              name="wallet"
              defaultValue={artist.wallet}
              placeholder="G…"
              required
            />
            <p className="muted">Your public Stellar address. Tips will be sent here.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="button" type="submit">Complete setup</button>
            <Link href={STEP_PATHS.media} className="button button--secondary">Back</Link>
          </div>
        </form>
      </Card>
    </Shell>
  );
}

// CHORD-115: Profile preview mode before publishing
import { Shell } from "../../../../components/layout/shell";
import { Card } from "../../../../components/ui/card";
import { getArtist } from "../../../../lib/artist";
import { getArtistMedia } from "../../../../lib/artist-media";
import { getOnboardingState, STEPS, STEP_PATHS } from "../../../../lib/onboarding-state";
import Link from "next/link";
import { publishProfile } from "./actions";

export default function ArtistPreviewPage() {
  const artist = getArtist();
  const media = getArtistMedia();
  const state = getOnboardingState();
  const stepIndex = STEPS.indexOf("preview");

  const missingFields: string[] = [];
  if (!artist.stageName) missingFields.push("Stage name");
  if (!artist.bio) missingFields.push("Bio");
  if (!artist.wallet) missingFields.push("Wallet address");

  return (
    <Shell
      title="Preview your profile."
      subtitle="This is how fans will see your public artist page. Publish when you're ready."
    >
      {/* Progress indicator */}
      <nav aria-label="Onboarding steps" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {STEPS.filter((s) => s !== "complete").map((step, i) => (
          <Link
            key={step}
            href={`${STEP_PATHS[step]}${step === "profile" ? "?resume=1" : ""}`}
            aria-current={step === "preview" ? "step" : undefined}
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

      {/* Validation errors */}
      {missingFields.length > 0 && (
        <p role="alert" style={{ color: "#f87171", marginBottom: "1rem" }}>
          Missing required fields: {missingFields.join(", ")}. Please go back and complete them.
        </p>
      )}

      {/* Profile preview card */}
      <Card title="Public profile preview">
        {media.bannerUrl && (
          <img
            src={media.bannerUrl}
            alt="Banner"
            style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4, marginBottom: "1rem" }}
          />
        )}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
          {media.avatarUrl ? (
            <img
              src={media.avatarUrl}
              alt="Avatar"
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{ width: 64, height: 64, borderRadius: "50%", background: "#2d2d3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}
            >
              🎵
            </div>
          )}
          <div>
            <h2 style={{ margin: 0 }}>{artist.stageName || "—"}</h2>
            <p className="muted" style={{ margin: 0 }}>{artist.city}</p>
          </div>
        </div>
        {artist.genres && (
          <div style={{ marginBottom: "0.75rem" }}>
            {artist.genres.split(",").map((g) => (
              <span className="chip" key={g.trim()}>{g.trim()}</span>
            ))}
          </div>
        )}
        {artist.bio && <p>{artist.bio}</p>}
        <p className="muted" style={{ fontSize: 12 }}>
          Profile URL: /artists/{artist.slug || "your-slug"}
        </p>
      </Card>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <form action={publishProfile}>
          <button
            className="button"
            type="submit"
            disabled={missingFields.length > 0}
            aria-disabled={missingFields.length > 0}
          >
            Publish profile
          </button>
        </form>
        <Link href={STEP_PATHS.payout} className="button button--secondary">
          Back to payout
        </Link>
      </div>
    </Shell>
  );
}

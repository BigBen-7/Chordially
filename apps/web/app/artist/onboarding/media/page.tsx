// CHORD-114: Banner, avatar, and media asset upload UI for artists
import { Shell } from "../../../../components/layout/shell";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { getArtistMedia, ALLOWED_TYPES, MAX_SIZE_MB } from "../../../../lib/artist-media";
import { getOnboardingState, STEPS, STEP_PATHS } from "../../../../lib/onboarding-state";
import Link from "next/link";
import { saveMediaAssets } from "./actions";

export default function ArtistMediaUploadPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const media = getArtistMedia();
  const state = getOnboardingState();
  const stepIndex = STEPS.indexOf("media");

  return (
    <Shell
      title="Upload your media assets."
      subtitle="Add an avatar, banner, and gallery images to complete your artist profile."
    >
      {/* Progress indicator */}
      <nav aria-label="Onboarding steps" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {STEPS.filter((s) => s !== "complete").map((step, i) => (
          <Link
            key={step}
            href={STEP_PATHS[step]}
            aria-current={step === "media" ? "step" : undefined}
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
          </Link>
        ))}
      </nav>

      {searchParams.error ? (
        <p role="alert" style={{ color: "#f87171", marginBottom: "1rem" }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={saveMediaAssets} className="stack" encType="multipart/form-data">
        {/* Avatar */}
        <Card title="Avatar">
          <p className="muted">
            Square image, min 200×200 px, max {MAX_SIZE_MB} MB.
            Accepted: {ALLOWED_TYPES.map((t) => t.split("/")[1].toUpperCase()).join(", ")}.
          </p>
          <label className="stack">
            <span>Upload avatar</span>
            <input
              type="file"
              name="avatar"
              accept={ALLOWED_TYPES.join(",")}
              aria-label="Upload avatar image"
            />
          </label>
          <label className="stack" style={{ marginTop: "0.5rem" }}>
            <span>Or paste URL</span>
            <Input name="avatarUrl" defaultValue={media.avatarUrl} type="url" placeholder="https://example.com/avatar.jpg" />
          </label>
          {media.avatarUrl ? (
            <img
              src={media.avatarUrl}
              alt="Current avatar"
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", marginTop: "0.5rem" }}
            />
          ) : null}
        </Card>

        {/* Banner */}
        <Card title="Banner">
          <p className="muted">
            Landscape image, recommended 1200×400 px, max {MAX_SIZE_MB} MB.
          </p>
          <label className="stack">
            <span>Upload banner</span>
            <input
              type="file"
              name="banner"
              accept={ALLOWED_TYPES.join(",")}
              aria-label="Upload banner image"
            />
          </label>
          <label className="stack" style={{ marginTop: "0.5rem" }}>
            <span>Or paste URL</span>
            <Input name="bannerUrl" defaultValue={media.bannerUrl} type="url" placeholder="https://example.com/banner.jpg" />
          </label>
          {media.bannerUrl ? (
            <img
              src={media.bannerUrl}
              alt="Current banner"
              style={{ width: "100%", height: 80, objectFit: "cover", marginTop: "0.5rem", borderRadius: 4 }}
            />
          ) : null}
        </Card>

        {/* Gallery */}
        <Card title="Gallery (optional)">
          <p className="muted">Upload up to 5 additional images for your profile gallery.</p>
          <label className="stack">
            <span>Upload gallery images</span>
            <input
              type="file"
              name="gallery"
              accept={ALLOWED_TYPES.join(",")}
              multiple
              aria-label="Upload gallery images"
            />
          </label>
          <label className="stack" style={{ marginTop: "0.5rem" }}>
            <span>Or paste comma-separated URLs</span>
            <Input name="galleryUrls" defaultValue={media.gallery.join(", ")} placeholder="https://…, https://…" />
          </label>
        </Card>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="button" type="submit">Save and continue</button>
          <Link
            href={state.completedSteps.includes("media") ? STEP_PATHS.payout : "/artist/onboarding"}
            className="button button--secondary"
          >
            {state.completedSteps.includes("media") ? "Skip to payout" : "Back"}
          </Link>
        </div>
      </form>
    </Shell>
  );
}

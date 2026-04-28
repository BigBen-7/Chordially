"use server";

import { redirect } from "next/navigation";
import { getArtistMedia, setArtistMedia, validateUpload } from "../../../../lib/artist-media";
import { getOnboardingState, advanceOnboarding, setOnboardingState, STEP_PATHS } from "../../../../lib/onboarding-state";

export async function saveMediaAssets(formData: FormData) {
  const avatarFile = formData.get("avatar") as File | null;
  const bannerFile = formData.get("banner") as File | null;
  const galleryFiles = formData.getAll("gallery") as File[];

  const errors: string[] = [];

  if (avatarFile && avatarFile.size > 0) {
    const v = validateUpload({ type: avatarFile.type, size: avatarFile.size });
    if (!v.valid) errors.push(...v.errors.map((e) => `Avatar: ${e}`));
  }
  if (bannerFile && bannerFile.size > 0) {
    const v = validateUpload({ type: bannerFile.type, size: bannerFile.size });
    if (!v.valid) errors.push(...v.errors.map((e) => `Banner: ${e}`));
  }
  for (const f of galleryFiles) {
    if (f.size > 0) {
      const v = validateUpload({ type: f.type, size: f.size });
      if (!v.valid) errors.push(...v.errors.map((e) => `Gallery: ${e}`));
    }
  }

  if (errors.length > 0) {
    redirect(`/artist/onboarding/media?error=${encodeURIComponent(errors[0])}`);
    return;
  }

  // In demo mode: store URLs from hidden inputs (real upload would use presigned S3 URLs)
  const current = getArtistMedia();
  const avatarUrl = String(formData.get("avatarUrl") ?? current.avatarUrl).trim();
  const bannerUrl = String(formData.get("bannerUrl") ?? current.bannerUrl).trim();
  const galleryRaw = String(formData.get("galleryUrls") ?? "").trim();
  const gallery = galleryRaw ? galleryRaw.split(",").map((u) => u.trim()).filter(Boolean) : current.gallery;

  setArtistMedia({ avatarUrl, bannerUrl, gallery });

  // Advance onboarding state
  const state = getOnboardingState();
  const next = advanceOnboarding(state, "media");
  setOnboardingState(next);

  redirect(STEP_PATHS[next.currentStep]);
}

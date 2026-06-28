export interface OnboardingStep {
  id: string
  userId: string
  stepKey: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export const ONBOARDING_STEPS: Record<string, { key: string; label: string }> = {
  displayName: { key: "displayName", label: "Display name" },
  avatarUrl: { key: "avatarUrl", label: "Profile photo" },
  bio: { key: "bio", label: "Bio" },
  genre: { key: "genre", label: "Genre" },
  location: { key: "location", label: "Location" },
  tags: { key: "tags", label: "Tags" },
  bannerUrl: { key: "bannerUrl", label: "Banner image" },
  genrePrefs: { key: "genrePrefs", label: "Genre preferences" },
}

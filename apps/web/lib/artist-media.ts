// CHORD-114: Artist media asset store (cookie-backed for demo)
import { cookies } from "next/headers";

export interface ArtistMedia {
  avatarUrl: string;
  bannerUrl: string;
  gallery: string[];
}

const COOKIE = "chordially_artist_media";

const DEFAULT: ArtistMedia = {
  avatarUrl: "",
  bannerUrl: "",
  gallery: []
};

export function getArtistMedia(): ArtistMedia {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return DEFAULT;
  try {
    return JSON.parse(raw) as ArtistMedia;
  } catch {
    return DEFAULT;
  }
}

export function setArtistMedia(media: ArtistMedia) {
  cookies().set(COOKIE, JSON.stringify(media), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_SIZE_MB = 5;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface UploadValidation {
  valid: boolean;
  errors: string[];
}

export function validateUpload(file: { type: string; size: number }): UploadValidation {
  const errors: string[] = [];
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    errors.push(`Unsupported type ${file.type}. Use JPEG, PNG, or WebP.`);
  }
  if (file.size > MAX_SIZE_BYTES) {
    errors.push(`File exceeds ${MAX_SIZE_MB} MB limit.`);
  }
  return { valid: errors.length === 0, errors };
}

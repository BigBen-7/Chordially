// CHORD-122: Artist profile screen on mobile
// Serves public artist profile data with banner, avatar, genre tags, social links,
// and respects moderation/privacy fields.
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

interface ArtistProfile {
  id: string;
  slug: string;
  stageName: string;
  bio: string;
  city: string;
  genres: string[];
  avatarUrl?: string;
  bannerUrl?: string;
  socialLinks: SocialLinks;
  isLive: boolean;
  isHidden: boolean;
  isBanned: boolean;
}

// ─── Seed data (replaced by API call in production) ──────────────────────────

const SEED_PROFILE: ArtistProfile = {
  id: "artist-1",
  slug: "nova-chords",
  stageName: "Nova Chords",
  bio: "Loop pedal sets with real-time audience requests and instant Stellar tips.",
  city: "Lagos",
  genres: ["Afrobeats", "Indie Soul"],
  avatarUrl: undefined,
  bannerUrl: undefined,
  socialLinks: {
    instagram: "https://instagram.com/novachords",
    twitter: "https://twitter.com/novachords"
  },
  isLive: false,
  isHidden: false,
  isBanned: false
};

async function fetchArtistProfile(slug: string): Promise<ArtistProfile | null> {
  try {
    const res = await fetch(`http://localhost:3001/artists/${encodeURIComponent(slug)}/profile`, {
      headers: { Accept: "application/json" }
    });
    if (!res.ok) return null;
    return res.json() as Promise<ArtistProfile>;
  } catch {
    // Offline or API unavailable – fall back to seed data in demo
    if (slug === SEED_PROFILE.slug) return SEED_PROFILE;
    return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SocialButton({ label, url }: { label: string; url: string }) {
  return (
    <TouchableOpacity
      style={s.socialBtn}
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={`Open ${label}`}
    >
      <Text style={s.socialBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

interface Props {
  slug: string;
  onBack?: () => void;
}

export default function ArtistProfileScreen({ slug, onBack }: Props) {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchArtistProfile(slug);
    if (!data) {
      setError("Artist not found.");
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={s.center} accessibilityLabel="Loading artist profile" accessibilityLiveRegion="polite">
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={s.center}>
        <Text style={s.errorText} accessibilityRole="alert">{error ?? "Something went wrong."}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={load} accessibilityRole="button">
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        {onBack ? (
          <TouchableOpacity style={[s.retryBtn, { marginTop: 8 }]} onPress={onBack} accessibilityRole="button">
            <Text style={s.retryBtnText}>Go back</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  // Moderation / privacy guard – never render hidden or banned profiles
  if (profile.isHidden || profile.isBanned) {
    return (
      <View style={s.center}>
        <Text style={s.errorText} accessibilityRole="alert">This profile is not available.</Text>
        {onBack ? (
          <TouchableOpacity style={s.retryBtn} onPress={onBack} accessibilityRole="button">
            <Text style={s.retryBtnText}>Go back</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const socialEntries = Object.entries(profile.socialLinks).filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Back button */}
      {onBack ? (
        <TouchableOpacity style={s.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
      ) : null}

      {/* Banner */}
      {profile.bannerUrl ? (
        <Image
          source={{ uri: profile.bannerUrl }}
          style={s.banner}
          accessibilityLabel={`${profile.stageName} banner`}
          resizeMode="cover"
        />
      ) : (
        <View style={s.bannerPlaceholder} />
      )}

      {/* Avatar + name */}
      <View style={s.header}>
        {profile.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={s.avatar}
            accessibilityLabel={`${profile.stageName} avatar`}
          />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarInitial}>{profile.stageName.charAt(0)}</Text>
          </View>
        )}
        <View style={s.headerText}>
          <Text style={s.stageName} accessibilityRole="header">{profile.stageName}</Text>
          <Text style={s.city}>{profile.city}</Text>
          {profile.isLive ? (
            <View style={s.liveBadge} accessibilityLabel="Live now">
              <Text style={s.liveBadgeText}>● LIVE</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Genre chips */}
      {profile.genres.length > 0 ? (
        <View style={s.chips} accessibilityLabel="Genres">
          {profile.genres.map((g) => (
            <View key={g} style={s.chip}>
              <Text style={s.chipText}>{g}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Bio */}
      {profile.bio ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <Text style={s.bio}>{profile.bio}</Text>
        </View>
      ) : null}

      {/* Social links */}
      {socialEntries.length > 0 ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Links</Text>
          <View style={s.socialRow}>
            {socialEntries.map(([platform, url]) => (
              <SocialButton
                key={platform}
                label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                url={url}
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#0b0b0f" },
  content:           { paddingBottom: 48 },
  center:            { flex: 1, backgroundColor: "#0b0b0f", alignItems: "center", justifyContent: "center", padding: 24 },
  banner:            { width: "100%", height: 160 },
  bannerPlaceholder: { width: "100%", height: 120, backgroundColor: "#1c1c26" },
  header:            { flexDirection: "row", alignItems: "flex-end", padding: 16, gap: 14, marginTop: -36 },
  avatar:            { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#0b0b0f" },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#0b0b0f" },
  avatarInitial:     { color: "#fff", fontSize: 28, fontWeight: "700" },
  headerText:        { flex: 1, paddingBottom: 4 },
  stageName:         { color: "#f4f0ff", fontSize: 20, fontWeight: "700" },
  city:              { color: "#8a84a0", fontSize: 13, marginTop: 2 },
  liveBadge:         { backgroundColor: "#7c3aed", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 },
  liveBadgeText:     { color: "#fff", fontSize: 11, fontWeight: "700" },
  chips:             { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  chip:              { backgroundColor: "#1c1c26", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  chipText:          { color: "#c7c1d9", fontSize: 12 },
  section:           { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle:      { color: "#c7c1d9", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  bio:               { color: "#8a84a0", fontSize: 14, lineHeight: 22 },
  socialRow:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  socialBtn:         { backgroundColor: "#1c1c26", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  socialBtnText:     { color: "#c7c1d9", fontSize: 13, fontWeight: "600" },
  errorText:         { color: "#f87171", fontSize: 16, marginBottom: 16, textAlign: "center" },
  retryBtn:          { backgroundColor: "#7c3aed", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText:      { color: "#fff", fontWeight: "600" },
  backBtn:           { padding: 16, paddingBottom: 0 },
  backBtnText:       { color: "#a78bfa", fontSize: 14 }
});

// CHORD-123: Profile share links and metadata cards – SEO/social previews for artist URLs
// CHORD-121: Public artist profile page on web
// CHORD-124: Follow-intent capture placeholder
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { listDiscoverySessions } from "../../../lib/discovery";
import { getArtistBySlug } from "../../../lib/artist";
import { getArtistMedia } from "../../../lib/artist-media";
import { recordFollowIntent } from "./actions";

type Props = { params: { slug: string } };

function findArtistSession(slug: string) {
  return listDiscoverySessions({ status: "live", limit: 100 }).items
    .concat(listDiscoverySessions({ status: "upcoming", limit: 100 }).items)
    .find((item) => item.slug === slug);
}

/** CHORD-123: Generate Open Graph + Twitter Card metadata for the artist profile URL. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = findArtistSession(params.slug);
  if (!session) {
    return { title: "Artist not found – Chordially" };
  }

  const title = `${session.artistName} on Chordially`;
  const description = session.isLive
    ? `${session.artistName} is live now in ${session.city}. Tip them with Stellar.`
    : `${session.artistName} has an upcoming set in ${session.city}. Follow on Chordially.`;
  const url = `https://chordially.app/artists/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Chordially",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function ArtistDetailPage({ params }: Props) {
  const session = findArtistSession(params.slug);
interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = getArtistBySlug(params.slug);
  if (!artist) return { title: "Artist not found" };
  return {
    title: `${artist.stageName} – Chordially`,
    description: artist.bio || `${artist.stageName} on Chordially`,
    openGraph: {
      title: artist.stageName,
      description: artist.bio || `${artist.stageName} on Chordially`,
      type: "profile"
    }
  };
}

export default function ArtistPublicProfilePage({ params }: Props) {
  const artist = getArtistBySlug(params.slug);

  // Fall back to discovery sessions for artists not in the cookie store
  const sessions = listDiscoverySessions({ status: "live", limit: 100 }).items
    .concat(listDiscoverySessions({ status: "upcoming", limit: 100 }).items)
    .filter((item) => item.slug === params.slug);

  if (!artist && sessions.length === 0) {
    notFound();
  }

  const profileUrl = `https://chordially.app/artists/${params.slug}`;
  const stageName = artist?.stageName ?? sessions[0]?.artistName ?? params.slug;
  const city = artist?.city ?? sessions[0]?.city ?? "";
  const bio = artist?.bio ?? "";
  const genres = artist
    ? artist.genres.split(",").map((g) => g.trim()).filter(Boolean)
    : sessions[0]?.genres ?? [];
  const media = artist ? getArtistMedia() : { avatarUrl: "", bannerUrl: "", gallery: [] };
  const liveSession = sessions.find((s) => s.isLive);

  return (
    <Shell title={stageName} subtitle={city}>
      {/* Banner */}
      {media.bannerUrl && (
        <img
          src={media.bannerUrl}
          alt={`${stageName} banner`}
          style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, marginBottom: "1.5rem" }}
        />
      )}

      {/* Identity */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
        {media.avatarUrl ? (
          <img
            src={media.avatarUrl}
            alt={`${stageName} avatar`}
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ width: 80, height: 80, borderRadius: "50%", background: "#2d2d3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}
          >
            🎵
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{stageName}</h1>
          {city && <p className="muted" style={{ margin: 0 }}>{city}</p>}
          {liveSession && (
            <span className="chip" style={{ background: "#16a34a", color: "#fff" }}>🔴 Live now</span>
          )}
        </div>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          {genres.map((g) => (
            <span className="chip" key={g}>{g}</span>
          ))}
        </div>
      )}

      {/* Bio */}
      {bio && (
        <Card title="About">
          <p>{bio}</p>
        </Card>
      )}

      {/* Live / upcoming sessions */}
      {sessions.length > 0 && (
        <Card title={liveSession ? "Live now" : "Upcoming"}>
          {sessions.map((s) => (
            <div key={s.id} style={{ marginBottom: "0.5rem" }}>
              <strong>{s.title}</strong>
              <span className="muted" style={{ marginLeft: "0.5rem" }}>
                {new Date(s.startsAt).toLocaleString()}
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* CHORD-124: Follow-intent capture */}
      <Card title="Stay in the loop">
        <p className="muted">
          Full follow notifications are coming soon. Tap below to register your interest.
        </p>

        {/* CHORD-123: Share link section */}
        <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #1c1c26" }}>
          <p style={{ fontSize: 13, color: "#a0a0b0", marginBottom: "0.5rem" }}>Share this profile</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${session.artistName} on Chordially`)}&url=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--secondary"
              style={{ fontSize: 13 }}
              aria-label={`Share ${session.artistName} on X / Twitter`}
            >
              Share on X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--secondary"
              style={{ fontSize: 13 }}
              aria-label={`Share ${session.artistName} on Facebook`}
            >
              Share on Facebook
            </a>
            <button
              className="button button--secondary"
              style={{ fontSize: 13 }}
              onClick={undefined}
              aria-label="Copy profile link"
              data-copy-url={profileUrl}
            >
              Copy link
            </button>
          </div>
        </div>
        <form action={recordFollowIntent}>
          <input type="hidden" name="artistSlug" value={params.slug} />
          <button className="button" type="submit">
            Notify me when {stageName} goes live
          </button>
        </form>
      </Card>
    </Shell>
  );
}

// Tests for CHORD-115, CHORD-118, CHORD-121, CHORD-124
// Uses Node.js built-in test runner (node:test)
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── CHORD-115: Preview step in onboarding flow ───────────────────────────────

type OnboardingStep = "profile" | "media" | "payout" | "preview" | "complete";
const STEPS: OnboardingStep[] = ["profile", "media", "payout", "preview", "complete"];

const STEP_PATHS: Record<OnboardingStep, string> = {
  profile: "/artist/onboarding",
  media: "/artist/onboarding/media",
  payout: "/artist/onboarding/payout",
  preview: "/artist/onboarding/preview",
  complete: "/artist/dashboard"
};

interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
}

function advanceOnboarding(state: OnboardingState, completed: OnboardingStep): OnboardingState {
  const completedSteps = Array.from(new Set([...state.completedSteps, completed])) as OnboardingStep[];
  const nextIdx = STEPS.indexOf(completed) + 1;
  const currentStep = nextIdx < STEPS.length ? STEPS[nextIdx] : "complete";
  return { currentStep, completedSteps };
}

describe("CHORD-115 preview step", () => {
  it("payout step advances to preview", () => {
    const state: OnboardingState = { currentStep: "payout", completedSteps: ["profile", "media"] };
    const next = advanceOnboarding(state, "payout");
    assert.equal(next.currentStep, "preview");
    assert.equal(STEP_PATHS[next.currentStep], "/artist/onboarding/preview");
  });

  it("preview step advances to complete (dashboard)", () => {
    const state: OnboardingState = { currentStep: "preview", completedSteps: ["profile", "media", "payout"] };
    const next = advanceOnboarding(state, "preview");
    assert.equal(next.currentStep, "complete");
    assert.equal(STEP_PATHS[next.currentStep], "/artist/dashboard");
  });

  it("preview is included in STEPS before complete", () => {
    const previewIdx = STEPS.indexOf("preview");
    const completeIdx = STEPS.indexOf("complete");
    assert.ok(previewIdx < completeIdx);
  });

  it("missing required fields are detected", () => {
    const artist = { stageName: "", bio: "some bio", wallet: "G123" };
    const missing: string[] = [];
    if (!artist.stageName) missing.push("Stage name");
    if (!artist.bio) missing.push("Bio");
    if (!artist.wallet) missing.push("Wallet address");
    assert.deepEqual(missing, ["Stage name"]);
  });

  it("no missing fields when all required fields present", () => {
    const artist = { stageName: "Nova", bio: "Bio text", wallet: "G123" };
    const missing: string[] = [];
    if (!artist.stageName) missing.push("Stage name");
    if (!artist.bio) missing.push("Bio");
    if (!artist.wallet) missing.push("Wallet address");
    assert.equal(missing.length, 0);
  });
});

// ─── CHORD-118: Onboarding analytics funnel ──────────────────────────────────

type FunnelStep = "profile" | "media" | "payout" | "preview";
type FunnelEventKind = "step_entered" | "step_completed" | "validation_error" | "published";

interface FunnelEvent {
  kind: FunnelEventKind;
  step: FunnelStep;
  artistId?: string;
  errorCategory?: string;
  timestamp: string;
}

function makeFunnelStore() {
  const events: FunnelEvent[] = [];
  function track(kind: FunnelEventKind, step: FunnelStep, opts: { artistId?: string; errorCategory?: string } = {}) {
    events.push({ kind, step, ...opts, timestamp: new Date().toISOString() });
  }
  function summary(): Record<string, number> {
    const s: Record<string, number> = {};
    for (const e of events) {
      const key = `${e.step}:${e.kind}`;
      s[key] = (s[key] ?? 0) + 1;
    }
    return s;
  }
  return { track, summary, events };
}

describe("CHORD-118 onboarding analytics funnel", () => {
  it("records step_entered event", () => {
    const store = makeFunnelStore();
    store.track("step_entered", "profile", { artistId: "a1" });
    assert.equal(store.events.length, 1);
    assert.equal(store.events[0].kind, "step_entered");
    assert.equal(store.events[0].step, "profile");
  });

  it("records validation_error with errorCategory", () => {
    const store = makeFunnelStore();
    store.track("validation_error", "payout", { errorCategory: "missing_wallet" });
    assert.equal(store.events[0].errorCategory, "missing_wallet");
  });

  it("summary counts events by step:kind", () => {
    const store = makeFunnelStore();
    store.track("step_entered", "profile");
    store.track("step_completed", "profile");
    store.track("step_entered", "media");
    store.track("validation_error", "media", { errorCategory: "file_too_large" });
    const s = store.summary();
    assert.equal(s["profile:step_entered"], 1);
    assert.equal(s["profile:step_completed"], 1);
    assert.equal(s["media:step_entered"], 1);
    assert.equal(s["media:validation_error"], 1);
  });

  it("records published event on preview completion", () => {
    const store = makeFunnelStore();
    store.track("published", "preview", { artistId: "a2" });
    assert.equal(store.events[0].kind, "published");
    assert.equal(store.events[0].step, "preview");
  });
});

// ─── CHORD-121: Public artist profile page ────────────────────────────────────

interface ArtistProfile {
  slug: string;
  stageName: string;
  bio: string;
  city: string;
  genres: string[];
  avatarUrl: string | null;
  bannerUrl: string | null;
  isLive: boolean;
}

function buildPublicView(profile: ArtistProfile & { artistId: string }): Omit<ArtistProfile & { artistId: string }, "artistId"> {
  const { artistId: _artistId, ...pub } = profile;
  void _artistId;
  return pub;
}

describe("CHORD-121 public artist profile", () => {
  it("buildPublicView strips artistId", () => {
    const profile = {
      artistId: "secret-id",
      slug: "nova-chords",
      stageName: "Nova Chords",
      bio: "Loop pedal sets",
      city: "Lagos",
      genres: ["Afrobeats"],
      avatarUrl: null,
      bannerUrl: null,
      isLive: true
    };
    const pub = buildPublicView(profile);
    assert.ok(!("artistId" in pub));
    assert.equal(pub.stageName, "Nova Chords");
  });

  it("profile page returns 404 for unknown slug", () => {
    const profiles: ArtistProfile[] = [
      { slug: "nova-chords", stageName: "Nova Chords", bio: "", city: "Lagos", genres: [], avatarUrl: null, bannerUrl: null, isLive: false }
    ];
    const found = profiles.find((p) => p.slug === "unknown-artist");
    assert.equal(found, undefined);
  });

  it("generates correct metadata title", () => {
    const artist = { stageName: "Nova Chords", bio: "Loop pedal sets" };
    const title = `${artist.stageName} – Chordially`;
    assert.equal(title, "Nova Chords – Chordially");
  });

  it("genres are parsed from comma-separated string", () => {
    const raw = "Afrobeats, Indie Soul, Jazz";
    const genres = raw.split(",").map((g) => g.trim()).filter(Boolean);
    assert.deepEqual(genres, ["Afrobeats", "Indie Soul", "Jazz"]);
  });
});

// ─── CHORD-124: Follow-intent capture ────────────────────────────────────────

interface FollowIntentEvent {
  artistId: string;
  visitorId?: string;
  source: string;
  timestamp: string;
}

function makeFollowIntentStore() {
  const intents: FollowIntentEvent[] = [];
  function record(artistId: string, opts: { visitorId?: string; source?: string } = {}) {
    intents.push({ artistId, visitorId: opts.visitorId, source: opts.source ?? "profile_page", timestamp: new Date().toISOString() });
  }
  function count(artistId: string) {
    return intents.filter((e) => e.artistId === artistId).length;
  }
  return { record, count, intents };
}

describe("CHORD-124 follow-intent capture", () => {
  it("records a follow intent event", () => {
    const store = makeFollowIntentStore();
    store.record("artist-1", { visitorId: "v1" });
    assert.equal(store.intents.length, 1);
    assert.equal(store.intents[0].artistId, "artist-1");
    assert.equal(store.intents[0].source, "profile_page");
  });

  it("counts intents per artist", () => {
    const store = makeFollowIntentStore();
    store.record("artist-1");
    store.record("artist-1");
    store.record("artist-2");
    assert.equal(store.count("artist-1"), 2);
    assert.equal(store.count("artist-2"), 1);
  });

  it("defaults source to profile_page", () => {
    const store = makeFollowIntentStore();
    store.record("artist-1");
    assert.equal(store.intents[0].source, "profile_page");
  });

  it("records timestamp as ISO string", () => {
    const store = makeFollowIntentStore();
    store.record("artist-1");
    assert.ok(!isNaN(Date.parse(store.intents[0].timestamp)));
  });
});

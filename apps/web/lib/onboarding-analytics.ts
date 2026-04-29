// CHORD-118: Onboarding analytics funnel
// Records step entry, completion, and validation errors to measure drop-off.

export type OnboardingFunnelStep = "profile" | "media" | "payout" | "preview";
export type OnboardingEventKind = "step_entered" | "step_completed" | "validation_error" | "published";

export interface OnboardingFunnelEvent {
  kind: OnboardingEventKind;
  step: OnboardingFunnelStep;
  artistId?: string;
  errorCategory?: string;
  deviceType?: string;
  timestamp: string;
}

// In-process store; replace with a real analytics sink (e.g. PostHog, Segment) in production.
const events: OnboardingFunnelEvent[] = [];

function deviceType(): string {
  if (typeof navigator === "undefined") return "server";
  return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

export function trackOnboardingEvent(
  kind: OnboardingEventKind,
  step: OnboardingFunnelStep,
  opts: { artistId?: string; errorCategory?: string } = {}
): void {
  const event: OnboardingFunnelEvent = {
    kind,
    step,
    artistId: opts.artistId,
    errorCategory: opts.errorCategory,
    deviceType: deviceType(),
    timestamp: new Date().toISOString()
  };
  events.push(event);
  // Structured log for observability
  console.log("[onboarding-funnel]", JSON.stringify(event));
}

/** Returns a copy of all recorded funnel events (for tests / admin views). */
export function getFunnelEvents(): OnboardingFunnelEvent[] {
  return [...events];
}

/** Drop-off summary: events grouped by step and kind. */
export function getFunnelSummary(): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const e of events) {
    const key = `${e.step}:${e.kind}`;
    summary[key] = (summary[key] ?? 0) + 1;
  }
  return summary;
}

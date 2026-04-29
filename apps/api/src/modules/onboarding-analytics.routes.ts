// CHORD-118: Onboarding analytics funnel – API route
import type { FastifyInstance } from "fastify";

type FunnelStep = "profile" | "media" | "payout" | "preview";
type FunnelEventKind = "step_entered" | "step_completed" | "validation_error" | "published";

interface FunnelEvent {
  kind: FunnelEventKind;
  step: FunnelStep;
  artistId?: string;
  errorCategory?: string;
  deviceType?: string;
  timestamp: string;
}

const funnelEvents: FunnelEvent[] = [];

export async function onboardingAnalyticsRoutes(app: FastifyInstance) {
  // POST /onboarding/analytics – ingest a funnel event
  app.post<{ Body: Omit<FunnelEvent, "timestamp"> }>(
    "/onboarding/analytics",
    async (request, reply) => {
      const { kind, step, artistId, errorCategory, deviceType } = request.body;
      if (!kind || !step) {
        return reply.status(400).send({ error: "kind and step are required" });
      }
      const event: FunnelEvent = {
        kind,
        step,
        artistId,
        errorCategory,
        deviceType,
        timestamp: new Date().toISOString()
      };
      funnelEvents.push(event);
      app.log.info({ msg: "onboarding_funnel", ...event });
      return reply.status(201).send({ ok: true });
    }
  );

  // GET /onboarding/analytics/summary – drop-off summary (admin/internal)
  app.get("/onboarding/analytics/summary", async (_request, reply) => {
    const summary: Record<string, number> = {};
    for (const e of funnelEvents) {
      const key = `${e.step}:${e.kind}`;
      summary[key] = (summary[key] ?? 0) + 1;
    }
    return reply.send({ summary, total: funnelEvents.length });
  });
}

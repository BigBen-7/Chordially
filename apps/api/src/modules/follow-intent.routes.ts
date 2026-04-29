// CHORD-124: Follow-intent capture – records interest before a full follow system ships
import type { FastifyInstance } from "fastify";

interface FollowIntentEvent {
  artistId: string;
  visitorId?: string;
  source: string;
  timestamp: string;
}

// In-process store; replace with DB persistence in production.
const intents: FollowIntentEvent[] = [];

export async function followIntentRoutes(app: FastifyInstance) {
  // POST /artists/:artistId/follow-intent
  app.post<{ Params: { artistId: string }; Body: { visitorId?: string; source?: string } }>(
    "/artists/:artistId/follow-intent",
    async (request, reply) => {
      const { artistId } = request.params;
      const { visitorId, source = "profile_page" } = request.body ?? {};

      const event: FollowIntentEvent = {
        artistId,
        visitorId,
        source,
        timestamp: new Date().toISOString()
      };
      intents.push(event);
      app.log.info({ msg: "follow_intent", ...event });
      return reply.status(201).send({ ok: true, message: "Interest recorded. Follow feature coming soon." });
    }
  );

  // GET /artists/:artistId/follow-intent/count (internal/admin)
  app.get<{ Params: { artistId: string } }>(
    "/artists/:artistId/follow-intent/count",
    async (request, reply) => {
      const count = intents.filter((e) => e.artistId === request.params.artistId).length;
      return reply.send({ artistId: request.params.artistId, count });
    }
  );
}

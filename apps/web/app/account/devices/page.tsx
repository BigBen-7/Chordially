// CHORD-104: Device and session management page
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { revokeDeviceSession } from "./actions";

interface DeviceSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  lastSeenAt: string;
}

// Seed data for standalone web demo; replaced by API data when token is present
const SEED_SESSIONS: DeviceSession[] = [
  {
    id: "sess-1",
    deviceName: "Chrome on macOS",
    ipAddress: "192.168.1.10",
    createdAt: "2026-04-20T10:00:00Z",
    lastSeenAt: "2026-04-28T18:30:00Z"
  },
  {
    id: "sess-2",
    deviceName: "Chordially iOS App",
    ipAddress: "10.0.0.5",
    createdAt: "2026-04-22T08:15:00Z",
    lastSeenAt: "2026-04-27T22:00:00Z"
  }
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function DevicesPage() {
  const sessions = SEED_SESSIONS;

  return (
    <Shell
      title="Active sessions."
      subtitle="Review and revoke access from devices you no longer recognise."
    >
      <Card title="Signed-in devices">
        {sessions.length === 0 ? (
          <p className="muted">No active sessions found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  background: "#16131f",
                  borderRadius: "8px"
                }}
              >
                <div className="stack" style={{ gap: "0.25rem" }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{session.deviceName}</p>
                  <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                    IP: {session.ipAddress}
                  </p>
                  <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                    Last seen: {formatDate(session.lastSeenAt)}
                  </p>
                </div>
                <form action={revokeDeviceSession}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    className="button button--secondary"
                    type="submit"
                    aria-label={`Revoke session for ${session.deviceName}`}
                    style={{ fontSize: "0.85rem" }}
                  >
                    Revoke
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Shell>
  );
}

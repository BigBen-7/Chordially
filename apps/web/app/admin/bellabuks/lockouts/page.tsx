// CHORD-105: Account lockout review tooling for support admins
import { AdminShell } from "../../../../components/layout/admin-shell";
import { requireAdmin } from "../../../../lib/admin-auth";
import { unlockAccountAction } from "./actions";

interface LockoutRecord {
  userId: string;
  email: string;
  failedAttempts: number;
  lockedAt: string;
  lockReason: string;
  unlockAfter: string;
}

// Seed data for standalone demo; replaced by API data when admin token is present
const SEED_LOCKOUTS: LockoutRecord[] = [
  {
    userId: "u-abc",
    email: "ada@example.com",
    failedAttempts: 5,
    lockedAt: "2026-04-28T14:00:00Z",
    lockReason: "5 consecutive failed login attempts",
    unlockAfter: "2026-04-28T14:15:00Z"
  },
  {
    userId: "u-def",
    email: "jay@example.com",
    failedAttempts: 7,
    lockedAt: "2026-04-28T20:30:00Z",
    lockReason: "5 consecutive failed login attempts",
    unlockAfter: "2026-04-28T20:45:00Z"
  }
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function LockoutsPage({
  searchParams
}: {
  searchParams: { unlocked?: string };
}) {
  requireAdmin();

  const lockouts = SEED_LOCKOUTS;

  return (
    <AdminShell
      title="Account lockouts"
      subtitle="Review locked accounts and manually unlock users after verification."
    >
      {searchParams.unlocked ? (
        <p role="status" className="muted" style={{ marginBottom: "1rem" }}>
          Account <strong>{searchParams.unlocked}</strong> has been unlocked.
        </p>
      ) : null}

      {lockouts.length === 0 ? (
        <p className="muted">No locked accounts at this time.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Email", "Failed attempts", "Locked at", "Lock reason", "Auto-unlock at", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      color: "#8a84a0",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid #2e2b3a",
                      fontSize: "0.8rem"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lockouts.map((record) => (
                <tr key={record.email} style={{ borderBottom: "1px solid #1a1726" }}>
                  <td style={{ padding: "10px 12px", color: "#f4f0ff", fontSize: "0.9rem" }}>
                    {record.email}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#c7c1d9", fontSize: "0.85rem" }}>
                    {record.failedAttempts}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#8a84a0", fontSize: "0.8rem" }}>
                    {formatDate(record.lockedAt)}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#c7c1d9", fontSize: "0.85rem" }}>
                    {record.lockReason}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#8a84a0", fontSize: "0.8rem" }}>
                    {formatDate(record.unlockAfter)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <form action={unlockAccountAction}>
                      <input type="hidden" name="email" value={record.email} />
                      <button
                        className="button button--secondary"
                        type="submit"
                        style={{ fontSize: "0.8rem" }}
                        aria-label={`Unlock account for ${record.email}`}
                      >
                        Unlock
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

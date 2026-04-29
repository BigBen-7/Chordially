"use server";

// CHORD-124: Follow-intent capture – records interest before a full follow system ships
export async function recordFollowIntent(formData: FormData) {
  const artistSlug = String(formData.get("artistSlug") ?? "").trim();
  if (!artistSlug) return;
  // Structured log for observability; replace with DB/analytics sink in production.
  console.log("[follow-intent]", JSON.stringify({ artistSlug, timestamp: new Date().toISOString() }));
}

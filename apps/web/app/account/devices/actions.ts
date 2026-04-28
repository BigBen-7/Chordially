"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function revokeDeviceSession(formData: FormData) {
  const sessionId = formData.get("sessionId");
  if (!sessionId || typeof sessionId !== "string") {
    redirect("/account/devices");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("chordially_token")?.value;

  if (token) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    await fetch(`${apiUrl}/auth/devices/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => null);
  }

  redirect("/account/devices?revoked=1");
}

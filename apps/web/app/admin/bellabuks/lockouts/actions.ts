"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";

export async function unlockAccountAction(formData: FormData) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const email = formData.get("email");
  if (!email || typeof email !== "string") {
    redirect("/admin/bellabuks/lockouts");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("chordially_token")?.value;

  if (token) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    await fetch(`${apiUrl}/auth/admin/lockouts/${encodeURIComponent(email)}/unlock`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => null);
  }

  redirect(`/admin/bellabuks/lockouts?unlocked=${encodeURIComponent(email)}`);
}

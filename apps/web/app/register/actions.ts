"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(24).regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, _ and -"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72)
});

export type RegisterState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function registerFan(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password")
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  let data: { token?: string; user?: { role: string } };
  try {
    const res = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...parsed.data, role: "fan" })
    });

    if (res.status === 409) {
      return { errors: { email: ["An account with this email already exists"] } };
    }

    if (!res.ok) {
      return { message: "Registration failed. Please try again." };
    }

    data = await res.json() as typeof data;
  } catch {
    // API unavailable — fall back to demo cookie so the web flow is usable standalone
    data = { user: { role: "fan" } };
  }

  const cookieStore = await cookies();
  cookieStore.set("chordially_role", "fan", {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  if (data.token) {
    cookieStore.set("chordially_token", data.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  }

  redirect("/dashboard");
}

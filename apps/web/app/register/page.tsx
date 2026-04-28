// CHORD-101: Fan registration web flow with server validation
"use client";

import { useActionState } from "react";
import { Shell } from "../../components/layout/shell";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { registerFan, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerFan, initialState);

  return (
    <Shell
      title="Create your fan account."
      subtitle="Join Chordially to discover artists, attend live sessions, and send tips."
    >
      <Card title="Sign up">
        <form action={action} className="stack" aria-label="Fan registration form">
          {state.message ? (
            <p className="muted" role="alert" style={{ color: "var(--color-error, #FF3B30)" }}>
              {state.message}
            </p>
          ) : null}

          <div className="stack">
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby={state.errors?.email ? "email-error" : undefined}
            />
            {state.errors?.email ? (
              <p id="email-error" role="alert" className="muted" style={{ color: "var(--color-error, #FF3B30)", fontSize: "0.85rem" }}>
                {state.errors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="stack">
            <label htmlFor="username">Username</label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              aria-describedby={state.errors?.username ? "username-error" : undefined}
            />
            {state.errors?.username ? (
              <p id="username-error" role="alert" className="muted" style={{ color: "var(--color-error, #FF3B30)", fontSize: "0.85rem" }}>
                {state.errors.username[0]}
              </p>
            ) : null}
          </div>

          <div className="stack">
            <label htmlFor="password">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-describedby={state.errors?.password ? "password-error" : undefined}
            />
            {state.errors?.password ? (
              <p id="password-error" role="alert" className="muted" style={{ color: "var(--color-error, #FF3B30)", fontSize: "0.85rem" }}>
                {state.errors.password[0]}
              </p>
            ) : null}
          </div>

          <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Creating account…" : "Create account"}
          </button>

          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </form>
      </Card>
    </Shell>
  );
}

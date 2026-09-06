"use client";

import { Eye, EyeOff, LoaderCircle, Lock, LogIn, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    try { await login(String(data.get("email")), String(data.get("password"))); router.replace("/dashboard"); }
    catch (caught) { setError(authErrorMessage(caught, "login")); setBusy(false); }
  }

  return <form className="auth-form" onSubmit={submit} aria-busy={busy}>
    <div className="auth-field"><label htmlFor="login-email">Email address</label><div><Mail aria-hidden="true" /><input id="login-email" maxLength={254} autoCapitalize="none" autoComplete="email" inputMode="email" name="email" placeholder="researcher@observatory.org" required type="email" /></div></div>
    <div className="auth-field"><label htmlFor="login-password">Password</label><div><Lock aria-hidden="true" /><input id="login-password" maxLength={128} autoComplete="current-password" name="password" placeholder="Enter your password" required type={showPassword ? "text" : "password"} /><button aria-controls="login-password" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}<span>{busy ? "Signing in…" : "Sign in"}</span></button>
  </form>;
}

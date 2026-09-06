"use client";

import { Eye, EyeOff, LoaderCircle, Lock, Mail, User, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";

export function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirm"))) { setError("Passwords do not match."); setBusy(false); return; }
    try { await signup(String(data.get("email")), String(data.get("displayName")), password); router.replace("/dashboard"); }
    catch (caught) { setError(authErrorMessage(caught, "register")); setBusy(false); }
  }

  return <form className="auth-form" onSubmit={submit} aria-busy={busy}>
    <div className="auth-field"><label htmlFor="signup-name">Display name</label><div><User aria-hidden="true" /><input id="signup-name" maxLength={80} autoComplete="name" name="displayName" placeholder="Your name" required type="text" /></div></div>
    <div className="auth-field"><label htmlFor="signup-email">Email address</label><div><Mail aria-hidden="true" /><input id="signup-email" maxLength={254} autoCapitalize="none" autoComplete="email" inputMode="email" name="email" placeholder="researcher@observatory.org" required type="email" /></div></div>
    <div className="auth-field"><label htmlFor="signup-password">Password <span>12–128 characters</span></label><div><Lock aria-hidden="true" /><input id="signup-password" minLength={12} maxLength={128} autoComplete="new-password" name="password" placeholder="Create a password" required type={showPassword ? "text" : "password"} aria-describedby="password-requirements" /><button aria-controls="signup-password signup-confirm" aria-label={showPassword ? "Hide passwords" : "Show passwords"} aria-pressed={showPassword} type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div><p id="password-requirements">Backend requirement: at least 12 characters.</p></div>
    <div className="auth-field"><label htmlFor="signup-confirm">Confirm password</label><div><Lock aria-hidden="true" /><input id="signup-confirm" minLength={12} maxLength={128} autoComplete="new-password" name="confirm" placeholder="Repeat your password" required type={showPassword ? "text" : "password"} /></div></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}<span>{busy ? "Creating account…" : "Create account"}</span></button>
  </form>;
}

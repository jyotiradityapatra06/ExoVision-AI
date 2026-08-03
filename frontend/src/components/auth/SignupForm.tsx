"use client";

import { LoaderCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/button";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirm"))) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      await signup(String(data.get("email")), String(data.get("displayName")), password);
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Account creation failed.");
      setBusy(false);
    }
  }

  return <form className="space-y-5" onSubmit={submit}>
    <Field autoComplete="name" label="Name" name="displayName" type="text" />
    <Field autoComplete="email" label="Email" name="email" type="email" />
    <Field autoComplete="new-password" label="Password" minLength={12} name="password" type="password" />
    <Field autoComplete="new-password" label="Confirm password" minLength={12} name="confirm" type="password" />
    {error && <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">{error}</p>}
    <Button className="w-full" disabled={busy} size="lg" type="submit">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Create account</Button>
    <p className="text-center text-sm text-slate-400">Already registered? <Link className="text-sky-300 hover:text-sky-200" href="/auth/login">Sign in</Link></p>
  </form>;
}

function Field(props: { label: string; name: string; type: string; autoComplete: string; minLength?: number }) {
  const { label, ...inputProps } = props;
  return <label className="block text-sm font-medium text-slate-300">{label}<input className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-sky-300/60" required {...inputProps} /></label>;
}

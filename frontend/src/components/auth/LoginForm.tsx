"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/button";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get("email")), String(data.get("password")));
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign in failed.");
      setBusy(false);
    }
  }

  return <form className="space-y-5" onSubmit={submit}>
    <Field label="Email" name="email" type="email" />
    <Field label="Password" name="password" type="password" />
    {error && <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">{error}</p>}
    <Button className="w-full" disabled={busy} size="lg" type="submit">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Sign in</Button>
    <p className="text-center text-sm text-slate-400">New to ExoVision? <Link className="text-sky-300 hover:text-sky-200" href="/auth/signup">Create an account</Link></p>
  </form>;
}

function Field({ label, name, type }: { label: string; name: string; type: string }) {
  return <label className="block text-sm font-medium text-slate-300">{label}<input autoComplete={name === "password" ? "current-password" : "email"} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-sky-300/60" name={name} required type={type} /></label>;
}

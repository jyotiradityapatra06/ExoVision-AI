"use client";

import { Eye, EyeOff, LoaderCircle, Lock, LogIn, Mail } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get("email")), String(data.get("password")));
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Authentication failed. Check your credentials.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
          Researcher Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-cyan-900/40 bg-[#04091a]/90 pl-10 pr-4 py-3 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:shadow-cyan-sm"
            name="email"
            placeholder="astronomer@observatory.org"
            required
            type="email"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Access Key / Password
          </label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
          <input
            autoComplete="current-password"
            className="w-full rounded-xl border border-cyan-900/40 bg-[#04091a]/90 pl-10 pr-10 py-3 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:shadow-cyan-sm"
            name="password"
            placeholder="••••••••••••"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-cyan-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-xs text-rose-200" role="alert">
          {error}
        </p>
      )}

      <Button className="w-full shadow-cyan-glow" disabled={busy} size="lg" type="submit">
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        <span>Authenticate Mission Control</span>
      </Button>

      <p className="text-center font-mono text-xs text-slate-400 pt-2">
        New to ExoVision AI?{" "}
        <Link className="text-cyan-300 font-bold hover:underline" href="/auth/signup">
          Initialize Account
        </Link>
      </p>
    </form>
  );
}

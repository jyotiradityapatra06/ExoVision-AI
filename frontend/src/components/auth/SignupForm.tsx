"use client";

import { Eye, EyeOff, LoaderCircle, Lock, Mail, User, UserPlus } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
      setError(caught instanceof ApiError ? caught.message : "Account registration failed.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Full Name / Handle
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
          <input
            autoComplete="name"
            className="w-full rounded-xl border border-cyan-900/40 bg-[#04091a]/90 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:shadow-cyan-sm"
            name="displayName"
            placeholder="Dr. Eleanor Arroway"
            required
            type="text"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Observatory Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-cyan-900/40 bg-[#04091a]/90 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:shadow-cyan-sm"
            name="email"
            placeholder="eleanor@setilabs.org"
            required
            type="email"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Access Password (Min 12 Chars)
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-cyan-900/40 bg-[#04091a]/90 pl-10 pr-10 py-2.5 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:shadow-cyan-sm"
            minLength={12}
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

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-cyan-900/40 bg-[#04091a]/90 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:shadow-cyan-sm"
            minLength={12}
            name="confirm"
            placeholder="••••••••••••"
            required
            type="password"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-xs text-rose-200" role="alert">
          {error}
        </p>
      )}

      <Button className="w-full shadow-cyan-glow" disabled={busy} size="lg" type="submit">
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        <span>Register Research Space</span>
      </Button>

      <p className="text-center font-mono text-xs text-slate-400 pt-2">
        Already registered?{" "}
        <Link className="text-cyan-300 font-bold hover:underline" href="/auth/login">
          Sign In
        </Link>
      </p>
    </form>
  );
}

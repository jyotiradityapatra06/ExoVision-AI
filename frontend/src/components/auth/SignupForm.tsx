"use client";

import { AlertCircle, Eye, EyeOff, LoaderCircle, Lock, Mail, User, UserPlus } from "lucide-react";
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
      setError(authErrorMessage(caught, "register"));
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} aria-busy={busy}>
      <div className="space-y-1.5">
        <label htmlFor="signup-name" className="block text-xs font-medium text-zinc-300">
          Display name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <User className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            id="signup-name"
            name="displayName"
            type="text"
            required
            autoComplete="name"
            maxLength={80}
            placeholder="Dr. Eleanor Arroway"
            className="w-full rounded-md border border-white/[0.10] bg-[#0d1015] pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="block text-xs font-medium text-zinc-300">
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
            maxLength={254}
            placeholder="researcher@observatory.org"
            className="w-full rounded-md border border-white/[0.10] bg-[#0d1015] pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="signup-password" className="block text-xs font-medium text-zinc-300">
            Password
          </label>
          <span className="text-[10px] font-mono text-zinc-500">12–128 characters</span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            placeholder="Create a strong password"
            aria-describedby="password-requirements"
            className="w-full rounded-md border border-white/[0.10] bg-[#0d1015] pl-9 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-controls="signup-password signup-confirm"
            aria-label={showPassword ? "Hide passwords" : "Show passwords"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        <p id="password-requirements" className="text-[11px] text-zinc-500 font-mono">
          Backend requirement: at least 12 characters.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-confirm" className="block text-xs font-medium text-zinc-300">
          Confirm password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            id="signup-confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            placeholder="Repeat your password"
            className="w-full rounded-md border border-white/[0.10] bg-[#0d1015] pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-md border border-rose-500/30 bg-rose-500/[0.08] p-3 text-xs text-rose-300" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" aria-hidden="true" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full min-h-[42px] rounded-md bg-[#e6f6fa] hover:bg-white text-[#081216] font-semibold text-xs transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50 disabled:cursor-wait shadow-sm mt-2"
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
        <span>{busy ? "Creating account…" : "Create Research Account"}</span>
      </button>
    </form>
  );
}

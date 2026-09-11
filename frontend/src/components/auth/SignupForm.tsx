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
      {/* Display Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="signup-name"
          className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold"
        >
          Display name
        </label>
        <div className="group relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.12] hover:border-white/[0.22] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all duration-200">
          <User className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors ml-3.5 pointer-events-none shrink-0" />
          <input
            id="signup-name"
            maxLength={80}
            autoComplete="name"
            name="displayName"
            placeholder="Dr. Eleanor Arroway"
            required
            type="text"
            className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* Email Address */}
      <div className="space-y-1.5">
        <label
          htmlFor="signup-email"
          className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold"
        >
          Email address
        </label>
        <div className="group relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.12] hover:border-white/[0.22] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all duration-200">
          <Mail className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors ml-3.5 pointer-events-none shrink-0" />
          <input
            id="signup-email"
            maxLength={254}
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            name="email"
            placeholder="researcher@observatory.org"
            required
            type="email"
            className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="signup-password"
            className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold"
          >
            Password
          </label>
          <span className="text-[10px] font-mono text-zinc-500">12–128 characters</span>
        </div>
        <div className="group relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.12] hover:border-white/[0.22] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all duration-200">
          <Lock className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors ml-3.5 pointer-events-none shrink-0" />
          <input
            id="signup-password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            name="password"
            placeholder="Create a strong password"
            required
            type={showPassword ? "text" : "password"}
            aria-describedby="password-requirements"
            className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
          />
          <button
            type="button"
            aria-controls="signup-password signup-confirm"
            aria-label={showPassword ? "Hide passwords" : "Show passwords"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
            className="px-3 py-2.5 text-zinc-500 hover:text-zinc-200 transition-colors focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p id="password-requirements" className="text-[10px] font-mono text-zinc-500">
          Backend security requirement: minimum 12 characters.
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="signup-confirm"
          className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold"
        >
          Confirm password
        </label>
        <div className="group relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.12] hover:border-white/[0.22] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all duration-200">
          <Lock className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors ml-3.5 pointer-events-none shrink-0" />
          <input
            id="signup-confirm"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            name="confirm"
            placeholder="Repeat your password"
            required
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2.5 backdrop-blur-md"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={busy}
        className="group/btn relative w-full py-3.5 px-6 rounded-xl font-semibold text-xs tracking-wide bg-[#F4F1EA] text-[#090D0F] hover:bg-white transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:shadow-[0_0_32px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden mt-2"
      >
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-[300%] transition-transform duration-700 pointer-events-none" />
        {busy ? (
          <LoaderCircle className="w-4 h-4 animate-spin text-zinc-950" aria-hidden="true" />
        ) : (
          <UserPlus className="w-4 h-4 text-zinc-950 transition-transform duration-200 group-hover/btn:scale-110" aria-hidden="true" />
        )}
        <span className="relative z-10 font-sans">
          {busy ? "Registering research workspace…" : "Create Research Account"}
        </span>
      </button>
    </form>
  );
}

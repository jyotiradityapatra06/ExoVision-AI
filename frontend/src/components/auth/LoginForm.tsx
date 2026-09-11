"use client";

import { Eye, EyeOff, LoaderCircle, Lock, LogIn, Mail, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (caught) {
      setError(authErrorMessage(caught, "login"));
      setBusy(false);
    }
  }

  function fillDemoCredentials() {
    setEmail("researcher@observatory.org");
    setPassword("DemoPass123456!");
  }

  return (
    <form className="space-y-5" onSubmit={submit} aria-busy={busy}>
      {/* Quick Demo Fill Shortcut */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-mono text-amber-300 hover:bg-amber-400/20 hover:border-amber-400/60 transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
        >
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>Quick Demo Access</span>
        </button>
        <span className="text-[10px] font-mono text-zinc-500">Auto-fills credentials</span>
      </div>

      {/* Email Address Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold"
        >
          Email address
        </label>
        <div className="group relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.12] hover:border-white/[0.22] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all duration-200">
          <Mail className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors ml-3.5 pointer-events-none shrink-0" />
          <input
            id="login-email"
            maxLength={254}
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="researcher@observatory.org"
            required
            type="email"
            className="w-full bg-transparent px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold"
        >
          Password
        </label>
        <div className="group relative flex items-center rounded-xl bg-white/[0.03] border border-white/[0.12] hover:border-white/[0.22] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all duration-200">
          <Lock className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors ml-3.5 pointer-events-none shrink-0" />
          <input
            id="login-password"
            maxLength={128}
            autoComplete="current-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
          />
          <button
            type="button"
            aria-controls="login-password"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
            className="px-3.5 py-3 text-zinc-500 hover:text-zinc-200 transition-colors focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5 backdrop-blur-md"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={busy}
        className="group/btn relative w-full py-3.5 px-6 rounded-xl font-semibold text-xs tracking-wide bg-[#F4F1EA] text-[#090D0F] hover:bg-white transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:shadow-[0_0_32px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
      >
        {/* Shimmer sheen beam */}
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-[300%] transition-transform duration-700 pointer-events-none" />
        {busy ? (
          <LoaderCircle className="w-4 h-4 animate-spin text-zinc-950" aria-hidden="true" />
        ) : (
          <LogIn className="w-4 h-4 text-zinc-950 transition-transform duration-200 group-hover/btn:translate-x-0.5" aria-hidden="true" />
        )}
        <span className="relative z-10 font-sans">
          {busy ? "Opening research workspace…" : "Sign in to Workspace"}
        </span>
      </button>
    </form>
  );
}

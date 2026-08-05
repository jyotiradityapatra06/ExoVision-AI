"use client";

import { ArrowRight, Fingerprint, Lock, Mail, Satellite } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Authentication sequence failed.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-screen max-w-max-width mx-auto">
      {/* Left Side: Immersive Visualization */}
      <div className="relative w-full md:w-3/5 h-1/2 md:h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 z-10 border-b md:border-b-0 md:border-r border-outline-variant/20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-10" />

        <div className="absolute top-8 left-8 flex items-center gap-2 font-data-mono text-data-mono text-primary tracking-widest uppercase">
          <Satellite className="h-5 w-5 text-primary" />
          <span>Telemetry Active</span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="font-headline-lg-mobile md:font-hero-lg text-headline-lg-mobile md:text-hero-lg text-on-surface mb-6 drop-shadow-[0_0_20px_rgba(224,227,229,0.3)]">
            Explore the <br />
            <span className="text-primary font-bold">Universe</span> Through AI.
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md border-l-2 border-primary pl-4">
            Establish a secure uplink to the central observatory network. Access real-time exoplanet transit data and advanced celestial modeling.
          </p>

          <div className="mt-12 flex gap-8">
            <div>
              <div className="font-label-caps text-label-caps text-outline uppercase mb-1">System Status</div>
              <div className="font-data-mono text-data-mono text-primary font-bold">NOMINAL</div>
            </div>
            <div>
              <div className="font-label-caps text-label-caps text-outline uppercase mb-1">Network Latency</div>
              <div className="font-data-mono text-data-mono text-on-surface font-bold">12ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Terminal */}
      <div className="w-full md:w-2/5 h-1/2 md:h-full flex items-center justify-center p-8 md:p-12 lg:p-16 relative z-10 bg-surface/40 backdrop-blur-md">
        <div className="w-full max-w-md relative bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/40 p-8 pt-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="corner-bracket-tl" />

          <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/30 pb-4">
            <Fingerprint className="h-8 w-8 text-primary" />
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wider font-bold">
                Secure Uplink
              </h2>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">
                ExoVision Command Core
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-6 rounded border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-data-mono text-xs text-rose-200" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <label className="block font-label-caps text-label-caps text-outline uppercase mb-2 group-focus-within:text-primary transition-colors">
                Operator ID
              </label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors h-4 w-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. CMD-8842"
                  className="w-full bg-transparent border-0 border-b border-outline-variant text-on-surface font-data-mono text-data-mono pl-8 py-2 focus:ring-0 focus:border-primary focus:shadow-[0_4px_10px_-2px_rgba(0,218,243,0.3)] transition-all placeholder:text-outline-variant/50"
                />
              </div>
            </div>

            <div className="relative group">
              <label className="block font-label-caps text-label-caps text-outline uppercase mb-2 group-focus-within:text-primary transition-colors">
                Access Sequence
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors h-4 w-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-0 border-b border-outline-variant text-on-surface font-data-mono pl-8 py-2 focus:ring-0 focus:border-primary focus:shadow-[0_4px_10px_-2px_rgba(0,218,243,0.3)] transition-all placeholder:text-outline-variant/50"
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary-fixed font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-primary-container hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2 font-bold"
              >
                <span>{loading ? "Initializing..." : "Initialize Uplink"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between mt-2 font-label-caps text-label-caps">
                <Link href="/auth/signup" className="text-outline hover:text-primary transition-colors uppercase">
                  Request Access
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

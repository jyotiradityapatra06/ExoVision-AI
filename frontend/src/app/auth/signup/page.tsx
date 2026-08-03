import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/card";

export default function SignupPage() {
  return <div className="mx-auto max-w-md px-6 py-16"><div className="mb-8 text-center"><p className="section-label">Create account</p><h1 className="mt-3 text-3xl font-semibold text-white">Start your research workspace</h1><p className="mt-3 text-sm text-slate-400">Your uploads, results, and reports remain private to your account.</p></div><Card className="p-7"><SignupForm /></Card></div>;
}

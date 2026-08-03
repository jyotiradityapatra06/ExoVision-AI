import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/card";

export default function LoginPage() {
  return <div className="mx-auto max-w-md px-6 py-20"><div className="mb-8 text-center"><p className="section-label">Research workspace</p><h1 className="mt-3 text-3xl font-semibold text-white">Welcome back</h1><p className="mt-3 text-sm text-slate-400">Sign in to access your analyses and scientific reports.</p></div><Card className="p-7"><LoginForm /></Card></div>;
}

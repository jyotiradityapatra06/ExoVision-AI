"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><LoaderCircle aria-label="Checking account" className="h-7 w-7 animate-spin text-sky-300" /></div>;
  }
  return children;
}

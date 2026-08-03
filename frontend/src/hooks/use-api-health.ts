"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ApiHealth } from "@/types/api";

export function useApiHealth() {
  const [data, setData] = useState<ApiHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    api.health({ signal: controller.signal })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  return { data, isLoading };
}

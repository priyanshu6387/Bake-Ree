"use client";

import { useCallback, useEffect, useState } from "react";
import { accessService } from "@/services/accessService";
import type { AccessContext } from "@/types/access";

export default function useAccessContext() {
  const [accessContext, setAccessContext] = useState<AccessContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const context = await accessService.getContext();
      setAccessContext(context);
      setError(null);
      return context;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load access context";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  return { accessContext, loading, error, refresh };
}

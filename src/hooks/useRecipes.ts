"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/integrations/api/client";
import type { Recipe } from "@/lib/types";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setRecipes(await api.listRecipes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { recipes, loading, error, refresh };
}
